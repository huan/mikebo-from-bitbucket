/**
 *
 * Wechaty bot - Mikey
 *
 */
const util = require('util')
const co  = require('co')
const log = require('npmlog')
log.level = 'verbose'
log.level = 'silly'

const EventEmitter2 = require('eventemitter2')

const IntentAction = require('./luis-intent-action')
const Middleware = require('./luis-middleware')
const Waterfall = require('./luis-waterfall')

const Commander = require('./commander')
const Mikey = require('./mikey')

const {Wechaty, BotBuilder} = require('./requires')

///////////////////////////////////////////////////////////////////////////////
/**
 * Luis
 *
 * PreView mode not support(yet) 2016/6/2
 * var model = 'https://api.projectoxford.ai/luis/v1/application/preview?id=a672fa00-adb4-4420-9f83-f6f674a1f438&subscription-key=2bc35bd5cc7f42e0839dd8400aafcd08' *
 */
const model = 'https://api.projectoxford.ai/luis/v1/application?id=a672fa00-adb4-4420-9f83-f6f674a1f438&subscription-key=2bc35bd5cc7f42e0839dd8400aafcd08'
const luis = new BotBuilder.LuisDialog(model)
.onDefault(IntentAction.Default)
.on('None'      , IntentAction.None)
.on('BizPlan'   , IntentAction.BizPlan)
.on('Greeting'  , IntentAction.Greeting)
.on('error'     , e => log.error('Luis', e))

///////////////////////////////////////////////////////////////////////////////
/**
 * Chatbot from M$
 */
const textBot = new BotBuilder.TextBot({minSendDelay: 0})
// .use(Middleware.firstRun)
.add('/', luis)
.add('/firstrun', Waterfall.firstRun)
.add('/getCity'  , Waterfall.getCity)
.add('/getMoney' , Waterfall.getMoney)
.add('/getNumber', Waterfall.getNumber)
.on('error', e => log.error('TextBot', e))


///////////////////////////////////////////////////////////////////////////////
/**
 * Wechaty
 */
const commander = new Commander()

console.log('\nMike@Wechat Loading...\n')

const wechaty = new Wechaty({head: false})
.on('scan', ({url, code}) => {
  console.log(`Scan QR Code: ${code}\n${url}`)
})
.on('login'  , user => {
  user.ready()
  .then(u => log.info('Bot', `bot login: ${user.name()}`))
})
.on('logout' , user => log.info('Bot', `bot logout: ${user.name()}`))

wechaty.on('message', m => m.ready().then(onWechatyMessage))

function onWechatyMessage(m) {
  const from = m.get('from')
  const to = m.get('to')
  const content = m.get('content')
  const room = m.get('room')

  if (commander.valid(from, to, content, room)) {
    commander.do(content)
    .then(reply => {
      wechaty.send(m.reply(reply))
    })
    .catch(e => {
      log.error('onWechatyMessage', e)
      wechaty.send(m.reply(e))
    })
    return
  }

  if (needMikey(m)) {
    mikey.hear(from, to, content, room)
  }
}

function needMikey(message) {
  log.silly('needMikey', 'start')
  if (message.self()) {
    log.silly('needMikey', 'mikey do not process self message(should not to)')
    return false
  }

  const room = message.get('room')
  const from = message.get('from')
  if (room) {  // message in room
    const roomName = Wechaty.Room
    .load(room)
    .get('name')

    if (/Wechaty/i.test(roomName)) {
      log.silly('Mikey', 'need mikey in group name %s', roomName)
      return true
    }
     log.silly('Mikey', 'no need mikey in group name %s', roomName)
  } else {          // not group message
    const isStranger = Wechaty.Contact
    .load(from)
    .get('stranger')

    if (isStranger) {
      log.silly('Mikey', 'its a stranger msg')
      // return true
    } else {
      log.silly('Mikey', 'its a friend msg')
    }
  }
  log.silly('Mikey', 'no need mikey')
  return false
}

///////////////////////////////////////////////////////////////////////////////
/**
 * Mikey
 */

const mikey = new Mikey({
  brain: textBot
  // brain: brain('echo')
  // , mouth: mouth('wechaty')
  , mouth: 'cli'
})

///////////////////////////////////////////////////////////////////////////////
/**
 * Starter
 */
function startCli() {
  const readline = require('readline')
  const rl = readline.createInterface(process.stdin, process.stdout)

  rl.setPrompt('Wechaty> ')
  rl.prompt()

  rl.on('line', (line) => {
    const msg = line.trim()
    if (msg) {
      mikey.hear('cli', 'wechaty', msg, 'c9')
    }
    rl.prompt()
  }).on('close', () => {
    console.log('Have a great day!')
    process.exit(0)
  })
}

function startWechaty() {
  wechaty.init()
  .catch(e => {
    log.error('Bot', 'init() fail:' + e)
    wechaty.quit()
    process.exit(-1)
  })
}

///////////////////////////////////////////////////////////////////////////////

// startCli()
startWechaty()