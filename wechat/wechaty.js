const {Wechaty, log} = require('./requires')

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

module.exports = wechaty