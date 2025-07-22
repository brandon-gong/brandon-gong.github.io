---
layout: project
title: siliconnn
description: Neural networks in pure ARM Assembly
link: https://github.com/brandon-gong/siliconnn
year: 2023
---

I had been wanting to build a project in assembly for a while (ever since
essentially late middle school); there was just something so appealing about the
idea of laboring away with such a primitive, raw medium, building up each piece
of functionality from nothing, and putting it all together into a polished,
sophisticated machine.

I finally got the chance to do so with `siliconnn`, which is a full neural
network implementation in ARM64 assembly -- no dependencies, no calling C
functions. It includes a long list of features, but the main highlights include:
- Loading datasets from CSV, normalizing features, and shuffling
- Splitting datasets into training and testing sets
- Initializing fully-connected, feedforward neural networks with configurable
  numbers of input and hidden neurons
- Training neural nets with configurable learning rate and number of epochs
- Computing and printing mean squared error over a dataset
- Dumping trained networks to files / loading pretrained networks from files.

<figure>
	<img src="{{site.baseurl}}/assets/nn.png">
	<figcaption>A network created with <code>siliconnn</code> for classifying the <a href="https://archive.ics.uci.edu/ml/datasets/iris" target="_blank" rel="noopener noreferrer">Iris dataset</a>.</figcaption>
</figure>

Continuing with the artisanal analogy from earlier, most of the insight in this
project occurred while writing the C reference implementation for it, akin to
producing a pencil sketch before beginning the actual piece. Beyond that, the
work translating into assembly was pretty quiet and modest, while being one of
the bigger tests I've faced in terms of endurance.

I do feel that I learned a lot, and gained a lot more solid understanding of C
and lower-level programming by working with assembly. And I think I've gotten my
fill of assembly writing for this lifetime.
