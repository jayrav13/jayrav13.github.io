---
layout: post
title:  "Python/Flask API + Security"
date:   2015-08-13 11:22:00 AM
categories: python
---

Over the last few weeks, my main focus has not only been to learn Python, but to also understand Python/Flask in the more general context of web frameworks. The peak of my experience with it thus far happened recently, when I realized the power of Flask when it comes to building REST API's. Thanks to [Miguel Grinberg's Designing a RESTful API with Python and Flask](http://blog.miguelgrinberg.com/post/designing-a-restful-api-with-python-and-flask), I was able to recognize that what once seemed like such a simple concept actually is. 

Working with the JSON output of a RESTful API is one of the first experiences I (and many newcomers to web programming) had, and I remember thinking "it just looks like a GET request with a hefty payload that's then processed and a result is being returned as JSON - but it can't be that simple, can it?" Turns out, it can be!

But Miguel covers that better than I can, go check it out! What I want to outline is a question that [Lee Weisberger](https://www.linkedin.com/in/leeweisberger) had for me when I built an API for Midloc*. In building it, I also created an endpoint via which potential users can register for the service. Here's a sample cURL request (note - password means/does nothing at the moment, so no need to use a real password):

{% highlight bash %}
$ curl -i "http://midloc.jayravaliya.com/api/register" -d "email=midlocapp@gmail.com&password=iheartmidloc"

HTTP/1.1 200 OK
Date: Thu, 13 Aug 2015 15:54:21 GMT
Server: Apache/2.4.10 (Ubuntu)
Content-Length: 146
Connection: close
Content-Type: application/json

{
  "Success": "midlocapp@gmail.com registered under access key d059c2afdb53f80e5dc8366e02339468", 
  "access_key": "d059c2afdb53f80e5dc8366e02339468"
}
{% endhighlight %}

Lee was already ahead of me though - *What if I wrote a script to constantly register random email addresses? How does your system currently handle that?*

Right away I realized that's a problem - once you build a system that's going to allow user interaction directly with your data source, you have to consider how software such as Apache and MySQL is going to fare under the pressure. I haven't yet done the experiment myself (i.e. write a script to crash against it and see what happens), but I did start thinking about solutions. And one of the approaches I didn't want to take was to simply Google it - I figured I'd try another way.

My approach was to use MySQL to store the IP Address of any incoming request to monitor it when future requests come in. Using SQLAlchemy, I created a Register object that maps to a MySQL database:
{% highlight bash %}
mysql> show columns in register;
+------------------+-------------+------+-----+---------+----------------+
| Field            | Type        | Null | Key | Default | Extra          |
+------------------+-------------+------+-----+---------+----------------+
| id               | int(11)     | NO   | PRI | NULL    | auto_increment |
| ip               | varchar(15) | YES  |     | NULL    |                |
| datetime         | varchar(64) | YES  |     | NULL    |                |
| legal_register   | int(11)     | NO   |     | 0       |                |
| illegal_register | int(11)     | NO   |     | 0       |                |
+------------------+-------------+------+-----+---------+----------------+
5 rows in set (0.01 sec)
{% endhighlight %}

{% highlight python %}
class Register(db.Model):
        __tablename__ = "register"

        id = db.Column(db.Integer, primary_key=True)
        ip = db.Column(db.String)
        datetime = db.Column(db.String)
        illegal_register = db.Column(db.Integer)
        legal_register = db.Column(db.Integer)

        def __init__(self, ip, datetime):
                self.ip = ip
                self.datetime = datetime
                self.illegal_register = 0
                self.legal_register = 1
{% endhighlight %}

Thanks to SQLAlchemy, I can now create a Register object, let's say... 

{% highlight python %}
register = Register(request.remote_addr, time.time())
{% endhighlight %}

...where `request.remote_addr` is the IP Address and `time.time()` is the number of seconds since the epoch. I can add that object to the database by saying `db.session.add(register)` and `db.session.commit()`. So then, I can treat a row of data as an object and manipulate it accordingly, and SQLAlchemy handles converting that into SQL statements that make MySQL happy. Awesome!

Here's the thing - the IP Address may have visited my site before. As such, I can create an object using a query by saying something like... 

{% highlight python %}
register = Register.query.filter_by(ip = request.remote_addr).first()
{% endhighlight %}

...which in layman's terms will retrieve the first row of data in the register table where the IP Address matches my incoming IP Address. And just like before, I can now manipulate `register` like an object!

Now, if my logic determines that a new row needs to be created (i.e. this IP Address has not visited yet), I'll let them register right away - by definition they're not abusing the system. What about a returning IP Address? For them, I can compare `time.time()` to the previously set `register.datetime`, which is the column in which their LAST visit's time will be stored. As long as `time.time() - register.datetime > 60.0`, sure they can register again! All I'll do now is say...
 
{% highlight python %}
register.datetime = time.time()
register.legal_register = register.legal_register + 1
{% endhighlight %}

...which will reset the last time visited and increment the number of legal access keys they've generated.

But, if `time.time() - register.datetime <= 60.0`, I'll return with an HTTP 400 response, stating that they need to wait 60 seconds before they can register again. With this approach, any infinite script can only touch my MySQL database every 60 seconds at most, which I'm ok with. I'll make sure to increment...

{% highlight python %}
register.illegal_register = register.illegal_register + 1
{% endhighlight %}

...to keep track of who's trying to abuse my system!

And in layman's terms, there you have it! A simplistic, but working, and for a small scale does the trick just fine. How about for a larger scale? I would imagine that for a larger scale, approaches involving sessions and cookies could do the trick - give the user a "handstamp", so to speak, when they send a request so that you could compare their next request to their own cookie. The opportunity to scale up dramatically increases because you no longer have to rely on the performance of the MySQL database for everyone, but rather just the performance of one's computer retrieving a cookie.

This project is available on [GitHub](https://github.com/jayrav13/midloc-api). Let me know what you think I can do better!  

* *[Midloc](https://itunes.apple.com/us/app/id1001946180) is a super simple iOS app that I've been working on to learn concepts of both backend and iOS development. Lee made the Android version!*

Jay
