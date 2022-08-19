---
layout: post
title: "ptree.ml part 3: Monadic parser combinators and type-driven development"
tags: [ocaml, ptreeml, parser, monad, types]
usemermaid: true
---

_Note: This is just one post in a series of blog posts about ptree.ml. To see
all posts about it, go [here]({% post_url 2022-08-01-ptree-ml-outline %})_.

In the previous two posts, I finished out the central part of the library: a
definition for the `ptree` and `peditor` data types, as well as a myriad of
different functions for transforming `ptree`s by navigating throughout them with
`peditor`s.

<div class="mermaid">
graph LR
  A(ptree & peditor)
	style A fill:#7bb083
  B(JSON parser)
  C(INI parser)
  D(XML parser)
  E(JSON pretty-printer)
  F(INI pretty-printer)
  G(XML pretty-printer)
  C-->A
  B-->A
  D-->A
  A-->F
  A-->E
  A-->G
</div>

With these data structures in hand, we've unlocked the key information we needed
before starting on parsing: _what are we parsing to?_ As in, what was the end
goal of parsing an INI, JSON, or XML file?

Now, it's really clear: the end goal will be to have some function that takes in
a `string` containing INI (or JSON or XML) and returns a `ptree`.

## A sprinkling of type-driven development

So, roughly speaking, a "parser" will be something that takes a `string` as
input and gives us back a `ptree`.

```ocaml
type parser = string -> ptree
```

But in general, a parser might not consume the entire input as a string. For
example, we might have a parser that parses only a subtree, or only an atomic
value like a boolean or a float. So we need to change this signature to return
what was just parsed, as well as the remaining input left to be parsed.

```ocaml
type parser = string -> (ptree * string)
```

The problem with this (specific to OCaml; it wouldn't be such a big deal in a
language like Haskell, where strings are just lists of characters) is that
strings in OCaml are implemented a bit differently; the tradeoff is that taking
substrings of strings (which is what we would be doing often, since we're
returning the remainder of the input every time) is quite expensive.

Since ultimately parsing boils down to one character at a time, let's instead
use a different data structure to store our input: a `char Seq`. (It's quite
easy to convert from string to sequence using the `String.to_seq` function, and
this one-time operation will enable us to pop characters off the front of the
string in constant time from now on).

```ocaml
type chars = char Seq.t
type parser = chars -> (ptree * chars)
```

But parsing doesn't always just succeed! Sometimes, we may encounter syntax
errors and unexpected characters, so we can't always expect to successfully
parse into a valid `ptree` + remaining input. So, I'll change the output of
a parser to not just be a `ptree * chars`, but a `result` that either contains
the valid parse tuple or a string label that will tell the user what the
parsing failed on:

```ocaml
type label = string
type parse_result = (ptree * chars, label) result
type parser = {
  run: chars -> parse_result;
  label: label
}
```

(Notice I made the `parser` into a record type, so it can store both the
actual parsing function as well as a label to tell the user what the function
is meant to parse.)

Oftentimes, it's helpful not only to show _what_ went wrong while parsing, but
also _where_ it went wrong. This makes it a lot easier for the user to pinpoint
the error in their file (and for us to debug errors in our parser)! To make this
happen, we'll have to modify some things.

```ocaml
type position = { line : int; col : int }

type input_state =
  { unconsumed : chars;
    pos : position;
  }

type parse_result = (ptree * input_state, label * position) result

type parser = 
  { run : input_state -> parse_result;
    label : label
  }
```

Shortly, we'll build some functions for "advancing" the `input_state` to get
new characters from it while also keeping the position up-to-date. Then, when
we throw errors, we can return both the label along with the position where it
occurred, just like we wanted!

One last change to make: it's kind of too restricting that our parser can only
parse `ptree` values. Maybe we just want a parser that parses a character, or a
string (not `ptree` `String`) value. With some easy type parameterization, we
don't have to limit ourselves to just parsing `ptree`s!

