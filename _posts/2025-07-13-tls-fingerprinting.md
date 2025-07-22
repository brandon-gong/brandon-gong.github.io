---
layout: post
title: TLS and fingerprinting
subtitle: What TLS is, and how it can be used to identify clients
tags: [networks]
---

The two foundational technologies that underpin much of the internet, IP and
TCP, have very little security properties on their own; there is basically no
protection against someone else pretending to be your bank (impersonation),
inspecting the data you send (e.g. your bank account password), or tampering
with the data you send and receive (e.g. changing a button on your bank's
website to instead send all your money to them when you click it).

To resolve this issue, we need to _authenticate_ the server is actually who we
think it is, and we need to _encrypt_ all the data that is sent between us and
the server so that we obscure it from eavesdroppers and are able to verify the
_integrity_ of the data.

These goals are what transport layer security (TLS) is designed to address.

## An internet without security
You can imagine, as an analogy, that the internet is a (very very fast) postal
service, and you ("the client") and the website you're trying to visit ("the
server") communicate in a language called English ("HTTP") by mailing each other
letters ("packets"). It's almost certainly way too expensive to build a tube
directly between the two of you which sucks in letters from one end, transports
them directly, and spits them out safely on the other side. Rather, and
especially since you and the server might be living far apart geographically,
you'll have to take advantage of shared infrastructure (roads, planes, mail
delivery trucks, etc.), and your letter might have to hop through various
regional distribution centers ("routers") around the country before it finally
arrives in the server's mailbox. You have no control over exactly the route
that it takes.

<figure>
	<img src="{{site.baseurl}}/assets/tls-traceroute.png">
	<figcaption>A packet can jump all over the world en route to its final destination. This is a visualization of a <code>traceroute</code> executed from somewhere in the U.S. to <code>wolfram.com</code>.</figcaption>
</figure>

