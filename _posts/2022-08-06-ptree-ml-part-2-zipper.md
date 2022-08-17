---
layout: post
title: "ptree.ml part 2: Fleshing out the zipper"
tags: [ocaml, ptreeml, zipper, data]
usemermaid: true
---

_Note: This is just one post in a series of blog posts about ptree.ml. To see
all posts about it, go [here]({% post_url 2022-08-01-ptree-ml-outline %})_.

In the [previous blog post]({% post_url 2022-08-03-ptree-ml-part-1-introduction
%}), I defined two data structures that will be used throughout the ptree.ml
library: the `ptree`, or property tree, and the `peditor`, or property editor.

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

```ocaml
type peditor =
  { under: ptree;
    above: (string * peditor) option;
  }
```

Recall that the motivation for defining a `peditor` is that editing `ptree`s
directly is very cumbersome and syntactically messy. The `peditor` will be able
to move into and back up out of subdirectories, making edits relative to its
current position. The ultimate goal is to "hide away" as much of the messy logic
as possible and expose an easy API to the user.

So with that, let's get started by implementing some basic movements with the
`peditor`!

## Baby Steps
Let's figure out how to move _downward_ first, that is, moving the `peditor`
from one directory into a certain subdirectory. We'll call this function
`cd_single`, named such because `cd` hearkens back to the Unix terminal command
`cd` (change directory), and `single` because we're only going to worry about
`cd`ing one single directory for now (and handle `cd` with whole paths later).

```ocaml
let cd_single p dir_name = ...
```

(where `p` is a `peditor`, and `dir_name` is the string name of the subdirectory
to enter.)

The first, most obvious thing to check is whether or not the `peditor` is
currently positioned over a `Tree` node. If not, it's not even in a directory,
so the concept of "entering a subdirectory" doesn't make any sense at all.

```ocaml
let cd_single p dir_name =
  match p.under with
  | Tree t -> (* something... *)
  | _ ->
    (* We are not on a Tree node, so we can't cd into anything. *)
    raise @@ Ptree_exception "peditor is not on a Tree; cannot cd."
```

