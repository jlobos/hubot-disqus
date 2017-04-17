# Hubot Disqus Adapter

This is [Hubot](https://hubot.github.com) adapter to use with [Disqus](https://disqus.com)

[![bitHound Code](https://www.bithound.io/github/jlobos/hubot-disqus/badges/code.svg)](https://www.bithound.io/github/jlobos/hubot-disqus) [![bitHound Dependencies](https://www.bithound.io/github/jlobos/hubot-disqus/badges/dependencies.svg)](https://www.bithound.io/github/jlobos/hubot-disqus/master/dependencies/npm)

## Installation & Usage

Create a new [Disqus Applications](https://disqus.com/api/applications/). Once you have a bot created, follow these steps:

* `npm install --save hubot-disqus`
* Set the environment variables specified in **Configuration**
* Run hubot `bin/hubot -a disqus`

## Configuration

This adapter uses the following environment variables:

**Required:**

* `HUBOT_DISQUS_ACCESS_TOKEN` Your Access Token of Disqus app.
* `HUBOT_DISQUS_API_KEY` API Key of you Disqus app.
* `HUBOT_DISQUS_API_SECRET` API Secret of you Disqus app.
* `HUBOT_DISQUS_FORUM` This is **id** or **name** of you forum.

**Optional:**

* `HUBOT_DISQUS_LIMIT_THREADS` Limit of threads where hubot works (*default last 2 threads*).
* `HUBOT_DISQUS_INTERVAL` The interval in **milliseconds** to search new threads (*default 5 minutes*).