In particular, you have no control over the fact that one of the mailmen for an
intermediate leg of the trip (we'll name him Robert, sorry to any Roberts
reading this) may be a very untrustworthy individual indeed. Robert's favorite
activity is to open letters he is mailing and cause chaos by changing what the
letter says (did I mention he's a master of forgery?), gossiping about the
contents to his friend, who happens to be a KGB spy, or even replying to letters
in the recipient's name rather than delivering the letter to the recipient.

So you and the server need to figure out some strategy (a "protocol") to be able
to communicate privately even with Robert as the mailman.

## Cryptographic concepts
Ultimately, we can narrow our security requirements down into three guarantees
that our protocol with the server must fulfill.

1. **Confidentiality**. We would like to prevent Robert from being able to read
	letters sent between you and the server.
2. **Authentication**. We would like to ensure that letters you receive from the
	server *are actually from the server* (so Robert can't reply freely in the
	server's name).
3. **Integrity**. Finally, we want to be sure that if a letter in transit
between you or the server is edited, the receiver will become aware of
Robert's hijinks and will ignore the tampered letter.

Together, these three guarantees defend against many of Robert's exploits (but
not all; Robert could write a bunch of spam mail so that the server's mailbox is
always full and doesn't have space for your letter to arrive, for example; the
classic [Denial of
service](https://en.wikipedia.org/wiki/Denial-of-service_attack){:target="_blank"}).
Also, note that if we are clever enough, we only need to perform authentication
once in the beginning; presuming we've set up a secret code to communicate
confidentially at the same time, then we know that all letter we can read in the
secret code must have come from the server even without having to
re-authenticate on each letter, just by virtue of the code being secret.

Guarantee #2 is addressed via a tree of securely "signed" certificates, known as
[public key infrastructure
(PKI)](https://en.wikipedia.org/wiki/Public_key_infrastructure){:target="_blank"}.

**But there are _many, many_ ways to approach Guarantees 1 and 3.** The
nitty-gritty details of how these approaches work is outside the scope of this
post, but I'm hoping to cover them in later posts, as cryptography algorithms
are quite interesting and can be surprisingly simple.

For Guarantee 1, we would like to first proceed by securely deciding on a shared
secret key ("key exchange"), and then encrypting all communications in that key
from that point on. For the former, there are various approaches with strange
names like RSA, ECDHE, and DHE. For the latter, we employ objects called "block
ciphers" of which there are again various approaches like AES, AES-GCM,
ChaCha20, and Blowfish.

<figure>
	<img src="{{site.baseurl}}/assets/tls-key-exchange.png">
	<figcaption>One approach to the first part of Guarantee 1, secure key exchange. Here we rely on the fact that given two numbers in the form <code>g^x</code> and <code>g^y</code>, it's difficult to compute <code>g^{xy}</code>. (Source: P. Miao, Brown CSCI 1515)</figcaption>
</figure>


For Guarantee 3, we usually employ "collision-resistant hash functions"; you
pass your message as inputs into this magical function, and it spits out a
random (but deterministic) string of 0s and 1s. The trick is that it's
effectively impossible to find another different message that causes this
magical function to output this same string of 0s and 1s, thus making forgery
impossible. In this class, we have the
[SHA-2](https://en.wikipedia.org/wiki/SHA-2) family (with all of its members
like SHA256 and SHA384), Poly1305, and SipHash.


## Finally, TLS
So, we have a lot of solutions to the different parts of the problem at our
disposal, and there's a lot of mixing and matching we can do in selecting which
of the solutions to use. Any particular combo of cryptography algorithms which
gives us the Three Guarantees is known as a _cipher suite_, and, for various
hardware, OS-level, and software reasons (e.g. this device's chip has [hardware
acceleration for a particular
algorithm](https://en.wikipedia.org/wiki/AES_instruction_set){:target="_blank"},
or this browser has a smaller dev team and thus can't write super-optimized
implementations of different suites that quickly), different pairings of
computer and application will end up supporting different cipher suites.

But, before doing anything else, client and server must agree on the same cipher
suite to use, as different cryptography algorithms may employ radically
different approaches that are not interoperable! How do we deal with this?
That's the job of TLS.

In the opening phase of TLS, the client sends a message to the server, saying
something along the lines of _"Hiii I'd like to set up TLS with you!! Here's a
fragment of the shared key we'll agree on and an exhaustive list of all the
cipher suites I support: blah blah blah...&rdquo;_. (This message is called,
literally, the `ClientHello` message.)

<figure>
	<img src="{{site.baseurl}}/assets/tls-clienthello.png">
	<figcaption>The <code>ClientHello</code> my device sends to the server when I try connecting to <i style="font-style:normal">bgong.xyz</i>, viewed using <a href="https://www.wireshark.org/" target="_blank">Wireshark</a>. Note the long list of cipher suites with cryptic names such as <code>TLS_AES_128_GCM_SHA256</code> (these are just names of crypto algorithms strung together)</figcaption>
</figure>

The server will then pick its favorite cipher suite out of the list offered by
the client, and after a few more setup steps (both client and server will
independently take fragments of the shared key they sent each other and compute
the actual shared key), they will be able to communicate with the safety
guarantees we described above. Robert, try as he might, won't be able to
decipher any ongoing communications. This is what finally puts the "S" in
"HTTPS".

## But wait doesn't `ClientHello` say a lot about who the client is
Yes, and thus it can be used for fingerprinting. Remember, the hardware, OS, and
software you are using for secure communication all can affect the cipher suites
that you end up supporting on your end. Since you send that list of cipher
suites to the server, the server can then use it to try to narrow down on who
you are. There may be a lot of clients accessing the server, but the number of
clients who are bots running in a Linux 6.12 container using cURL 8.15.0 to
scrape site data is much, much smaller.

The dominant fingerprinting approach,
[JA3](https://medium.com/salesforce-engineering/tls-fingerprinting-with-ja3-and-ja3s-247362855967){:target="_blank"},
is stupid simple: take a few fields from the `ClientHello` message (including
the list of cipher suites mentioned earlier), mush them together with comma
delimiters, and then take the [MD5
hash](https://en.wikipedia.org/wiki/MD5){:target="_blank"} of that long string
concatenation to produce the fingerprint. (The hash at the end basically plays
no role in this besides making the whole string of `ClientHello` data much
shorter and easier to share around.)

Its successor,
[JA4](https://blog.foxio.io/ja4+-network-fingerprinting){:target="_blank"},
takes a slightly more refined approach (sorts cipher suites first so the hash is
invariant to ordering --- I'm honestly surprised JA3 doesn't do this) and also
adds support for [QUIC](https://en.wikipedia.org/wiki/QUIC){:target="_blank"}, a
modern, faster alternative to TCP. But ultimately, at the end of the day, it's
still just a glorified hash over the available cipher suites and extensions.

<figure>
	<img src="{{site.baseurl}}/assets/tls-ja4.png">
	<figcaption>Source: JA4 announcement blog linked above</figcaption>
</figure>

Are there privacy concerns with TLS fingerprinting? With any use of data that
narrows down information about you, of course there are always concerns to be
considered, but in general its most likely you'll blend right in with the other
billions of people around the world who are accessing sites through conventional
devices and browsers. What TLS fingerprinting _can_ help rat out are bots who
access sites via tools like [Selenium](https://www.selenium.dev/) or
[Metasploit](https://www.metasploit.com/) or even custom written software, as
these all may have certain TLS fingerprints that are quite different from
human users.

Even then, it's not foolproof. Since the `ClientHello` is ultimately just data
sent over TCP, it's not too difficult for bots to lie about it. It's also not at
all unique (despite the term "fingerprint"), and blocking traffic because a bot
has a certain fingerprint may lead to inadvertently blocking legitimate user
traffic as well. Ultimately, a TLS fingerprint is not a panacea; it's just one
more tool in the toolkit for defending servers against malicious or exploitative
clients.
