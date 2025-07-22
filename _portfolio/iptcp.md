---
layout: project
title: IP/TCP
description: Reimplementing an IP/TCP networking stack
year: 2023
usemermaid: true
---

_This project was completed as part of Brown's Computer Networks course in
collaboration with Patrick Peng. Out of respect for the course, I have not
posted the source code. Please contact me at <span class="email-obscure"><span>bran</span><span>aceiektnei9395h43n@yahoo.con</span><span>don@bgo</span><span>dontscrapeme.com</span><span>ng.xyz</span></span>
if you would like more information._

A significant portion of Computer Networks at Brown is a large, extended project
in which students start from scratch and implement IP and then on top of that
TCP, ending up with a router program which can route packets to the correct
destination over a self-healing network and a host program which can send and
receive data reliably.

<figure>
	<img src="{{site.baseurl}}/assets/iptcpdemo.png">
	<figcaption>The project in action. Each sub-window is a node, which may either
	be our implementation or the reference implementation provided by the course.</figcaption>
</figure>

The project builds off of a UDP "Layer 2", in which sending data out from a
"NIC" results in the segment getting transferred over loopback UDP to the other
node, which is just another instance of the program running on the same machine.

Patrick and I opted to use C++ as our implementation language, since it was a
language we both wanted to get more comfortable with. Indeed, I think it was
a great challenge to help me with developing my C++ skills, as implementing
IP/TCP presents a great deal of design choices (e.g. how to store out-of-order
segments or keep track of segments for retransmission? How to deal with the
circular dependency between socket and socket table?).

We implemented IP to support packet forwarding via longest-prefix matching,
updating relevant IPv4 header fields correctly (e.g. TTL, checksum), and
automatic route discovery / healing using RIP with split horizon and poison
reverse. This allows networks using our IP stack to remain usable even when
an intermediate node goes down (as long as there are redundant connections).

<figure>
<div class="mermaid">
flowchart LR
        H1
        H2
        R1(R1)
        R2(R2)
        R3(R3)
        R4(R4)
        R5(R5)
        H1---R1
        R1---R2
        R2---R3
        R3---H2
        R1---R4
        R4---R5
        R5---R3
</div>
<figcaption>In the above network, if router R2 goes down, hosts H1 and H2 should
still be able to communicate via the R4-R5 path.</figcaption>
</figure>

We implemented TCP by directly referencing [RFC
9293](https://datatracker.ietf.org/doc/html/rfc9293){:target="_blank"}. We built
support for TCP handshake, teardown, retransmissions over lossy connections,
handling out-of-order segments, and zero-window probing.

Throughout implementing both IP and TCP, we used Wireshark as a primary
debugging tool, to ensure e.g. checksums were correct / headers were
well-formatted in general, retransmissions were behaving correctly, and ACK
numbers were updating as expected especially in the case of dropped packets.

Overall, this was a challenging endeavor, and I remember Patrick and I spending
a good portion of our spring breaks trying to chase down bugs in our TCP
implementation. But it was very much fruitful, and I feel that I gained a much
deeper understanding of IP and TCP in the process.

I later served as a teaching assistant for this course.
