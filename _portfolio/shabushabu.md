---
layout: project
title: ShabuShabu
description: Self-play reinforcement learning for Shobu
link: https://github.com/Tchang27/shobu_rl
year: 2025
---

_This project was completed as part of Brown's Deep Learning course in
collaboration with Ayushman Choudhury and Seowon Chang._

[Shobu](https://www.smirkanddagger.com/product-page/shobu){:target="_blank"} is
a pretty recent board game, despite its appearances, and thus one that hasn't
yet been well-explored in terms of computer engines. The turn-based game
features a unique two-phased move mechanism in which players make both a
"passive" and "aggressive" step.

<figure>
	<img src="{{site.baseurl}}/assets/shobuboard.jpg">
	<figcaption>The Shobu board, courtesy of their Amazon listing.</figcaption>
</figure>

Since we have very little knowledge about the game, we cannot use human-designed
heuristics to evaluate Shobu positions; rather, we'd like a model that can
gradually improve itself by playing games. Also, the two-phased move leads to
quite a large branch factor, which makes Monte Carlo tree search an appealing
option over the traditional minimax search.

This may be starting to sound familiar to many readers, and indeed we did take
lots of inspiration from AlphaZero's pioneering research in developing our own
model. However, AlphaZero had access to thousands of TPUs during training, and
we had only [64 CPU cores](https://docs.ccv.brown.edu/oscar){:target="_blank"}
to work with. We ended up incorporating several of
[KataGo](https://arxiv.org/abs/1902.10565){:target="_blank"}'s optimizations as
well as some of our own to create a model which ultimately showed great
improvement despite our limited compute.

<figure>
	<img src="{{site.baseurl}}/assets/shabu_arch.png">
	<figcaption>ShabuShabu architecture, featuring a backbone of residual blocks and
	a two-headed output.</figcaption>
</figure>

I was very happy that in a few weeks, we went from nothing to a model that was
strong enough to beat all of us consistently. I also developed some tools along
the way which proved to be highly useful, including a utility which allowed us
to explore the model's behavior and decision-making process and continuously
tune the model hyperparameters as training progressed, as well as evaluation
tools that allowed us to calculate Elos of pools of bots via a parallelized
round robin.

<figure>
	<img src="{{site.baseurl}}/assets/shabu_elo.png">
	<figcaption>ShabuShabu self-play Elo over time is shown in blue; the purple
	line at the bottom is random play under the same Elo system.</figcaption>
</figure>

You can also [read the ShabuShabu
whitepaper](https://bgong.xyz/shabu_whitepaper.pdf){:target="_blank"}.
