---
layout: page
title: About
order: 0
---

I'm a fourth-year undergraduate at Brown University, concentrating in Computer
Science and Applied Mathematics. I post regularly to my [blog]({% link blog.md
%}), documenting my new learnings / recent toy programs.

In the past, I worked as an intern at the National Institutes of Health, where I
mapped out the rare disease research landscape using graph databases. In the
past two summers, I have interned at The Washington Post as a backend
developer on the monetization team.

Coding is my favorite hobby! Doing personal [projects]({% link projects.md %})
has given me the ability to quickly orient myself in new languages or
frameworks. It's also made me sharper at reading and debugging unfamiliar code.
These are skills that can't be found in the classroom.

When I'm not sitting at the computer, I enjoy cooking, practicing piano, hiking,
and playing tennis.

Let's get in touch! You can find me at any of my [links]({% link links.md %}),
grab a copy of my [resume]({{site.baseurl}}/resume.pdf), or reach out to me via
email at _brandon \[at] bgong.xyz_.

## Recent posts
<ul>
{% for post in site.posts limit:5 %}
<li><a href="{{post.url}}">{{post.title}}</a></li>
{% endfor %}
</ul>