Ok, now assuming `p.under` is really a `Tree`, now we also need to check that
the requested subdir actually exists within that `Tree`. If not, we can't `cd`
into a non-existent directory (just doesn't make any sense), so we raise an
exception.

```ocaml
let cd_single p dir_name =
  match p.under with
  | Tree t -> (
    match StrDict.find_opt dir_name t with
    | Some subdir -> (* Do something... *)
    | None -> raise @@ Ptree_exception "Key not found; cannot cd.")
  | _ ->
    (* We are not on a Tree node, so we can't cd into anything. *)
    raise @@ Ptree_exception "peditor is not on a Tree; cannot cd."
```

That's actually the brunt of the logic. All we have to do now is return the new
`peditor` struct pointing to that subdirectory. We do that easily like this:

```ocaml
{ under = subdir; above = Some (dir_name, p) }
```

(For the new `peditor` element, what is directly `under` it is that subdirectory
we just found. And we keep a reference the old `peditor` element in `above`,
storing it along with the directory name that points to this subtree.)

With `cd_single` done, it actually becomes super trivial to implement `cd`,
with just a simple `fold_left` to `cd_single` into one directory at a time in
a list of directories. Below is the full listing of the `cd` function:

```ocaml
let cd path pe =
  let cd_single p dir_name =
    match p.under with
    | Tree t -> (
      match StrDict.find_opt dir_name t with
      | Some subdir -> {under = subdir; above = Some (dir_name, p)}
      | None -> raise @@ Ptree_exception "Key not found; cannot cd.")
    | _ ->
      (* We are not on a Tree node, so we can't cd into anything. *)
      raise @@ Ptree_exception "peditor is not on a Tree; cannot cd." in
  List.fold_left cd_single pe path
```

Sometimes, users may prefer for us to return an option instead of throwing an
exception whenever something goes wrong. It's also good for users, since it
forces them to think about the case where the path doesn't exist in the tree.

Since we're going to be converting functions from their partial form relatively
frequently, we can just go ahead and define some helper functions to make it
nice and functional:

```ocaml
let make_opt1 f x = try Some (f x) with Ptree_exception _ -> None
let make_opt2 f x y= try Some (f x y) with Ptree_exception _ -> None
```

`make_opt1` takes unary functions that may throw `Ptree_exception` and has them
return `None` instead of an exception if something happens, and `make_opt2` does
the same but for binary functions. `cd path pe` takes two arguments (`path` and
`pe`), so we'll use the latter to make an `option` version of `cd`.

```ocaml
let cd_opt = make_opt2 cd
```

Ok, great! So now we have a `peditor` and it can move down into subcategories
and subcategories.

---

Well, it makes sense to code up the opposite action now: we can go down, so
let's figure out how to come back up.

In the Unix terminal, this can be achieved with `cd ..`, but I don't really want
`cd` to do weird stuff based on whether or not the path is `..`, so I'll just
make a new name for this function: `parent`.

The first thing we need to do is check to see if there's even a `peditor`
parent; if we're at the root directory, we won't have any parent to go to!
Conveniently, we store a reference to the parent as part of the `peditor` type.

```ocaml
let parent pe = match pe.above with
  | None ->
    (* This peditor has nothing above it, raise exception. *)
    raise @@ Ptree_exception "Already at the root; no parent to go to."
  | Some (k, ppe) -> ...
```

You may think: oh, in the `Some` case, we already stored the `peditor` pointing
at the parent directory, so all we have to do is return `ppe` to get back the
`peditor` pointing at the parent directory!

And you would be almost right, yet very wrong.

The thing is, even though you've changed the child `peditor` by potentially
editing the subtree underneath, the parent still stores its own copy of the
whole subtree (which sounds inefficient, but it's really not -- since everything
is immutable, it's really just a few references changed, not multiple redundant
copies of the same thing). If we just blindly return the `peditor` from `above`,
we'll lose all of the changes we just made in the subtree, since the parent
`peditor` never knew about them.

So, what we instead have to do is update this subtree in the parent `peditor`.
Here's where storing that key along with the parent `peditor` comes into play!
We know the key that is associated with this subtree in the parent's `StrDict`,
so we just put this new (potentially updated) subtree into the parent's
`StrDict` at that key, and leave everything untouched.

Here's the full code listing of `parent`, then.

```ocaml
let parent pe = match pe.above with
  | None ->
    (* This peditor has nothing above it, raise exception. *)
    raise @@ Ptree_exception "Already at the root; no parent to go to."

  | Some (k, ppe) ->
    (* It does have a parent peditor, ppe, and its key in that parent is k *)
    let updated = get_tree ppe.under |> StrDict.add k pe.under in
    { ppe with under = Tree updated }
```

And, just like `cd`, I can also make an `opt` version of `parent`:

```ocaml
let parent_opt = make_opt1 parent
```

And trivially, I can now implement a function that resets the `peditor` back
so it points at the root directory, regardless of where it is in the tree, just
by calling `parent` until there are no more parent directories to go to.

```ocaml
let rec root pe = match parent_opt pe with
  | None -> pe
  | Some ppe -> root ppe
```

---

The last major function that requires a serious amount of work is the `put`/
`put_path` functions, which put `ptree` data into the tree. The reason why I
can't simply just build this functionality off of `cd` is because unlike `cd`,
if we try to put some data at a path that doesn't exist, we want to _create
subdirectories until the path exists_, not just give up and fail.

Let's focus on just `put` first, without thinking about the path stuff. One
thing I needed to check is that we aren't overriding the root directory with a
non-`Tree` `ptree` value. This might change later, but I really wanted to
maintain the root as a `Tree` for now.

So what we'll do is first see if we're at the root, and if so make sure the
`ptree` value we're trying to `put` is of the `Tree` variant.

```ocaml
let put pt pe =
  let modified = {pe with under = pt} in
  (* Check to see if this node is the root node (i.e. nothing above it) *)
  match pe.above with
  | None -> (
    (* Since we are on the root, we have to make sure pt is a tree. *)
    match pt with
    | Tree _ -> modified
    | _ -> raise @@ Ptree_exception "Cannot set root node to non-dict value.")
  | Some _ -> modified

```

Now, onto `put_path`.

```ocaml
let rec put_path pt path pe = match path with
  | [] -> put pt pe (* base case: path empty, just put here *)
  | f::r -> ...
```

As I said before, I don't want to fail if the provided `path` we want to put
`pt` at doesn't exist in the subtree pointed to by `pe`.

So what we can do is _try_ to `cd` into the subdirectory specified by `f`. If
it works, then great, continue onward.

```ocaml
let rec put_path pt path pe = match path with
  | [] -> put pt pe
  | f::r -> (match cd_opt [f] pe with
    | Some p ->
      (* We were able to cd into this subdirectory; now just recur on put_path
         for the remaining subdirs and, when done, call `parent` to cd back out
         to the original directory. *)
      parent @@ put_path pt r p
    | None -> (* subdirectory doesn't exist -- what do we do? *)
```

If the subdirectory doesn't exist, we have two cases we need to deal with
separately.
- We might be on a `Tree` node that just happens to not contain the desired
  subdirectory. If so, we just need to add the subdirectory to it (by inserting
  a binding with the subdirectory name mapping to the empty StrDict).
- We're not even on a `Tree` node. In this case, our only choice is to overwrite
  the existing data, replacing it with a new `Tree` node that contains the
  subdirectory we desire.

Here's the full code listing for `put_path`. Note how, in the `None` case for
`cd_opt`, we match again to determine what type `pe.under` is, and treat those
two cases accordingly.

```ocaml
let rec put_path pt path pe = match path with
  | [] ->
    (* `path` is empty, so we just put the value here and return. *)
    put pt pe
  | f::r -> (match cd_opt [f] pe with
    | Some p ->
      (* We were able to cd into this subdirectory; now just recur on put_path
         for the remaining subdirs and, when done, call `parent` to cd back out
         to the original directory. *)
      parent @@ put_path pt r p
    | None ->
      let mt_tree = Tree StrDict.empty in
      let add_mt = StrDict.add f mt_tree in
      (* Ok, so the subdirectory doesn't exist, which is why cd failed. Now,
         we check if our peditor is currently on a Tree node. *)
      match pe.under with
      | Tree t ->
        (* If so, great! We can simply add the new key into the dictionary
           so that we can cd into it next time we try. *)
        put_path pt path {pe with under = Tree (add_mt t)}
      | _ ->
        (* If not, we'll have to replace whatever's there with an empty dict.
           We then add our desired key as a subdirectory to this new dict. *)
        put_path pt path {pe with under = Tree (add_mt StrDict.empty)})
```

We've now built up our three key operations for the `peditor` -- `cd`, its
opposite `parent`, and `put`. From these three operations, we can begin to 
compose up more complex behavior for the `peditor`.

## More actions!

Another glaring action we're currently missing is the counterpart to `put`: a
function to get `ptree` data _out_ of the `peditor`. Sticking with the Unix
naming conventions, I've decided to call the function `cat`, since in the
terminal calling `cat` on a file prints its contents out.

With `cd` in hand, the implementation of `cat`, `cat_path`, and `cat_path_opt`
are actually super trivial:

```ocaml
let cat pe = pe.under

(* Unlike put_path, here we can use cd, because if it fails we have nothing to
   cat. *)
let cat_path path pe = cd path pe |> cat
let cat_path_opt = make_opt2 cat_path
```

Notice that I call `cd` on `pe`, but never use `parent` to pop back out to
where we were. This is okay because the "modified" `peditor` is never actually
returned, and the original `pe` passed into the `cat_path` function call is
immutable and thus is the same as it was bfore.

By combining `cat_path` and `put_path`, I can easily implement `cp`, which
is a function that allows us to copy whole subtrees of data from one path to
another.

```ocaml
let cp source dest pe = cat_path source pe
  |> fun d -> put_path d dest pe
```

We also need to be able to delete things using the `peditor`. One thing I need
to be a bit careful of here is to not permit deleting the root directory, as
that would leave us with a completely degenerate `peditor`. Like `put` for
`put_path`, I've pulled the operation for removing whatever the `peditor` is
currently pointing at into a separate function, `rm`, which I'll then use to
build `rm_path`.

Instead of just straight up discarding the thing we just removed, I thought it
would be nice to return the deleted value in a tuple alongside the `peditor`
after deletion. Then the user who called the function can decide what they want
to do with it. (Sometimes using the value that was just popped out is very
handy!)

```ocaml
let rm pe =
  (* This is pretty straightforward, we just need to make sure we aren't
     deleting the root. *)
  match pe.above with
  | Some (k, p) -> let t = get_tree p.under in
    {p with under = Tree (StrDict.remove k t)}, StrDict.find k t
  | None -> raise @@ Ptree_exception "You cannot rm the root directory."

let rm_opt = make_opt1 rm
```

Ok, now we can implement `rm_path`. Big distinction here between this one and
`cat_path`: since we're returning the `peditor` itself, we need to make sure
we leave it in the same place that we found it after we `cd` to the subdirectory
and call `rm`.

To make this happen, we need to call `parent` on the `peditor` (_n_ - 1) times
after we've called `cd` and `rm`, where _n_ is the length of the path. (We only
need to go up (_n_ - 1), and not _n_, since `rm` deletes one depth already.)

