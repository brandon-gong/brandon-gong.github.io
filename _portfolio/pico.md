---
layout: project
title: pico
description: Fragment shaders in vanilla JavaScript
link: https://github.com/brandon-gong/pico
year: 2023
---

_This project is a bit smaller than the others, taking only a few days out of my
spring break to complete; nevertheless, I've included it here for completeness._

I have long been interested in computer graphics and procedurally-generated
"art", and regularly try my hand at making small graphics programs or games
(e.g. when I have a few hours to spare on a flight).

<figure class="smaller">
	<img src="{{site.baseurl}}/assets/mandelbrot.png" style="width: 400px">
	<figcaption>The Mandelbrot fractal, rendered using Pico. <a href="https://github.com/brandon-gong/pico/blob/main/examples/mandelbrot.js" target="_blank">View the source code here.</a></figcaption>
</figure>

There are two major approaches to drawing with computers. One is a "painting"
style, where we treat our drawing area as a blank canvas and call various
functions to layer shapes on top of it.
[Processing](https://processing.org/){:target="_blank"} and
[cairo](https://www.cairographics.org/){:target="_blank"} are two major
libraries which provide an API that allow this workflow. This is very intuitive
for humans (we all get started in life scrawling on scrap paper with crayons,
after all), but ultimately not so great for computers, because at the end of
the day each pixel needs to be updated independently.

So the alternative approach is to cater to the machine and write programs that
output the color of a single pixel. The computer can then run this program with
massive parallelism on the GPU and output the drawing in a significantly more
performant manner. That's the approach that GLSL fragment shaders use. (I highly
recommend you check out
[Shadertoy](https://www.shadertoy.com/){:target="_blank"}, which is a great
showcase of the kind of insane shenanigans people pull off by writing programs
in this style.)

<figure>
	<img src="{{site.baseurl}}/assets/picoeditor.png">
	<figcaption>The Pico editor.</figcaption>
</figure>


Pico takes the heart of this concept --- for each pixel, running a function that
takes in XY coordinates and outputs a single color --- and brings it back out to
the world of vanilla JavaScript, which is a much more beginner-friendly language
than GLSL. At the cost of performance, this brings the concept into a more
playful light.

See the [GitHub
repository](https://github.com/brandon-gong/pico){:target="_blank"} for an
introduction and examples, or [try Pico out
yourself](http://bgong.xyz/pico/){:target="_blank"}.
