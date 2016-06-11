const EventEmitter = require('events')
const log = require('npmlog')
const {Wechaty} = require('./requires')

class Mikey extends EventEmitter {
  constructor(options) {
    super()
    this.brain  = brain(options.brain) // function (talker, listener, utterance, room)
    this.mouth  = mouth(options.mouth) // function (talker, listener, utterance, room)

    if (typeof this.brain!=='function' || typeof this.mouth!=='function') {
      throw Error('brain & mouth both need to be function')
    }

    this.on('say', (...args) => {
      this.mouth.apply(this, args)
    })
  }

  ear(talker, listener, utterance, room) {
    if (!talker || !listener || !utterance) { throw Error('Mikey.ear() must contains talker/listener/utterance') }
    log.verbose('Mikey', 'ear() %s -> %s : "%s" @ [%s]', talker, listener, utterance, room)

    return this.brain(talker, listener, utterance, room)
  }
}

function brain(instance) {
  const type = instance.constructor.name

  const brains = {
    TextBot: microsoft  // textbot
    , String: echo      // 'echo'
    , Commander: commander // commander
  }

  if (!brains[type]) {
    throw new Error('unsupport brain type: ' + type)
  }
  return brains[type]

  //////////////////////////
  function microsoft(talker, listener, utterance, room) {
    log.verbose('Mikey', `brain(microsoft).processMessage: ${talker} -> ${listener} :"${utterance}" @[${room}]`)

    if (!this.initMicrosoft) {
      log.verbose('Mikey', 'brain(microsoft) initing event[reply] callback')
      instance.on('reply', reply => {
        // console.log(reply)
        const utterance = reply.text
        const talker    = reply.from.address

        const listener  = reply.to.address
        const room      = reply.to.channelId

        log.verbose('Mikey', `brain(microsoft).on(reply): ${talker} -> ${listener} :"${utterance}" @[${room}]`)
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
    log.verbose('Mikey', `brain(echo) ${talker} -> ${listener} :"${utterance}" @[${room}]`)
    this.emit('say', talker, listener, utterance, room)
  }

  function commander(talker, listener, utterance, room) {
    listener = 'filehelper'
    log.verbose('Mikey', `brain(commander) ${talker} -> ${listener} :"${utterance}" @[${room}]`)
    instance.order(talker, listener, utterance, room)
    .then(output => {
      this.emit('say', listener, talker, output, room)
    })
    .catch(e => {
      log.verbose('Mikey', 'brain(commander) rejected: %s', e)
    })
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

    log.info('Mikey', `mouth(wechaty): ${talker} -> ${listener} :"${utterance}" @[${room}]`)
    return instance.send(m)
  }

  function cli(talker, listener, utterance, room) {
    console.log(`Mikey.mouth(cli): ${talker} -> ${listener} :"${utterance}" @[${room}]`)
  }
}

module.exports = Mikey.default = Mikey.Mikey = Mikey