---
layout: project
title: Personal Website
description: You're looking at it right now!
link: https://github.com/brandon-gong/brandon-gong.github.io
year: 2016
---

This website, despite its barren and inconspicuous appearance, is actually the
result of on-and-off iteration since November 2016 (the date of the first commit
to the repository). I think it's a pretty interesting demonstration of my
evolving tastes over time:

<figure>
	<img src="{{site.baseurl}}/assets/old1_1.png">
	<div style="height: 4px"></div>
	<img src="{{site.baseurl}}/assets/old1_2.png">
	<figcaption>Version 1 of the website, featuring an interactive 3D background,
	custom cursor, and crazy navigation.</figcaption>
</figure>

<figure>
	<img src="{{site.baseurl}}/assets/old2_1.png">
	<div style="height: 4px"></div>
	<img src="{{site.baseurl}}/assets/old2_2.png">
	<figcaption>Version 2 of the website, now more flat but no less flashy than
	the previous version.</figcaption>
</figure>

<figure>
	<img src="{{site.baseurl}}/assets/old3_1.png">
	<figcaption>Version 3 of the website, featuring a hard turn into more practical
	design. This was my first time trying Jekyll, so it's actually just some
	hacking on top of the <a href="https://jekyllthemes.io/theme/hyde" target="_blank" rel="noopener noreferrer">Hyde theme</a> available online.</figcaption>
</figure>

Early on, I was very interested in incorporating unique design elements into my
site, and so I had all the bells and whistles (you can still visit Versions 1
and 2 [here](https://bgong.xyz/old1/){:target="_blank"} and
[here](https://bgong.xyz/old2/){:target="_blank"}, respectively!). My goals with
this fresh design were to improve organization and navigation, and to build a
site friendlier for displaying photography, which is something I have recently
become more interested in.

Several concrete design decisions were made in evolving from Version 3 to the
current edition. There are now more internal links on each page, allowing easier
flow to newer / older posts as well as back to the home page or other "meta"
pages (i.e. Notes page, Portfolio page). These links are found at the top (in
the navbar) as well as the bottom of the page, but neither are obstrusive and
take focus away from the page's primary content.

I've also stripped out the blue background and striking sidebar in favor of a
more pared-back, neutral design which will allow photos to be the center of
focus. Rather than a wall of text, the homepage has been given additional
structure through the use of tables which allows more information to be
accessible "at a glance" while still looking clean and easy to parse.

I use Jekyll to generate the site from Markdown files, and I'm very happy with
it. [Jekyll Collections](https://jekyllrb.com/docs/collections/){:target="_blank"}
allows me to add e.g. new photos to the gallery by simply adding a new Markdown
file with metadata, which looks something like this:

```md
---
layout: photo
file: IMG_5864.jpeg
title: Stars over the Scituate Reservoir
location: North Scituate, Rhode Island
camera: iPhone 13
displaysize: 75%;
---

...few sentence caption here...
```

After saving this file, Jekyll automatically detects it, processes it into a new
page, and updates the gallery, archive, and gallery preview on the homepage with
links to that page.

Similarly, I have separate collections for notes and projects, which all come
with their own template --- meaning that I have to take little to no effort
doing boilerplate setup for each new post.

Finally, everything is hosted on GitHub Pages, which automatically runs my
Jekyll build after I commit a new Markdown file.
