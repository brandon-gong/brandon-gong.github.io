---
layout: project
title: ptree.ml
description: Serializer/deserializer for INI, JSON, & XML
link: https://github.com/brandon-gong/ptree.ml
year: 2022
usemermaid: true
---

ptree.ml (short for Property Tree) is a "universal adaptor" between the
extraordinarily popular data serialization formats INI, JSON, and XML for OCaml.
It provides support for parsing any of these formats into a unified data
structure, making edits / adding new data, and then exporting data back out to
any of those file formats.

As such, it can be used as

- a single, familiar tool to parse multiple file formats (no need to learn a new
  API every time);
- a tool to convert between different file formats (e.g. read in an INI file,
  write it out as JSON);
- a way to easily serialize any data you have (not just modifying pre-existing
  data from another file – you can easily build up your own tree from scratch
  and write it to whatever format you like).
<div class="mermaid">
graph LR
    A(ptree.ml)
    B(JSON input)
    C(INI input)
    D(XML input)
    E(JSON output)
    F(INI output)
    G(XML output)
    C-->A
    B-->A
    D-->A
    A-->F
    A-->E
    A-->G
</div>

The API exposed for editing property trees views these trees as a file system,
where categories of properties are directories and the properties are the files
themselves. Fittingly, the API closely resembles filesystem operations in the
Unix terminal, with functions such as `cd`, `ls`, `cp`, `cat`, `rm`, and more.

Everything is built from scratch using only the standard library, including the
parsing. Parsing is accomplished through a homemade parser combinator libary.
The property editor is modeled after the Zipper data structure, and allows edits
to happen on property trees in a fast, immutable, persistent, and
memory-efficient manner.

This project was my first real exposure to OCaml and parser combinators, which I
still find to be perhaps the most beautiful demonstration of functional
programming. Indeed, I undertook this project to get more practice with FP; as a
side bonus, experience from this project completely trivialized a later course I
took at Brown (CSCI 1260, Compilers and Program Analysis).