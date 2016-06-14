const {Wechaty, log} = require('./requires')
const Commander   = require('./commander')

///////////////////////////////////////////////////////////////////////////////
/**
 * Wechaty
 */
const wechaty = new Wechaty({
  session: 'bot.wechaty.json'
  , port: 18788
})

wechaty
.on('scan', ({url, code}) => {
  console.log(`Scan QR Code to login: [${code}]\n${url}`)

  if (!/201|200/.test(code)) {
    let loginUrl = url.replace(/\/qrcode\//, '/l/')
    require('qrcode-terminal').generate(loginUrl)
  } else {

  }
})
.on('login'  , user => {
  log.info('Bot', `bot login: ${user.name()}`)
  user.dump()
  // user.dumpRaw()
})
.on('logout' , user => log.info('Bot', `bot logout: ${user.name()}`))

const commander = new Commander(wechaty)

// must bind this to wechaty
function onWechatyMessage(m, mikey) {

  const from = m.get('from')
  const to = m.get('to')
  const content = m.toString()
  const room = m.get('room')

  const fromContact = Wechaty.Contact.load(from)
  const toContact   = Wechaty.Contact.load(to)
  const roomRoom    = Wechaty.Room.load(room)

  console.log('<' + fromContact.toString() + (room ? '@'+roomRoom.toString() : '') + '>: ' + m.toStringDigest())

  if (m.type() != 'TEXT') {
    log.verbose('Bot', 'skip non-TEXT message')
    return
  }

  if (/^wechaty$/i.test(m.get('content'))) {
    this.reply(m, '哈哈，感谢你关注我的Wechaty。目前还在建设中，欢迎前往 github 逛逛源代码先： https://github.com/zixia/wechaty ~')
    return
  }
  /**
   * 1. commander middleware
   */
  if (commander.valid(from, to, content, room)) {
    commander.order(from, to, content, room)
    .then(output => {
      // still send to `filehelper`
      m.set('content', output)
      this.send(m)
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
  m.ready().then(() => { // re-ready to double check ready status
    if (needMikey(m)) {
      mikey.ear(from, to, m.toString(), room)
    }
 })

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
     log.silly('Mikey', 'no need mikey in this %d people room'
      , room.get('members').length)
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

wechaty.onWechatyMessage = onWechatyMessage

module.exports = wechaty