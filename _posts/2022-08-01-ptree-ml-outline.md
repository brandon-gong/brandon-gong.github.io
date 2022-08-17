---
layout: post
title: "ptree.ml Series Outline"
tags: [ptreeml]
---

This post doesn't have much content, but serves as a list of links to each of
the different posts on ptree.ml. I encourage reading in logical order,
especially the first section in the first post to really get the bigger picture
on what I am working on.

<ul>
{% for post in site.posts reversed %}
  {% if post.title contains "ptree.ml part" %}
    <li>
			<a href="{{ post.url }}">
				{{ post.title }}
			</a>
		</li>
  {% else %}
    {% continue %}
  {% endif %}
{% endfor %}
</ul>