So I first define a helper function, `apply_n`, which applies the given function
a certain number of times. We use this to call `parent` repeatedly and pop us
back out to the original location after we've made the edits.

```ocaml
let rec apply_n n f x =
  if n <= 0 then
    x
  else
    apply_n (n-1) f (f x)
```

```ocaml
let rm_path path pe =
  let pop_out = apply_n (List.length path - 1) parent in
  cd path pe
  |> rm
  |> fun (p, d) -> (pop_out p, d)

let rm_path_opt = make_opt2 rm_path
```

I can immediately reap the benefits of `rm_path` returning _both_ the modified
`peditor` as well as the deleted element to define `mv`, which moves an element
from one path to another. You'll see it looks very similar to `cp`, except
instead of using `cat` to get a copy, I'm using `rm` to kick the old copy out.

```ocaml
let mv source dest pe = rm_path source pe
  |> fun (p, d) -> put_path d dest p
```

Hmm... what else can we do? An `ls` function, to get all subdirectories in a
given directory, might be helpful. (`get_tree` is just a small function that
gets the `StrDict` out of a `Tree` variant `ptree` value, and raises an
exception if the `ptree` value is not a `Tree`.)

```ocaml
let ls path pe = cd path pe
  |> (fun p -> p.under)
  |> get_tree
  |> StrDict.bindings
  |> List.map fst (* keep only the keys *)

let ls_opt = make_opt2 ls
```

