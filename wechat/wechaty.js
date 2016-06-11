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
.on('scan', ({url, code}) => console.log(`Scan QR Code to login: [${code}]\n${url}`))
.on('login'  , user => {
  log.info('Bot', `bot login: ${user.name()}`)
  user.dump()
  // user.dumpRaw()
})
.on('logout' , user => log.info('Bot', `bot logout: ${user.name()}`))

module.exports = wechaty