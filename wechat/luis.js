/**
 *
 * Wechaty bot - Mikey
 *
 */
const util = require('util')
const co  = require('co')

const IntentAction = require('./luis-intent-action')
const Middleware = require('./luis-middleware')
const Waterfall = require('./luis-waterfall')

const Commander = require('./commander')
const Mikey = require('./mikey')

const {Wechaty, BotBuilder, log} = require('./requires')

console.log('\nMike@Wechat Loading...\n')

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
const wechaty = new Wechaty({
  session: 'luis.wechaty.json'
})
.on('message', m => onWechatyMessage.call(wechaty, m))

const commander = wechaty.commander = new Commander({wechaty: wechaty})

// need provide this == wechaty inside function
function onWechatyMessage(m) {
  const from = m.get('from')
  const to = m.get('to')
  const content = m.get('content')
  const room = m.get('room')

  if (this.commander.valid(from, to, content, room)) {
    this.commander.order(from, to, content, room)
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

  if (m.self()) {
    log.silly('onWechatyMessage', 'skip self message')
    return
  }

  if (room) {
    Wechaty.Room.load(room).dump()
  } else {
    Wechaty.Contact.load(from).dump()
  }

  m.dump()

  if (needMikey(m)) {
    mikey.ear(from, to, content, room)
  } else {
    log.verbose('onWechatyMessage', 'recv: %s', m.toStringEx())
  }
}

function needMikey(message) {
  // log.silly('needMikey', 'start')

  const room = message.room() ? Wechaty.Room.load(message.room()) : null
  const from = Wechaty.Contact.load(message.from())
  const stranger = from.get('stranger')

  if (room) {  // message in room
    if (/Wechaty/i.test(room.name())) {
      log.silly('Mikey', 'need mikey in room %s', room.name())
      return true
    }
     log.silly('Mikey', 'no need mikey in room %s', room.name())
  } else {     // message from individal
    if (stranger) {
      log.silly('Mikey', 'its a stranger msg from %s', from.name())
      // return true
    } else {
      log.silly('Mikey', 'its a friend msg from %s', from.name())
    }
  }
  // log.silly('Mikey', 'no need mikey')
  return false
}

///////////////////////////////////////////////////////////////////////////////
/**
 * Mikey Starter
 */
function startCli() {
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

  return new Mikey({
    brain: textBot
    // , mouth: wechaty
    // brain: brain('echo')
    , mouth: 'cli'
  })
}

function startWechaty() {
  wechaty
  .on('scan', ({url, code}) => { console.log(`Scan QR Code to login: [${code}]\n${url}`) })
  .on('login'  , user => {
    log.info('Bot', `bot login: ${user.name()}`)
    user.dump()
    // user.dumpRaw()
  })
  .on('logout' , user => log.info('Bot', `bot logout: ${user.name()}`))

  wechaty.init()
  .catch(e => {
    log.error('Bot', 'init() fail:' + e)
    wechaty.quit()
    .then(() => process.exit(-1))
  })

  return new Mikey({
    brain: textBot
    , mouth: wechaty
    // brain: brain('echo')
    // , mouth: 'cli'
  })
}

function startCommander() {
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

  return new Mikey({
    brain: commander
    , mouth: 'cli'
  })
}

///////////////////////////////////////////////////////////////////////////////

// const mikey =  startCli()
const mikey = startWechaty()
// const mikey = startCommander()