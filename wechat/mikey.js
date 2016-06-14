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

    log.info('Mikey', `borned with brain(${this.brain.brainType}) and mouth(${this.mouth.mouthType})`)

    this.on('speak', (...args) => {
      log.verbose('Mikey', `event[speak] try to speak by mouth ${this.mouth.mouthType}`)
      this.mouth.apply(this, args)
    })
  }

  ear(talker, listener, utterance, room) {
    if (!talker || !listener || !utterance) { throw Error('Mikey.ear() must contains talker/listener/utterance') }
    log.verbose('Mikey', 'ear() %s -> %s : "%s" @ [%s]', talker, listener, utterance, room)

    log.verbose('Mikey', `use brain ${this.brain.brainType} to hear`)
    return this.brain(talker, listener, utterance, room)
  }
}

function brain(instance) {
  const type = instance.constructor.name
  log.verbose('Mikey', 'making brain(%s)', type)

  /**
   * Hear less...
   */
  if (type==='TextBot') {
    instance = new TextBotHearNoEvil(instance)
    log.verbose('Mikey', 'WechatyHearNoEvil inited')
  }

  const brains = {
    TextBot:              textbotWraper     // textbot
    , TextBotHearNoEvil:  textbotWraper     // textbot
    , Commander:          commanderWraper   // commander
    , String:             echoWraper        // 'echo'
  }

  if (!brains[type]) {
    throw new Error('unsupport brain type: ' + type)
  }
  brains[type].brainType = type
  return brains[type]

  //////////////////////////
  function textbotWraper(talker, listener, utterance, room) {
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

  function echoWraper(talker, listener, utterance, room) {
    log.verbose('Mikey', `brain(echo) ${talker} -> ${listener} :"${utterance}" @[${room}]`)
    this.emit('speak', talker, listener, utterance, room)
  }

  function commanderWraper(talker, listener, utterance, room) {
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
  log.verbose('Mikey', 'making mouth(%s)', type)

  /**
   * Speak less...
   */
  if (type==='Wechaty') {
    instance = new WechatySpeakNoEvil(instance)
    log.verbose('Mikey', 'WechatySpeakNoEvil added to wechaty')
  }


  const mouths = {
    Wechaty:              wechatyWraper   // wechaty
    , WechatySpeakNoEvil: wechatyWraper   // wechaty
    , Socket:             socketWraper    // socket
    , TelnetStream:       socketWraper    //
    , String:             cliWraper       // 'cli'
  }
  if (mouths[type]) {
    mouths[type].mouthType = type
    return mouths[type]
  } else {
    throw new Error('unsupport mouth type: ' + type)
  }

  function wechatyWraper(talker, listener, utterance, room) {
    const m = new Wechaty.Message()
    .set('from'   , talker)
    .set('to'     , listener)
    .set('content', utterance)
    .set('room'   , room)

    log.verbose('Mikey', `mouth(wechaty): ${talker} -> ${listener} :"${utterance}" @[${room}]`)
    return instance.send(m)
  }

  function cliWraper(talker, listener, utterance, room) {
    console.log(`Mikey.mouth(cli): ${talker} -> ${listener} :"${utterance}" @[${room}]`)
  }
  function socketWraper(talker, listener, utterance, room) {
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
    log.verbose('Mikey', 'WechatSpeakNoEvil.send()')

    let evil = true
    let reason = 'Speak No Evil'

    // TODO: Speak No Evil
    // const from  = Wechaty.Contact.load(message.from())
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

    log.warn('WechatSpeakNoEvil', 'Speak because %s', reason)
    this.wechaty.send(message)
  }
}
module.exports = Mikey.default = Mikey.Mikey = Mikey