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

    this.on('speak', (...args) => {
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
  log.verbose('Mikey', 'brain(%s)', type)

  /**
   * Hear less...
   */
  if (type==='TextBot') {
    instance = new TextBotHearNoEvil(instance)
    log.warn('Mikey', 'WechatyHearNoEvil inited')
  }

  const brains = {
    TextBot:              microsoft   // textbot
    , TextBotHearNoEvil:  microsoft   // textbot
    , Commander:          commander   // commander
    , String:             echo        // 'echo'
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
        this.emit('speak', talker, listener, utterance, room)
      })
      this.initMicrosoft = true
    }

    /*
     * Note that sentences longer than 500 characters will result in an error message. The sentences that LUIS receives are automatically logged for future use. The most recent 100K utterances are retained and available for future use.
     * https://www.luis.ai/Help#PublishingModel
     */
    if (utterance.length > 300) {
      utterance = String(utterance).substr(0,300)
    }

    instance.processMessage({
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
    return Promise.resolve()
  }

  function echo(talker, listener, utterance, room) {
    log.verbose('Mikey', `brain(echo) ${talker} -> ${listener} :"${utterance}" @[${room}]`)
    this.emit('speak', talker, listener, utterance, room)
  }

  function commander(talker, listener, utterance, room) {
    listener = 'filehelper'
    log.verbose('Mikey', `brain(commander) ${talker} -> ${listener} :"${utterance}" @[${room}]`)
    return instance.order(talker, listener, utterance, room)
    .then(output => {
      this.emit('speak', listener, talker, output, room)
    })
    .catch(e => {
      log.verbose('Mikey', 'brain(commander) rejected: %s', e)
      this.emit('speak', listener, talker, e.message, room)
    })
  }

}

function mouth(instance) {
  const type = instance.constructor.name
  log.verbose('Mikey', 'mouse(%s)', type)

  /**
   * Speak less...
   */
  if (type==='Wechaty') {
    instance = new WechatySpeakNoEvil(instance)
    log.warn('Mikey', 'WechatySpeakNoEvil inited')
  }


  const mouths = {
    Wechaty:              wechaty   // wechaty
    , WechatySpeakNoEvil: wechaty   // wechaty
    , Socket:             socket    // socket
    , TelnetStream:       socket    //
    , String:             cli       // 'cli'
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
  function socket(talker, listener, utterance, room) {
    instance.write(`Mikey.mouth(socket): ${talker} -> ${listener} :\r\n"${utterance}" @[${room}]\r\n`)
  }
}

///////////////////////////////////////////////////////////////////////////////
/**
 * Mikey Starter
 */

class TextBotHearNoEvil extends EventEmitter {
  constructor(textbot) {
    super()
    if (!textbot) throw new Error('no textbot')
    this.textbot = textbot

    textbot.on('reply', r => { this.emit('reply', r) } )
  }

  processMessage(message) {
    const utterance = message.text
    const talker    = message.from.address

    const listener  = message.to.address
    const room      = message.to.channelId

    let evil = false

    // TODO hear no evil
    const from = Wechaty.Contact.load(talker)
    if (!room && from.get('star')) {
      evil = true
      log.verbose('Bot', 'HearNoEvil skip a star contact')
    }

    if (evil) {
      log.verbose('Bot', 'Hear No Evil!')
      return
    }

    return this.textbot.processMessage({
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
}

class WechatySpeakNoEvil {
  constructor(wechaty) {
    this.wechaty = wechaty
  }

  send(message) {
    let evil = true
    let reason = 'Speak No Evil'

    // TODO: Speak No Evil
    const from  = Wechaty.Contact.load(message.from())
    const to    = Wechaty.Contact.load(message.from())
    const room  = Wechaty.Room.load(message.room())

    if (to.stranger()){
      evil = false
      reason = 'from stranger'
    }
    if (room && /wechaty/i.test(room.name())) {
      evil = false
      reason = 'in wechaty room'
    }

    if (evil) {
      log.verbose('Bot', 'Speak No Evil!')
      return
    }

    log.verbose('Bot', 'Speak because %s', reason)
    this.wechaty.send(message)
  }
}
module.exports = Mikey.default = Mikey.Mikey = Mikey