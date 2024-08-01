---
layout: page
title: About
order: 0
---

I'm a fourth-year undergraduate at Brown University, concentrating in Computer
Science and Applied Mathematics.

I have interned as a backend engineer at The Washington Post, building a new
payments system to support current and future projects and contributing features
and optimizations to paywall engines. Before that, I was at the National
Institutes of Health, where I mapped the rare disease research landscape using
graph databases.

Coding is my favorite hobby! Doing personal [projects]({% link projects.md %})
has given me the ability to quickly orient myself in new languages or
frameworks. It's also made me sharper at reading and debugging unfamiliar code.
When I have some spare time, I post to my [blog]({% link blog.md %}),
documenting my new learnings / recent toy programs.

When I'm not sitting at the computer, I enjoy cooking, practicing piano, hiking,
and playing tennis. Check out my [random]({% link random.md %}) page to see what
I'm currently obsessed with!

Let's get in touch! You can find me at any of my [links]({% link links.md %}),
grab a copy of my [resume]({{site.baseurl}}/resume.pdf), or reach out to me via
email at _brandon \[at] bgong.xyz_.

## Recent posts
<ul>
{% for post in site.posts limit:5 %}
<li><a href="{{post.url}}">{{post.title}}</a></li>
{% endfor %}
</ul>
