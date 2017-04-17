const { Adapter, TextMessage } = require('hubot')
const { parse } = require('url')
const equals = require('array-equal')
const NeoDisqus = require('neo-disqus')

const { env } = process

exports.use = robot => new Disqus(robot)

class Disqus extends Adapter {
  constructor (robot) {
    super()
    this.robot = robot

    // Forum of Disqus
    this.forum = env.HUBOT_DISQUS_FORUM

    // Credentials
    this.client = new NeoDisqus({
      access_token: env.HUBOT_DISQUS_ACCESS_TOKEN,
      api_key: env.HUBOT_DISQUS_API_KEY,
      api_secret: env.HUBOT_DISQUS_API_SECRET
    })
  }

  /**
   * Disqusbot initialization
   */

  run () {
    if (!this.client.options.api_key) {
      return this.robot.logger.error('No service api_key provided to Hubot')
    }

    if (!this.forum) {
      return this.robot.logger.error('No forum id or name provided to Hubot')
    }

    this.threadsIds = [] // Id of last threads to check news threads
    this.getThread()
    // Set interval to search news threads, default 5 minutes
    setInterval(() => { this.getThread() }, env.HUBOT_DISQUS_INTERVAL || 300000)
  }

  /**
   *  Get instances of WebSocket thread of a forum
   */

  getThread () {
    const params = {
      forum: this.forum,
      limit: env.HUBOT_DISQUS_LIMIT_THREADS || 2
    }

    // Get list of last threads in forum

    this.client.get('forums/listThreads', params, (error, threads) => {
      if (error) return this.robot.logger.error(error)
      threads = threads.response

      // Make array of threads ids
      let threadsIds = threads.map(thread => thread.id)

      // Compare ids
      if (!equals(this.threadsIds, threadsIds)) {
        this.threadsIds = [] // Clean

        // Close old instances of WebSocket
        if (this.streams) {
          for (let stream of this.streams) {
            const id = parse(stream.url).path.split('/')[4]  // Get thread id of stream
            stream.close(1000, `Disqus client in thread "${id}" connection was closed successfully`)
          }
          this.streams = []
        }

        this.streams = threads.map(thread => {
          this.threadsIds.push(thread.id)
          // Return instances of WebSocket
          return this.client.stream(`thread/${thread.id}`)
        })

        for (let stream of this.streams) {
          const id = parse(stream.url).path.split('/')[4]  // Get thread id of stream

          stream.on('open', this.open.bind(this, { thread: id }))
          stream.on('close', this.close.bind(this))
          stream.on('message', this.message.bind(this))
        }
      }
    })
  }

  /**
   * Disqus client has opened the connection
   */

  open (options) {
    const { thread } = options
    this.robot.logger.info(`Disqus client now connected in thread: ${thread}`)
    this.emit('connected')
  }

  /**
   * Disqus client has closed the connection
   */

  close (code, reason) {
    this.robot.logger.info(reason)
  }

  /**
   * Message received from Disqus
   */

  message (message) {
    try { message = JSON.parse(message) } catch (parseError) {
      return this.robot.logger.error(parseError)
    }

    // If message type no is 'Post' ignore
    if (message.message_type !== 'Post') return

    let { message_body: { author, id, post: { messages } } } = message

    this.robot.logger.debug(`Received message: ${messages.raw}, from: ${author.name}`)

    author.room = message.message_body.thread_id
    this.receive(new TextMessage(author, messages.raw, id))
  }

  /**
   * Hubot is sending a message to Disqus
   */

  send (envelope, ...messages) {
    const { room } = envelope

    for (let message of messages) {
      this.client.post('posts/create', {
        message: message,
        thread: room
      }, (error, response) => {
        if (error) return this.robot.logger.error(error)
        this.robot.logger.debug(`Sending to ${room}: ${message}`)
      })
    }
  }

  /**
   * Hubot is replying to a Disqus message
   */

  reply (envelope, ...messages) {
    const { room, user, message: { id } } = envelope

    for (let message of messages) {
      this.client.post('posts/create', {
        message: message,
        thread: room,
        parent: id
      }, (error, response) => {
        if (error) return this.robot.logger.error(error)
        this.robot.logger.debug(`Sending to ${room}: ${message}, replying of ${user.name}`)
      })
    }
  }
}