(In some implementations, even the fact that the input state yields characters
can be parameterized, so `input_state` can yield single bits, or even complex
data structures. We won't bother with this for now.)

```ocaml
type chars = char Seq.t
type label = string
type position = { line : int; col : int }

type input_state =
  { unconsumed : chars;
    pos : position;
  }

type 'a parse_result = ('a * input_state, label * position) result

type 'a parser = 
  { run : input_state -> 'a parse_result;
    label : label
  }
```

These type declarations will give us all the structure we need to start building
our foundations of our parser!

Before moving on, some helper functions for working with these types.

A really common thing we'll need to do is to get the next character from the
`input_state`. So let's implement that!

Firstly, some easy functions to increment column and line number of `position`s:

```ocaml
let next_col pos = { pos with col = pos.col + 1 }
(* When we move to a new line, we go to the beginning of that line, 
   so we always zero out the column number *)
let next_line pos = { line = pos.line + 1; col = 0 }
```

Ok, let's think about what to do for getting the next character.
- Well, there's a case for having no characters left. So we can't just return
  a `char`; we need to return a `char option`. If there's no characters left in
  `unconsumed`, we just return `None` and don't increment the position in any
  way.
- If there is a character left in `unconsumed`, we either
  - Increment the line number if that character is a newline, or
  - Increment the column number if that character is anything else.

That's the idea! Here's that same thing, in code.

```ocaml
let consume_char input =
  match input.unconsumed () with
  | Nil -> None, input
  | Cons (f, r) ->
    let new_pos = input.pos |>
      if f == '\n' then next_line else next_col in
    Some f, { unconsumed = r; pos = new_pos }
```

The type signature of `consume_char` is `input_state -> char option *
input_state`, which makes sense; we optionally return a character, and along
with that we also return the `input_state` after the character has been popped
out.

Some other helper functions, for making an `input_state` out of a `string`, and
making a `parser` out of a `input_state -> 'a parse_result` function:

```ocaml
(* Hopefully these are pretty self-explanatory. Convert str to seq, and
   set position to zeroth char of zeroth line. *)
let make_input str =
  { unconsumed = String.to_seq str;
    pos = {line = 0; col = 0};
  }

(* Make the default label something obnoxious so we'll know to
   change it later *)
let make_parser f =
  { run = f; label = "UNSET LABEL" }
```

I want to stress that this is very little code. We've just crafted a small
handful of simple type declarations and small helper functions to go along with
them. Yet this is all we need, even for something as complex as a JSON parser.
Isn't that beautiful?

## The Four Elements
We start by introducing three incredibly primitive parsers, and one incredibly
simple yet powerful function to "glue" them together. It won't seem like much,
but you'll quickly see how they can be combined to build up very complex parsing
behavior.

The first primitive parser is `return`, sometimes called `result` (but since
OCaml's standard library already defines something named `result`, I'll just use
`return`). All `return` does is takes a value, and returns a successful parse
(`Ok`) with that value as the parsed result. It doesn't even touch the input.

```ocaml
let return v = make_parser @@ fun input -> Ok (v, input)
```

So for example, let's suppose we had an input made from the string "hello":
```ocaml
let hello = make_input "hello"
```

Then:

```ocaml
let parses_3 = return 3
parses_3.run hello
(* Ok (3, hello) *)
```

Second primitive parser: `zero`. It just gives up without even trying and
returns an error without even touching the input.

```ocaml
let zero = make_parser @@ fun input -> Error ("UNSET LABEL", input.pos)
```

```ocaml
zero.run hello
(* Error ("UNSET LABEL", hello.pos) *)
```

Those two parsers do incredibly little. This one at least checks the input. Our
last primitive, `item`, gets one character out of the input and returns an `Ok`
regardless of what that character is. The only case where it fails is if there
are no characters left in the input.

```ocaml
let item = make_parser @@ fun input ->
  match consume_char input with
  | None, _ -> Error ("Unexpected end of input", input.pos)
  | Some f, r -> Ok (f, r)
```

Let's see how our last primitive parser fares against `hello`:
```ocaml
item.run hello
(* Ok ('h', <updated input state>)) *)
```

While it does have the most logic of the three, it's still remarkable how little
logic any of them contain. They're all super useless on their own. But by
building them up, we can create super useful behavior. And the key function for
building is the monadic `bind`, which will allow us to glue the results of
parsers together.

Funnily, the concept of monads and monadic bind is famously difficult to
explain, and I don't think I'm about to do a great job here.

`bind` takes a parser (in general, a _monad_), and a function for creating
parsers. It runs the parser on the input. If the parser is successful in
running, it gives us back some output and some transformed input. We then
pass that output into the provided function, which will return a different
parser. Finally, we run that parser on the transformed input.

```ocaml
let bind p f = make_parser @@ fun input ->
  match p.run input with
  | Error x -> Error x
  | Ok (v, input') -> (f v).run input'
```

It's customary to use the infix operator `>>=` for monadic bind, and we'll do
the same here.

```ocaml
let ( >>= ) = bind
```

Lost? Me too. Let's look at an example of it in action. We'll define a parser
called `satisfies`, which is like `item` but only returns `Ok` if the character
satisfies a given predicate.

```ocaml
let satisfies predicate =
  item >>= fun c -> if predicate c then return c else zero
```

So what's going on here? What's the bind doing?

First, `item` is run on the input. If there is some character left in the input,
`item` succeeds. `>>=` then passes that character `c` into the function on its
right-hand side, which in this case is that lambda function.

The lambda function returns a parser. Here, situationally if the `predicate` is
satisfied by `c`, we return the parser `return c` (which, if you recall, will
return `Ok (c, input)` without further touching the input). If it's not
satisfied, we return instead the parser `zero` (which fails no matter what).

To extend this example, let's define a `parse_char` function, which parses
successfully _only if_ the next character of the input is exactly a certain
character.

```ocaml
let parse_char x = satisfies (fun c -> c == x)

let parse_h = parse_char 'h'
let parse_q = parse_char 'q'
```

So what happens when we call `parse_h.run hello`?

- First of all, `item` gets called on `hello`, which returns `Ok('h', <input
  advanced by 1 char>)`.
- Since `item` ran successfully, `'h'` gets passed by bind into the lambda
  function on the right-hand side of the `>>=` operator.
- `predicate 'h'` is evaluated. Since the predicate is `fun c -> c == x`, and
  `'h' == 'h'`, this expression evaluates to **true**.
- Thus `return 'h'` is returned from the lambda.
- `return h` is then run on the remaining input returned from `item` by `bind`.
- `return` always just returns `Ok` without touching the input, so what's
  ultimately returned is `Ok ('h', <input advanced by one char>)`.

Ok, how about `parse_q.run hello`?

- First of all, `item` gets called on `hello`, which returns `Ok('h', <input
  advanced by 1 char>)`.
- Since `item` ran successfully, `'h'` gets passed by bind into the lambda
  function on the right-hand side of the `>>=` operator.
- `predicate 'h'` is evaluated. Since the predicate is `fun c -> c == x`, and
  `'h' <> 'q'`, this expression evaluates to **false**.
- Thus `zero` is returned from the lambda.
- `zero` is then run on the remaining input returned from `item` by `bind`.
- `zero` always returns an error without looking at the input, so what's
  ultimately returned is `Error ("UNSET LABEL", <position advanced by one char
  by item>)`.

And finally, what happens if we do `parse_h.run (make_input "")` (call it on
empty input)?

- First of all, `item` gets called on `hello`, which returns `Error`.
- Since `item` returned `Error`, an `Error` is immediately returned by bind,
  and there is nothing to pass to the lambda.

That's `bind`!

Before we move on to using `bind` to make some cool toys, let's pay some
attention to the parser labels. We need to be able to override that default
obnoxious `UNSET LABEL` to something more descriptive based on the what the
parser does. The way we are going to do this is just go ahead and run the parser
with the input, and if an error happens, substitute in the label we want to use:

```ocaml
let set_label p lbl =
  let relabeled_run = fun input -> match p.run input with
  | Ok v -> Ok v (* If it runs successfully, great! Label doesn't matter *)
  | Error (_, p) -> Error (lbl, p) in (* Swap in new label for error *)
  { run = relabeled_run; label = lbl }
```

Now, we can "rename" parsers as we build them up, to keep them all nice and
human-readable.

## Conjunctions, `many`, and `map`
We'll end this post by building four more _extremely_ handy functions. It'll
be probably the last amount of serious "logic" we need to put into our library,
surprisingly, and after we get these out of the way, parsers will almost be
itching to build themselves.

A common thing we might want to do is run one parser, then immediately run
another. For example, let's say we want to parse "he", instead of just one
character 'h'. We _wish_ we could do something like this:

```ocaml
let parse_he = and_then (parse_char 'h') (parse_char 'e')
```

Well, it won't exactly be like this, since concatenation doesn't really make
sense when what's returned from the parser is not a character or string, but
we'll get something really close: returning a tuple `('h', 'e')`.

Ok, so we want to run one parser, then if it succeeds run the next. If both
succeed, we can then return a tuple containing both parse results. Sounds like
the perfect job for `bind`!

```ocaml
let and_then p1 p2 =
  (p1 >>= fun v1 ->
  p2 >>= fun v2 -> return (v1, v2))

  (* set the default label to be something nice *)
  <?> (Printf.sprintf "%s followed by %s" p1.label p2.label)
```

(I hope `bind` is making a bit more sense now; if `p1` runs successfully, then
we get the value `v1` as the parse result; ignoring that for the time being, we
then run `p2` on the remaining input, and if that succeeds as well we get `v2`
as its parse result. We then use `return` to return back an `Ok (v1, v2)`.)

And, since it _is_ a conjunction after all, it's nice to define an infix
operator so we can read it as such:

```ocaml
let ( *>>* ) = and_then
```

Another really common case is _or_, as in we want to parse either one parser
_or_ another (think how, for a JSON value, we can parse a number _or_ a string
_or_ a boolean).

This one is not as fit for `bind`, since we actually want to do something in the
`Error` case instead of just returning the error, but luckily the logic is
pretty simple: run the first parser, and if it succeeds, just return that
result; if it fails, try running the second parser.

```ocaml
let or_else p1 p2  = (make_parser @@ fun input ->
  match p1.run input with 
  | Ok v -> Ok v
  | Error _ -> p2.run input)
  <?> Printf.sprintf "%s or %s" p1.label p2.label
```

Notice that the function signature for this one is `'a parser -> 'a parser -> 'a
parser`: we cannot use `or_else` with parsers that return different values.
Which makes sense! we can't have a function be returning different types, after
all, so of course we can't `or_else` a boolean parser and a string parser
together and have it sometimes return a boolean and sometimes return a string.

Much like `and_then`, we'll define an infix operator for this one as well:

```ocaml
let ( <|> ) = or_else
```

It's also really common that we might want to parse multiple of the same parser
over and over until it fails. Think how a string is just a character parser
repeated over and over, or how we might want to ignore all of the whitespace in
a certain spot. That's where `many` comes in.

Yes, you can probably use `and_then` over and over, but the problem is
`and_then` returns tuples, so you'll be getting back super-nested results like
`(((((((((a, b), c), d), e), f), g), h), i), j)`. With `many`, we'll instead
simply return a list of each successful parse (and an empty list if there were
no successful parses).

```ocaml
let many p =
  (* It's probably possible to build this off of and_then, but
     I just found this implementation cleaner and more intuitive. *)
  let rec multiple p = fun input ->
    match p.run input with
    | Error _ -> [], input
    | Ok (v, input') -> let vs, rem = multiple p input' in
      v::vs, rem in
  { run = (fun input -> Ok (multiple p input));
    label = Printf.sprintf "zero or more of %s" p.label;
  }
```

Looks a bit hairy at first, but it's not that bad. We define a helper function,
`multiple`, which tries to run the parser on the input. If it fails, we return
the empty list and the unchanged input. If it succeeds, we recur, trying to run
the same parser again on the remaining input, and `cons`ing the result into
a list.

Note that `many` always returns `Ok`, as if it fails immediately it just returns
an empty list. In the next blog post, I'll build a parser that enforces that
at least one match must occur, and fails if it doesn't.

Now we can do stuff like this:
```ocaml
(many parse_h).run @@ make_input "hhhello"
(* Ok (['h' ; 'h' ; 'h'], <remaining input>) *)
```

Finally, we often might want to _transform_ a raw parse result somehow before
returning it back to the user. Think back to our `parse_he` function; wouldn't
it be nice if we could return a string, instead of a tuple of two characters?

That's where `map` comes in. It allows us to transform the result of a parse.

Hello, `bind`!

```ocaml
let map f p = (p >>= fun v -> return (f v)) <?> p.label
let ( |>> ) p f = map f p
```

So `p` is run; if it runs successfully, we return the _transformed_ value
`f v`. Makes sense! Now, we can do something like this:

```ocaml
let parse_he = (parse_h *>>* parse_e)
  |>> (fun (a, b) -> Printf.sprintf "%c%c" a b)
```

(Parse an `h` and then parse an `e`, and if that all works take the resulting
tuple and convert it back to a two-character string.)

```ocaml
parse_he.run hello
(* Ok ("he", <remaining input>) *)
```

---

In this post, we started by coming up with type declarations for the parser by
thinking about what we needed and how to express that in terms of types. Then,
we defined three primitive parsers `return`, `zero`, and `item`, as well as a
key function for combining parsers, the monadic `bind`. Finally, we defined some
incredibly helpful functions, which we'll use in the next post to really start
parsing some actual text:
- `and_then`, which runs one parser after another
- `or_else`, which tries running one parser, and if it fails tries another one
- `many`, which runs a parser repeatedly and returns a list of parsed results
- and finally `map`, which allows us to "stick functions onto the end of
  parsers" and transform the raw output of the parser.

If these functions still seem kind of confusing to you, read on! Hopefully, in
the next post, things will really start coming together, as we use these
functions to create actually useful things for our INI, JSON, and XML parsers.
