const EventEmitter = require('events')
const log = require('npmlog')
const {Wechaty} = require('./requires')

class Mikey extends EventEmitter {
  constructor(options) {
    super()
    this.brain  = brain(options.brain) // function (talker, listener, utterance, room)
    this.mouth  = mouth(options.mouth) // function (talker, listener, utterance, room)

    if (typeof this.brain!=='function' || typeof this.mouth!=='function') {
      throw Error('brain & mouth need to be a function')
    }

    this.on('say', (...args) => {
      this.mouth.apply(this, args)
    })
  }

  hear(talker, listener, utterance, room) {
    if (!talker || !listener || !utterance) { throw Error('Mikey.hear() must contains talker/listener/utterance') }
    log.verbose('Mikey', 'hear %s -> %s : "%s" @ [%s]', talker, listener, utterance, room)

    return this.brain(talker, listener, utterance, room)
  }
}

function brain(instance) {
  const type = instance.constructor.name

  const brains = {
    TextBot: microsoft  // textbot
    , String: echo      // 'echo'
  }

  if (!brains[type]) {
    throw new Error('unsupport brain type: ' + type)
  }
  return brains[type]

  //////////////////////////
  function microsoft(talker, listener, utterance, room) {
    log.info('brain.microsoft', `${talker} -> ${listener} :"${utterance}" @[${room}]`)

    if (!this.initMicrosoft) {
      log.verbose('brain.microsoft', 'init event[reply] callback')
      instance.on('reply', reply => {
        console.log(reply)
        const utterance = reply.text
        const talker    = reply.from.address

        const listener  = reply.to.address
        const room      = reply.to.channelId

        log.info('brain.microsoft', `textBot.on(reply): ${talker} -> ${listener} :"${utterance}" @[${room}]`)
        this.emit('say', talker, listener, utterance, room)
      })
      this.initMicrosoft = true
    }

    return instance.processMessage({
      text: utterance
      , from: {
        channelId: room
        , address: talker
      }
      , to: {
        channelId: room
        , address: listener
      }
    }) //, (err, reply) => wechatyCallback)
  }

  function echo(talker, listener, utterance, room) {
    log.info('brain.echo', `${talker} -> ${listener} :"${utterance}" @[${room}]`)
    this.emit('say', talker, listener, utterance, room)
  }
}

function mouth(instance) {
  const type = instance.constructor.name

  const mouths = {
    Wechaty: wechaty  // wechaty
    , String: cli     // 'cli'
  }
  if (mouths[type]) {
    return mouths[type]
  } else {
    throw new Error('unsupport mouth type: ' + type)
  }

  function wechaty(talker, listener, utterance, room) {
    const m = new Wechaty.Message()
    .set('from'   , talker)
    .set('to'     , listener)
    .set('content', utterance)
    .set('room'   , room)

    log.info('mikeyMsWechaty', `mouth(): ${talker} -> ${listener} :"${utterance}" @[${room}]`)
    return instance.send(m)
  }

  function cli(talker, listener, utterance, room) {
    console.log(`${talker} -> ${listener} :"${utterance}" @[${room}]`)
  }
}

module.exports = Mikey.default = Mikey.Mikey = Mikey