I'll also make a `pwd` function, since its easy, and potentially useful in some
cases. Similar to `root`, it's a recursive definition.

```ocaml
let pwd pe =
  let rec aux t = match t.above with
    | None -> []
    | Some (k, p) -> k :: (aux p) in
  List.rev (aux pe)
```

And finally, I'll define a `depth` function, which returns the depth of the
subtree currently pointed to by the `peditor`. This could be handy in a lot of
cases, but will become especially handy when we try exporting trees to INI,
as INI only allows for trees of depth < 2.

This is just your classic, homework-style tree depth algorithm!

```ocaml
let rec depth pe =
  let keep_max m x = max m (depth @@ cd [x] pe) in
  match ls_opt [] pe with
  | None | Some [] -> 0
  | Some lst -> 1 + List.fold_left keep_max 0 lst
```

I think we've made a good set of useful actions we can perform with the
`peditor` now, so I'll stop here.

---

To summarize, in this post we've fleshed out the operations we can do with the
`peditor`, which is the API the library exposed to users for easily editing
`ptree` objects.

- `cd` and `cd_opt` are used to move the `peditor` into subdirectories at a
  path relative to its current position.
- `parent` and `parent_opt` perform the job of `cd ..` in the Unix terminal --
  returning back up to a parent directory from a subdirectory. We include some
  extra logic to save our edits in the subtree.
- `root` returns the `peditor` so it points at the root directory.
- `put` and `put_path` allows us to insert data into the `ptree`, and easily
  create subdirectories that don't already exist in one fell swoop.
- `cat`, `cat_path`, and `cat_path_opt` allow us to get data out of the `ptree`.
- `cp` allows us to copy `ptree` data from a subdirectory at one path to
  another.
- `rm`, `rm_opt`, `rm_path`, and `rm_path_opt` allow us to "pop" data out of
  the `ptree`, removing it from the `ptree` and returning it alongside as a
  separate piece.
- `mv` allows us to move data from a subdirectory at one path to another.
- `ls` and `ls_opt` gives us a list of available subdirectories at a given
  path that can be `cd`'ed into.
- `pwd` gives us the path that the `peditor` is currently located at, relative
  to the root directory.
- `depth` gives us the depth of the tree below the `peditor`, i.e. the maximum
  number of times we can `cd` into a subdirectory from the current position
  before we hit a leaf node.

This API really is very handy and easy to use! To see it in action, check out
some of the examples in the [GitHub
README](https://github.com/brandon-gong/ptree.ml/blob/main/README.md#examples).

This about wraps up the central part of the project. In the next post, I'll
start working on something very exciting: parsing! We'll start build a parser
combinator library up from scratch, after some type-driven development.
