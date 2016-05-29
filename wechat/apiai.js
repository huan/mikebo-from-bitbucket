/**
 *
 * Wechaty bot use a ApiAi.com brain
 *
 * Apply Your Own ApiAi Developer API_KEY at: 
 * http://www.api.ai
 *
 * Enjoy!
 *
 * Wechaty - https://github.com/zixia/wechaty
 *
 */
const log = require('npmlog')
const co  = require('co')
const EventEmitter2 = require('eventemitter2')

const Wechaty = require('wechaty')
//log.level = 'verbose'
// log.level = 'silly'

const APIAI_API_KEY = 'b8784435932c48bab2e34d0aa3c2d365'
const ApiAi = require('apiai')
const apiAi = new ApiAi(APIAI_API_KEY)

const bot = new Wechaty({head: false})

console.log(`
Mike@Wechat Loading...
`)

bot
.on('scan', ({url, code}) => {
  console.log(`[${code}]Scan qrcode in url to login:\n${url}`)
})
.on('login'  , user => log.info('Bot', `bot login: ${user}`))
.on('logout' , e => log.info('Bot', 'bot logout.'))
.on('message', m => {
  co(function* () {
    yield m.ready()

    // log.info('Bot', 'recv: %s'  , m)
    if (m.group()) {  // group message
     if (/Wechaty/i.test(m.group().name())) {
      log.info('Bot', 'wechaty talk: %s'  , m)
      talk(m)
     }
    } else {          // not group message
      if (m.from().stranger()) {
        log.info('Bot', 'stranger talk: %s'  , m)
        talk(m)
      }
    }
  })
  .catch(e => log.error('Bot', 'on message co rejected: %s' , e))
})

bot.init()
.catch(e => {
  log.error('Bot', 'init() fail:' + e)
  bot.quit()
  process.exit(-1)
})

class Talker extends EventEmitter2 {
  constructor() {
    log.verbose('Talker()')
    super()
    this.obj = {
      text: []
      , time: []
    }
    this.timer = null
  }

  init(thinker) {
    this.thinker = thinker
    return Promise.resolve(this)
  }

  save(text) {
    log.verbose('Talker', 'save(%s)', text)
    this.obj.text.push(text)
    this.obj.time.push(Date.now())
  }
  load() {
    const text = this.obj.text.join(', ')
    log.verbose('Talker', 'load(%s)', text)
    this.obj.text = []
    this.obj.time = []
    return text
  }
  
  updateTimer(delayTime) {
    delayTime = delayTime || this.delayTime()
    log.verbose('Talker', 'updateTimer(%s)', delayTime)
    
    if (this.timer) { clearTimeout(this.timer) }
    this.timer = setTimeout(this.say.bind(this), delayTime)
  }
  
  hear(text) {
    log.verbose('Talker', `hear(${text})`)
    this.save(text)
    this.updateTimer()
  }
  say() {
    log.verbose('Talker', 'say()')
    const text  = this.load()
    this.thinker(text)
    .then(reply => this.emit('say', reply))
    this.timer = null
  }
  
  delayTime() {
    const minDelayTime = 100
    const maxDelayTime = 500
    const delayTime = Math.floor(Math.random() * (maxDelayTime - minDelayTime)) + minDelayTime
    return delayTime
  }
}

var Talkers = []

function talk(m) {
  /*
  info Bot stranger talk: Message#82(<郑莲英13>:{SYS}郑莲英13 just added ...)
  ERR! Bot TypeError: Cannot read property 'id' of null

  XXX: {SYS} message has no id???
  */
  const fromId  = m.from().id
  const fromName = m.from().name()
  const groupId = m.group().id
  const content = m.content().replace(/(<([^>]+)>)/ig,'')
  
  let talkerName  = fromId + groupId
  talkerName      = require('crypto').createHash('md5').update(talkerName).digest("hex")

  if (!Talkers[talkerName]) {
    const tinker = function(text) {
      return new Promise((resolve, reject) => {
        apiAi.textRequest(text, {
          language:     'zh-cn'
          , sessionId:  talkerName
        })
        .on('response', function(response) {
          console.log(response)
          const reply = response.result.fulfillment.speech
          if (!reply) {
            log.info('ApiAi', `Talker[${fromName}@${talkerName}] do not want to talk for "${text}"`)
            return reject()
          }
          log.info('ApiAi', `Talker[%s@%s] reply:"%s" for "%s" `, fromName, talkerName, reply, text)
          return resolve(reply)
        })
        .on('error', function(error) {
          log.error('ApiAi', error)
          reject(error)
        })
        .end()
      })
    }
    Talkers[talkerName] = new Talker()
    .on('say', reply => bot.reply(m, reply))
    .init(thinker)
  }
  Talkers[talkerName].hear(content)
}
