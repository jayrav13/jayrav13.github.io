---
layout: post
title:  "What I learned from Midloc"
date:   2015-09-11 12:43:00 AM
categories: programming
---

This summer was quite incredible. I had the time to learn the basics of both web services/applications and started to understand iOS development past the basics. And through that, I realized one very big reality about learning to be a developer - you can't be afraid to start small. Build something simple, and add a little bit to it. Once you're comfortable, maybe try a different, better approach. Then add some more to it. Over time you may not build a $1 million app, but you'll learn a lot.

Now, take for example Midloc. The app itself was written in Swift, Apple's new iOS programming language. Below is the progression I took for both iOS and Backend from start to finish. Now note - save UI/UX changes, all of the backend and code changes were unnoticed by most that I talked to. But they packed a punch!

iOS:

* Started with no formal code layout, done per instruction from a Udemy class. Used sessions/tasks for HTTP.
* Implemented basic MVC after learning web development MVC.
* Integrated CocoaPods (Alamofire, SwiftyJSON).

Backend:

* Started with Parse backend, managed with Parse's iOS SDK.
* Wrote a small Python/Flask API to retrieve zip codes and hosted it on [Heroku](https://www.heroku.com).  
* Integrated Google Geocoding API into the Python/Flask backend, moved everything to Linode.
* Moved the Google Places API from iOS to backend, eliminating multiple requests from the iOS device and thus creating a TRUE backend!

And just like that, I had built a full stack iOS app, tested new technologies and become more comfortable with the idea of rapid iteration. The mystery surrounding API's fell away, CocoaPods became my best friends and I grew by shedding the use of prebuilt tools like Parse and substituting them with self built tools that I could manage more effectively and at scale.

If you have any questions about my experience, please do reach out! Also check out the GitHub repos for [Midloc iOS](https://github.com/jayrav13/midloc) and [Midloc API](https://github.com/jayrav13/midloc-api). Finally, check out Midloc on the [iTunes App Store](https://itunes.apple.com/us/app/midloc/id1001946180)!

