---
title: "First Python / Flask Application"
description: "A summary of how to stand up your first Python / Flask application."
date: 2015-07-29
tags: ["python"]
---

I like the quick draft section of WP - I'll start using this to keep my posts short :).

Haven't posted in a while, but here's where I'm at - I now have two apps, written in Swift, on the Apple App Store. Both could use a lot of work, but I took a break to check out Python. As of this moment, I'm not opinionated on the religious "Down with PHP" conversations, but I definitely like Python a lot so far. It feels a bit quicker, has a LOT of easy libraries to import and seems to be more popular.
Once I knocked out my [first Python project](https://github.com/jayrav13/njit-course-scraper), I was excited to start working with Python/Flask, because I'll be honest: Ruby on Rails came off as overwhelming initially. Python/Flask felt like a perfect start.

Look at how easy it is to set up your Python/Flask application:

```python
# app.py

from flask import Flask

app = Flask(__name__)
app.debug = True

@app.route('/')
def hello():
    return "Hello, world!"

```

And there you have it! By installing your dependencies ahead of time (by executing `pip install flask`), you can paste this into a file called `app.py`, run `python app.py`, visit `localhost:5000` and see "Hello, world!" in your browser (or via cURL request).

And adding a new route:
```python
@app.route('/new')
def new():
    return "Here is my new route!"
```

Not too bad! With a few simple lines,  you can set up your first Python application!

*Note: This post was previously written on my Wordpress blog.*

Jay
