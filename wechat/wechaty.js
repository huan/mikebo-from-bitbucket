const {Wechaty, log} = require('./requires')
const Commander   = require('./commander')

///////////////////////////////////////////////////////////////////////////////
/**
 * Wechaty
 */
const wechaty = new Wechaty({
  profile: 'bot.wechaty.json'
  , port: 18788
})

wechaty
.on('scan', ({url, code}) => {
  if (!/201|200/.test(code)) {
    let loginUrl = url.replace(/\/qrcode\//, '/l/')
    require('qrcode-terminal').generate(loginUrl)
  }
  console.log(`${url}\n[${code}] Scan QR Code above to login`)
})
.on('login', user => {
  log.info('Bot', `bot login: ${user.name ? user.name() : user}`)
  // user.dump()
  // user.dumpRaw()
})
.on('logout', user => log.info('Bot', `bot logout: ${user.name ? user.name() : user}`))
.on('error', e => {
  console.log('############# on error event ####################')
  log.error('Bot', 'bot exception: %s', e.message)
})

const commander = new Commander(wechaty)

// must bind this to wechaty
function onWechatyMessage({
  message
  , mikey
}) {
  const m = message

  const from = m.from()
  const to = m.to()
  const content = m.toString()
  const room = m.room()

  /**
   * Print message to console for reading
   */
  console.log((room ? '['+room.name()+']' : '')
    + '<'+from.name()+'>'
    + ':' + m.toStringDigest()
    )

  /**
   *
   * some action I can make sure... about...
   *
   */
  if (/^wechaty$/i.test(m.get('content'))) {
    this.reply(m, '哈哈，感谢你关注我的Wechaty。目前还在建设中，欢迎前往 github 逛逛源代码先： https://github.com/zixia/wechaty ~')
    return
  } else if (m.type() === Wechaty.Message.Type.SYS && /just added you to his[\s\/]*her contacts list/i.test(m.get('content'))) {
    // just added you to his / her contacts list
    // <秋之林>:{SYS}秋之林 just added you to his/her contacts list. Send a message to him/her now!
    if (from.stranger()) {
      setTimeout(() => {
        this.reply(m, '谢谢你加我，我是投资人中最会飞的程序员。你可以做一下自我介绍吗？:)')
      }, 60000) // 60s
      return
    }
  }

  /**
   * Skip non-TEXT message for processing
   */
  if (m.type() !== Wechaty.Message.Type.TEXT) {
    log.verbose('Bot', 'onWechatyMessage() skip non-TEXT message')
    return
  }

  /**
   * 1. commander middleware
   */
  const {cmd, args} = commander.valid(from, to, content, room)
  if (cmd) {
    commander.execute(cmd, args)
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
  if (this.self(m)) {
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
      mikey.ear(from.toString(), to.toString(), m.toString(), room.toString())
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

Object.assign(wechaty, { onWechatyMessage })

module.exports = {
  wechaty: wechaty
  , commander: commander
}