/**
 *
 * Wechaty bot use a ApiAi.com brain
 *
 * Mike Bo @ Wechat
 *
 * Enjoy!
 *
 * Wechaty - https://github.com/zixia/wechaty
 *
 */
const util = require('util')
const co  = require('co')
const log = require('npmlog')
log.level = 'verbose'
log.level = 'silly'

const EventEmitter2 = require('eventemitter2')

const Wechaty = require('/home/ubuntu/workspace/')
const BotBuilder = require('/home/ubuntu/git/BotBuilder/Node')

const IntentAction = require('./luis-intent-action')
const Middleware = require('./luis-middleware')
const Waterfall = require('./luis-waterfall')

////////////////////////////////////////////////////////////
const model = 'https://api.projectoxford.ai/luis/v1/application?id=a672fa00-adb4-4420-9f83-f6f674a1f438&subscription-key=2bc35bd5cc7f42e0839dd8400aafcd08'
// PreView mode not support(yet) 2016/6/2
// var model = 'https://api.projectoxford.ai/luis/v1/application/preview?id=a672fa00-adb4-4420-9f83-f6f674a1f438&subscription-key=2bc35bd5cc7f42e0839dd8400aafcd08'

const luis = new BotBuilder.LuisDialog(model)
.onDefault(IntentAction.Default)
.on('None'      , IntentAction.None)
.on('BizPlan'   , IntentAction.BizPlan)
.on('Greeting'  , IntentAction.Greeting)
.on('error'     , e => log.error('Luis', e))

/////////////////////////////////////////////////////////////
const textBot = new BotBuilder.TextBot({minSendDelay: 0})
.use(Middleware.commandController)
.use(Middleware.firstRun)
.add('/', luis)
.add('/firstrun', Waterfall.firstRun)
.add('/getCity'  , Waterfall.getCity)
.add('/getMoney' , Waterfall.getMoney)
.add('/getNumber', Waterfall.getNumber)
.on('error', e => log.error('TextBot', e))

console.log(`
Mike@Wechat Loading...
`)

const wechaty = new Wechaty({head: false})
.on('scan', ({url, code}) => {
  console.log(`Scan qrcode in url to login: ${code}\n${url}`)
})
.on('login'  , user => {
  user.ready()
  .then(u => log.info('Bot', `bot login: ${user.toStringEx()}`))
})
.on('logout' , e => log.info('Bot', 'bot logout.'))
.on('message', m => {
  m.ready().then(() => {
    log.verbose('Bot', 'recv: %s'  , m.toStringEx())
    if (isWechatyChannel(m)) {
      log.info('Bot', 'Wechaty hear: %s', m)
      const dialogMessage = wechatyMessage2TextBotReply(m)
      textBot.processMessage(dialogMessage)//, (err, reply) => wechatyCallback)
    }
  }).catch(e => {
    log.error('Bot', 'error: %s', e)
  })
})

wechaty.init()
.catch(e => {
  log.error('Bot', 'init() fail:' + e)
  wechaty.quit()
  process.exit(-1)
})

textBot.on('reply', function (reply) {
  const c = Wechaty.Contact.load(reply.to.address)
  c.ready()
  .then(() => {
    log.info('Luis', `event[reply] to ${c.name()}:"${reply.text}"`)

    const m = textBotReply2WechatyMessage(reply)
    // console.log(util.inspect(m))
    wechaty.send(m)
  })
})

function isWechatyChannel(m) {
  log.silly('Luis', 'isWechatyChannel()')
  if (m.group()) {  // group message
    const g = new Wechaty.Group.load(m.group())
    // console.log(g)
    // log.silly('Luis', 'group name %s', g.name())
    if (/Wechaty/i.test(g.name())) {
      return true
    }
  } else {          // not group message
    const f = Wechaty.Contact.load(m.from())
    if (f.stranger()) {
      // return true
    }
  }
  return false
}

function wechatyCallback(err, reply) {
  if (err) {
    log.error('Luis', 'wechatyCallback err: %s', err)
    return
  }
  log.verbose('Luis', 'wechatyCallback()')
  const message = textBotReply2WechatyMessage(reply)
  return wechaty.send(message)
}

function textBotReply2WechatyMessage(reply) {
  const to = reply.to.address
  const content = reply.text
  // console.log(reply)
// log.warn('Reply', 'to: %s', to)

  return new Wechaty.Message()
  .set('to', to)
  .set('content', content)
}

function wechatyMessage2TextBotReply(m) {
  return {
    text: m.content()
    , from: {
      channelId: 'wechat'
      , address: m.group() ? m.group() : m.from()
    }
  }
}

function simpleCli(textBot) {
  const bot = textBot

  const readline = require('readline');
  const rl = readline.createInterface(process.stdin, process.stdout);

  const dialogMessage = {
    text: ''
    , language: 'zh-CHS'
    , from: {
      channelId: 'wechat'
      , address: 'unknown address'
    }
  }


  // bot.processMessage({ text: 'hello', from: { channelId: 'test', address: 'zixia' } }, function (err, reply) {
  //   if (err) {
  //     return console.log('err:' + err)
  //   }
  //   console.log(reply)
  //   return console.log(reply.text)
  // })



  rl.setPrompt('Wechaty> ')
  rl.prompt()


  rl.on('line', (line) => {
    line = line.trim()

    switch(true) {
      case /hello/i.test(line):
      case /world/i.test(line):
        bot.processMessage({
          text: line.trim()
          , language: 'zh-CHS'
          , from: {
            channelId: 'msn'
            , address: 'lizhuohuan'
          }
        })
        break

      default:
        dialogMessage.text = line.trim()

        if (dialogMessage.text) {
          BotBuilder.LuisDialog.recognize('test', luis.serviceUri, (err, intents, entities) => {
            if (err) {
              log.error('Luis', 'recognize error: %s', err)
              return
            }
            log.verbose('Luis', 'recognize intents: %s', util.inspect(intents))
            log.verbose('Luis', 'recognize entities: %s', util.inspect(entities))
          })
          bot.processMessage(dialogMessage)
        }
        break
    }
    rl.prompt();
  }).on('close', () => { // XXX: no session here...
    console.log('Have a great day!')
    process.exit(0)
  })

}
