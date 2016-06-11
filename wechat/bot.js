/**
 *
 * Mikey - Wechaty bot for Mike BO
 *
 */
const util = require('util')
const co  = require('co')
const EventEmitter = require('events')

const Commander = require('./commander')
const Mikey     = require('./mikey')

const {Wechaty, log} = require('./requires')

const luis    = require('./luis')
const wechaty = require('./wechaty')

const textbot = require('./textbot')

console.log('\nMike@Wechat Loading...\n')

// must bind this to wechaty
function onWechatyMessage(m, options) {
  const from = m.get('from')
  const to = m.get('to')
  const content = m.get('content')
  const room = m.get('room')

  const mikey     = options.mikey
  const commander = options.commander

  console.log(m.toString())

  /**
   * 1. commander middleware
   */
  if (commander.valid(from, to, content, room)) {
    commander.order(from, to, content, room)
    .then(output => {
      // still send to `filehelper`
      m.set('content', output)
      wechaty.send(m)
    })
    .catch(e => {
      log.error('onWechatyMessage', e)
      this.reply(m, e)
    })
    return
  }

  /**
   * 2. skip self middleware
   */
  if (m.self()) {
    log.silly('onWechatyMessage', 'skip self message')
    return
  }

  /**
   * 3. dump log middleware
   */
  if (false) { // dump?
    if (room) {
      Wechaty.Room.load(room).dump()
    } else {
      Wechaty.Contact.load(from).dump()
    }
    m.dump()
  }

  /**
   * 4. message process middleware
   */
  if (needMikey(m)) {
    mikey.ear(from, to, content, room)
  }
}

function needMikey(message) {
  // log.silly('needMikey', 'start')

  const room = message.room() ? Wechaty.Room.load(message.room()) : null
  const from = Wechaty.Contact.load(message.from())
  const stranger = from.get('stranger')

  if (room) {  // message in room
    if (/Wechaty/i.test(room.name())) {
      log.verbose('Mikey', 'need mikey in wechaty room')
      return true
    } else if (room.get('members').length < 9) {
      log.verbose('Mikey', 'need mikey in small room of %d people'
        , room.get('members').length)
      return true
    }
     log.silly('Mikey', 'no need mikey in this room')
  } else {     // message from individal
    if (stranger) {
      log.verbose('Mikey', 'need mikey for stranger msg')
      return true
    } else {
      log.verbose('Mikey', 'need mikey for friend msg')
      return true
    }
  }
  log.silly('Mikey', 'no need mikey')
  return false
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
    // if (from.get('star')) {
    //   evil = true
    //   log.verbose('Bot', 'HearNoEvil skip a star contact')
    // }

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

    // TODO: Speak No Evil
    const from = Wechaty.Contact.load(message.from())
    const room = Wechaty.Room.load(message.room())

    if (from.stranger())                      { evil = false }
    if (room && /wechaty/i.test(room.name())) { evil = false }

    if (evil) {
      log.verbose('Bot', 'Speak No Evil!')
      return
    }

    this.wechaty.send(message)
  }
}

function startWechaty() {

  const hearNoEvil  = new TextBotHearNoEvil(textbot)
  const speakNoEvil = new WechatySpeakNoEvil(wechaty)

  const mikey = new Mikey({
    brain:    hearNoEvil
    , mouth:  speakNoEvil
  })

  wechaty
  .on('message', m => {
    onWechatyMessage(m, {
      mikey: mikey
      , commander: new Commander()
    })
  })
  .init()
  .catch(e => {
    log.error('Bot', 'init() fail:' + e)
    wechaty.quit()
    .then(() => process.exit(-1))
  })
}

function startCli(brain) {
  const mikey = new Mikey({
    brain: brain
    , mouth: 'cli'
  })

  const readline = require('readline')
  const rl = readline.createInterface(process.stdin, process.stdout)

  rl.setPrompt('Wechaty> ')
  rl.prompt()

  rl.on('line', (line) => {
    const msg = line.trim()
    if (msg) {
      mikey.ear('cli', 'mikey', msg, 'c9')
    }
    rl.prompt()
  }).on('close', () => {
    console.log('Have a great day!')
    process.exit(0)
  })
}

///////////////////////////////////////////////////////////////////////////////


// const mikey =startCli(textbot)
const mikey = startWechaty()
// const mikey = startCli(new Commander())