---
layout: project
title: CHS Math Bowl
description: A math bowl with live scoreboards & more
link: https://github.com/brandon-gong/chs-math-bowl
year: 2020
---

Developed for Collierville High School's annual Math Bowl, it featured
scoreboard and timers for each competition room, as well as an admin console
that controlled starting & stopping rounds, handling disputes, etc. In the
auditorium, a unified scoreboard and leaderboard showed the standings of all
teams, and live-updating scores as the rounds progressed.

<figure>
	<img src="{{site.baseurl}}/assets/admin_auditorium.jpeg">
	<figcaption>The admin console on the laptop screen, and the auditorium scoreboard displayed
on the projector in the background.</figcaption>
</figure>

<figure>
	<img src="{{site.baseurl}}/assets/room2.jpeg">
	<figcaption>The scoreboard and timer for one of the individual rooms, during a preliminary
round.</figcaption>
</figure>

<figure>
	<img src="{{site.baseurl}}/assets/semi.jpeg">
	<figcaption>The final score displayed during a semifinal round in the main auditorium.</figcaption>
</figure>

<figure>
	<img src="{{site.baseurl}}/assets/setup.jpeg">
	<figcaption>A closer look at the admin console, here queuing up matches from the bracket
for each of the individual rooms. A green dot meant the room had completed the
round; yellow meant the round was still in progress.</figcaption>
</figure>

This project was developed completely from scratch in HTML, CSS, and JavaScript
using Google Firebase. In hindsight, probably React should've been used, as the
code is quite rushed and messy. But it worked great, almost flawlessly for the
entirety of the tournament. There was a slight bug where a score somehow was
submitted twice, but it was trivial to remove it in the admin console.

Looking back, this was an extremely exciting project for the young high school
me; the fact that something I built could make tangible impact in the
experiences of others firmly set me on the path to pursue programming as a
career.
