---
layout: page
title: Projects
order: 2
usemermaid: true
---

I consider *projects* to be reasonably large works that involve lots of
different components and a few weeks or months of concentrated effort and
willpower to complete. Small toy programs that only take a day or two would be
mentioned in my blog, but not here.

## siliconnn (2023) \[[link](https://github.com/brandon-gong/siliconnn)\]
I had been wanting to build a project in assembly for a while (ever since
essentially late middle school); there was just something so appealing about the
idea of laboring away with such a primitive, raw medium, building up each piece
of functionality from nothing, and putting it all together into a polished,
sophisticated machine.

I finally got the chance to do so with siliconnn, which is a full neural network
implementation in ARM64 assembly -- no dependencies, no calling C functions. It
includes a long list of features, but the main highlights include:
- Loading datasets from CSV, normalizing features, and shuffling
- Splitting datasets into training and testing sets
- Initializing fully-connected, feedforward neural networks with configurable
  numbers of input and hidden neurons
- Training NNs with configurable learning rate and number of epochs
- Computing and printing mean squared error over a dataset
- Dumping trained networks to files / loading pretrained networks from files.

![]({{site.baseurl}}/assets/nn.png)
*A network created with siliconnn for classifying the [Iris dataset](https://archive.ics.uci.edu/ml/datasets/iris).*

Continuing with the artisanal analogy from earlier, most of the insight in this
project occurred while writing the C reference implementation for it, akin to
producing a pencil sketch before beginning the actual piece. Beyond that, the
work translating into Assembly was pretty quiet and modest, while being one of
the bigger tests I've faced in terms of endurance.

I do feel that I learned a lot, and gained a lot more solid understanding of C
and lower-level programming by working with Assembly. And I think I've gotten my
fill of Assembly writing for this lifetime.

## ptree.ml (2022) \[[link](https://github.com/brandon-gong/ptree.ml)\]
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

## neche (2021) \[[link](https://github.com/brandon-gong/neche)\]
This project evolved small neural networks to play checkers. Networks were given
32 "sensory neurons" – to look at the different individual squares on the board
– as well as some inner neurons. They output a single evaluation score, which
a minimax algorithm (with alpha-beta pruning) used to explore future variations.

A "population" of several hundred networks would play a tournament-ish format
against itself each generation; the more successful networks that won more games
were more likely to become parents to the offspring in the next generation of
the population.

Network structure was encoded in a genome, where each 16-base pair gene encoded
a single synapse from one neuron to another. To create offspring, crossing-over
was simulated between the two parent genomes, and translocation and point
mutations were induced.

![]({{site.baseurl}}/assets/nechenets.png)
*A variety of different networks generated by evolution with different
parameters*

![]({{site.baseurl}}/assets/elo.png)
*The networks' self-play Elo over generations. On my laptop, it was unable to
escape the plateau after a quick initial jump. Higher mutation rates meant more
volatile Elo from generation to generation.*

This project was built using Rust, as well as the `rayon` crate to run each
generational tournament in parallel. All evolution, tree search, and move
move generation features were implemented from scratch.


## CHS Math Bowl (2020) \[[link](https://github.com/brandon-gong/chs-math-bowl)\]
Developed for Collierville High School's annual Math Bowl, it featured
scoreboard and timers for each competition room, as well as an admin console
that controlled starting & stopping rounds, handling disputes, etc. In the
auditorium, a unified scoreboard and leaderboard showed the standings of all
teams, and live-updating scores as the rounds progressed.


*The admin console on the laptop screen, and the auditorium scoreboard displayed
on the projector in the background.*

![]({{site.baseurl}}/assets/room2.jpeg)
*The scoreboard and timer for one of the individual rooms, during a preliminary
round.*

![]({{site.baseurl}}/assets/semi.jpeg)
*The final score displayed during a semifinal round in the main auditorium.*

![]({{site.baseurl}}/assets/setup.jpeg)
*A closer look at the admin console, here queuing up matches from the bracket
for each of the individual rooms. A green dot meant the room had completed the
round; yellow meant the round was still in progress.*

This project was developed completely from scratch in HTML, CSS, and JavaScript
using Google Firebase. In hindsight, probably React should've been used, as the
code is quite rushed and messy. But it worked great, almost flawlessly for the
entirety of the tournament. There was a slight bug where a score somehow was
submitted twice, but it was trivial to remove it in the admin console.