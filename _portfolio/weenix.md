---
layout: project
title: Weenix
description: Simple Unix-like operating system
year: 2024
---

_This project was completed as part of Brown's Operating Systems course. Out of
respect for the course, I have not posted the source code. Please contact me at
<span
class="email-obscure"><span>bran</span><span>aceiektnei9395h43n@yahoo.con</span><span>don@bgo</span><span>dontscrapeme.com</span><span>ng.xyz</span></span>
if you would like more information._

I took and later served as a teaching assistant for Brown's Operating Systems
course under the great Professor Tom Doeppner. OS is well-known to be perhaps
the most difficult CS course at Brown, a major component being completing
Weenix, a simple didactic operating system that nevertheless contains many of
the major components of modern operating systems.

<figure>
	<img src="{{site.baseurl}}/assets/weenix.png">
	<figcaption style="hyphens: none">
		The venerated “Weenix has halted cleanly!” message, which can be attained
		only after arduous GDB sessions tracking down leaked or overwritten
		reference counts.
	</figcaption>
</figure>

Completing Weenix involves implementing threads and processes, device drivers
to talk to the keyboard and disk storage, a virtual file system which manages
per-process opened files in memory, the System V file system for writing to
nonvolatile storage, and finally support for virtual memory, which enables
userland programs to run in isolation from the kernel and each other.

I very much enjoyed taking this course, as it made the inner workings of a lot
of computer "magic" clear and apparent, for example, what happens when a user
reads a file (from the file descriptor table lookup, through the virtual file
system, looking through cached page frames, and finally going to the relevant
block(s) on disk), or how does a system call like `mmap` "create" a bunch of
free space or make file contents "appear" in memory.

But, with such a complex beast as an OS, there's always much more to learn than
can be crammed into a single semester, and the provided Weenix stencil does
leave a lot of corners unexplored. I hope to revisit OS development soon and
further improve my understanding in this area (e.g. boot sequence, kernel memory
management, EEVDF scheduling and more).

