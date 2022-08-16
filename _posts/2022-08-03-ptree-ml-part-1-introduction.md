---
layout: post
title: "ptree.ml part 1: Introduction and Basic Setup"
tags: [ocaml, ptreeml, types, data]
usemermaid: true
---

This will be the first post in a long series where I document the process of
building a new project, which I've called "ptree.ml".

## The spec
This project is inspired by Boost's
[PropertyTree](https://www.boost.org/doc/libs/1_65_1/doc/html/property_tree.html)
library, but for OCaml. Different data serialization formats such as INI, JSON,
XML, and YAML are, at their core, pretty similar; they can be viewed as a tree,
where keys in the tree can either point to "leaves" -- individual atoms, such
as strings, numbers, booleans, etc. -- or "branches", which are subtrees that
contain more of these key-value pairs.

The goal of this project is to serve as a "universal adaptor" between these
different serialization formats (so far just INI, JSON, XML, and YAML, but more
could be added). ptree.ml users would be able to easily read in a file of their
choice, get out specific values or iterate through branches, modify the tree
(we'll stick to doing so in an immutable, persistent manner), and write it out
to any file format (even if it's different from the file they read it in from).

I plan to make modification more efficient by using a Zipper data structure, and
use parser combinators to do the input reading. The API for editing property
trees will be something reminiscent of Unix filesystem commands, e.g. `rm`,
`cd`, `ls`, `mv` and more. This will hopefully be fairly intuitive and easy to
use.

As for output, it should be fairly simple to write back out to a file, as
subtrees in all of these file formats look identical to the base tree, so simple
recursion will do. I want ptree.ml to output clean, indented, human-readable
output.

What this project is _not_ going to be is:
- A precise, down-to-the-spec implementation of INI, JSON, XML, and YAML
  formats. This is just way too long and tedious (the XML spec is 59 pages,
	the YAML spec is 66, etc), and at that point really not contributing much
	to my own learning or interest.
- A highly efficient, industry-ready library. I'm going to be folding my own
	parser combinator library from scratch, even though I'm sure much faster and
	more flexible libraries already exist. And let's not even think about
	streaming I/O, parallelization, and memory efficiency for large files.
- Round-tripping files (i.e. parsing XML and writing it back out will not give
	you an identical file). This just doesn't make sense, as there could be
	comments we lose, or different ways to express the same data.

## Setting up the central piece
So, while the library is going to look something like this:

<div class="mermaid">
graph LR
  A("magic")
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

Instead of building from the "bottom-up" (i.e. left-to-right: making the parsers
first, then the central part, then the pretty-printer), I'm actually going to
start from the middle and work my way outward. This is because I'll be defining
some very central data structures that the parsers need to parse to, and those
same data structures will also need to be used by the pretty-printers to
generate the output.

Ok, so let's think about it. What data structures will I need? Well at the
heart, INI, JSON, and XML really have similar structures, if we ignore all of
the syntactic stuff. For example, take these three examples, which are just INI,
JSON, and XML respectively, representing the same data.
```ini
[person]
name = Brandon Gong
is_cool = true
favorite_number = 3.1415
```
```json
{
  "person": {
    "name": "Brandon Gong",
    "is_cool": true,
    "favorite_number": 3.1415
  }
}
```
```xml
<person>
  <name>Brandon Gong</name>
  <is_cool>true</is_cool>
  <favorite_number>3.1415</favorite_number>
</person>
```

Sure, the syntax looks pretty different, but really they are all representing
this:

<div class="mermaid">
graph TD
	A(person)
	B(name)
	C(is_cool)
	D(favorite_number)
	E(Brandon Gong)
	F(true)
	G(3.1415)

	A-->B
	A-->C
	A-->D
	B-->E
	C-->F
	D-->G
</div>

So we have some nodes that are "leaf nodes" - i.e. they have no children below
them: `Brandon Gong`, `true`, and `3.1415` are all leaf nodes. And we have some
branch nodes, like `person` and `name`, which don't hold any data themselves
and just serve to give names to categories and subcategories of those leaf
nodes.

With that distinction in mind, we can think about making some sort of tree
data structure, like so:
```ocaml
type 'a ptree =
  | Leaf of 'a
  | Tree of 'a ptree
```

This is really not great for several reasons, the most glaring of which is that
since the `Tree` variant only stores one `ptree`, we can never have more than
one branch (e.g. one `ptree` can never point to two sub-`ptree`s), so what we've
essentially done here is made a linked list implementation.

Well, we can try to address that by storing a _list_ of `ptree`s instead of just
a single one in the `Tree` variant:

```ocaml
type 'a ptree =
  | Leaf of 'a
  | Tree of 'a ptree list
```

And this is heading in the right direction, since now we can actually make
non-trivial trees instead of just one-dimensional linked lists. The only problem
is I would like to be able to lookup child trees by name (e.g. in our example
above, I would like to be able to lookup the `name` subtree from the `person`
tree using the string `"name"`). The list wouldn't _not_ work, but doing this
string lookup would be quadratic time, as we would have to compare each string
in the list in the worst case, and string comparison itself is also linear.

A better way to do it is to use a data structure more suited for the task, a
`Map`. (Yes, there's also a `Hashtbl` in OCaml, but it's mutable, and mutable
things are Not Cool™ for a variety of reasons.)

In OCaml, to get a `Map` data structure that uses a certain type (here we want
to use `string`) as its key, we need to use the `Map.Make` functor.

```ocaml
module StrDict = Map.Make(String)
```

Ok, so now we've got a dictionary-esque data structure that stores mappings from
string keys to values of any type. Let's swap that in for the list
implementation we were using earlier.

```ocaml
type 'a ptree =
  | Leaf of 'a
  | Tree of 'a ptree StrDict.t
```

Really close! The only problem now is that with this implementation, our tree
would only be able to store one type at a time throughout the entire tree, since
the `'a` paramaterization is also enforced on children nodes. But actually, in
our property tree, we have many different leaf nodes with different types. Take
a look back at our example! We have the string `"Brandon Gong"`, the boolean
`true`, and a floating-point value `3.1415`.

So really, instead of just one blanket `Leaf` variant that can only store one
type at a time, there's a lot of different possible leaves. Sort of arbitrarily,
I've picked the different leaves we can have to be `Int`, `Float`, `String`,
`Boolean`, `Null`, and `Array`. This is a good set of different primitive
types to work with; it's pretty thorough.

```ocaml
type ptree =
  | Int of int64
  | Float of float
  | String of string
  | Boolean of bool
  | Null
  | Array of ptree array
  | Tree of ptree StrDict.t
```

(I chose `int64` instead of `int` just to try to make it as widely useful as
possible, since some serialization formats may not make the distinction.)

So this is pretty well good and all. We can recreate the example earlier using
our shiny new `ptree` data definition like this:

```ocaml
let example_tree =
  let tree = StrDict.empty
    |> StrDict.add "name" (String "Brandon Gong")
    |> StrDict.add "is_cool" (Boolean true)
    |> StrDict.add "favorite_number" (Float 3.1415) in
  Tree tree
```

...ok, that was oddly painful. Even worse, what if I decide that friendship
ended with pi, and now _e_ is my best friend?

```ocaml
let updated_tree =
  match example_tree with
  | Tree t -> Tree (StrDict.add "favorite_number" (Float 2.7183) t)
  | _ -> (* Should never be here?? *)
```

That's already quite a surplus of mess (and quite a deficit of legibility) just
to update one property, and you can just imagine what a mess of `match`
expressions and parentheses we would have to have to change a property that was
maybe a few subdirectories deep.

So no, this won't do.

Luckily, in the CSCI0190 course I took at Brown last year with Professor Shriram
Krishnamurthi, I was introduced to a really beautiful data structure in one of
the assignments, which I later found out to be called a
[zipper](http://learnyouahaskell.com/zippers). I found the concepts to be quite
immediately applicable to my own use case.

The basic concept behind the zipper is to store a specific location within the
tree. Everytime we descend into a subdirectory, we don't "forget" about the
old zipper; we keep track of it, and we can easily pop back up to it whenever
we are done making the changes.

```ocaml
type peditor =
  { under: ptree;
    above: peditor option;
  }
```

So the `peditor` (aka Property Editor) stores the sub-`ptree` that is directly
under it, as well as its parent `peditor`. It's a `peditor option` and not just
a `peditor` because when we are at the root, there is no parent!

This zipper implementation is a bit different from the one I did in the course,
because unlike that one, we don't really care about lateral movement between
siblings here (normally there would be a `left` and `right` list as well stored
in the zipper). What's really important for this use-case is to be able to move
in and out of directories easily.

One tweak I'll have to make is, instead of just storing the parent `peditor`,
I also need to store the string key in the parent tree node that points to the
`ptree` that this `peditor` is currently on. This makes it so that when we pop
back up, we know which key in the parent `StrDict` to update.

```ocaml
type peditor =
  { under: ptree;
    above: (string * peditor) option;
  }
```

For example, if our `peditor` is pointed at the `name` node in our example tree,
its `under` property would be a `String "Brandon Gong"`, and its above property
would be `Some ("name", <peditor pointing at the person node>)`.

We can define some helpful things now! An `empty` `peditor` is just a peditor
pointing to the root node of an empty tree, i.e. a tree that has no bindings,
i.e. a `Tree (StrDict.empty)`.

```ocaml
let empty = { under = Tree(StrDict.empty); above = None; }
```

And given an existing `ptree`, to "attach" a `peditor` to it we simply need to
put it at the root of the `ptree`, i.e. define its `under` value to be the whole
`ptree`, and have nothing above it (since it's the root).

```ocaml
let peditor_of_ptree pt = match pt with
  | Tree _ -> { under = pt; above = None; }
  | _ -> raise @@ Ptree_exception "Cannot create peditor from non-Tree node."
```

Note I used a custom exception type earlier. It's just a generic exception used
throughout ptree.ml, to distinguish it from other errors. It's nothing special,
so don't worry too much about it. It's just a `exception Ptree_exception of
string`.

These two type declarations, `ptree` and `peditor`, are the two central types
of the library. Next post, I'll expand on the `peditor` type, and write some
helpful functions to navigate throughout and make edits on the `ptree`.

If the `peditor` type doesn't quite make sense yet, read on! It's usefulness,
and why we store what we store, will become a lot more clear once I write some
functions that work with it.
