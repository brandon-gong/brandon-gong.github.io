---
layout: post
title: "Pico Documentation"
tags: [pico, generative-art, procedural-generation, javascript, glsl, graphics]
---

## Required elements

In your code, you must define a function
```
color: (x, y, f, mx, my, md) => [r, g, b]
```
where:
- `x: int` is the index of the pixel along the x axis, with 0 on the left and increasing towards the right.
- `y: int` is the index of the pixel along the y axis, with 0 on the top and increasing moving downwards.
- `f: int` is the index of the current frame. This starts from zero and is incremented per frame. This allows you to create animations, where the color of a pixel depends not only on its position, but also how long it has been since the code started running.
- `mx: int` and `my: int` are the x- and y-coordinates of the mouse cursor, respectively. You can use these values to make your sketch interactive.
- `md: boolean` is true if any mouse buttons are clicked, false otherwise.
- `r: number`, `g: number`, and `b: number` are values representing the red,
	green, and blue color components of the pixel color, where 0 is the lowest,
	and 255 is the highest. These values will be rounded to integers and clamped
	to this range, so you don't have to worry about this unless you want to.

## Adjusting settings
There are three pre-defined global variables that can be adjusted to modify
various properties of the sketch. Their names, default values, and uses are
given in the table below.

| name     | default | purpose                                                 |
|----------|---------|---------------------------------------------------------|
| `width`  | `800`   | sets the width of the sketch, in pixels                 |
| `height` | `800`   | sets the height of the sketch, in pixels                |
| `loop`   | `true`  | whether or not the sketch should be rendered repeatedly |

## Other predefined functions
You have access to all JavaScript syntax and facilities (e.g. `Array`, `Set`,
`BigInt`, objects, classes, lambda functions) except for the `Math` library. In
place of the `Math` library, you are provided with the below functions, called
in the same way as their builtin `Math` counterparts. (They are in the global
namespace, e.g. just write `sin(x)` instead of `Math.sin(x)`.)
- `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `atan2`, `sinh`, `cosh`, `tanh`,
`asinh`, `acosh`, `atanh`, `log`, `pow`, `floor`, and `ceil`.