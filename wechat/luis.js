const readline = require('readline');
const rl = readline.createInterface(process.stdin, process.stdout);

const BotBuilder = require('/home/ubuntu/git/BotBuilder/Node')

const log = require('npmlog')
log.level = 'verbose'

const IntentAction = require('./luis-intent-action')
const Middleware = require('./luis-middleware')
const Waterfall = require('./luis-waterfall')

var model = 'https://api.projectoxford.ai/luis/v1/application?id=a672fa00-adb4-4420-9f83-f6f674a1f438&subscription-key=2bc35bd5cc7f42e0839dd8400aafcd08'
// PreView mode not support(yet) 2016/6/2
// var model = 'https://api.projectoxford.ai/luis/v1/application/preview?id=a672fa00-adb4-4420-9f83-f6f674a1f438&subscription-key=2bc35bd5cc7f42e0839dd8400aafcd08'

var luis = new BotBuilder.LuisDialog(model)
.onDefault(IntentAction.Default)
.on('None'      , IntentAction.None)
.on('BizPlan'   , IntentAction.BizPlan)
.on('Greeting'  , IntentAction.Greeting)
.on('error'     , e => log.error('Luis', e))

/////////////////////////////////////////////////////
var bot = new BotBuilder.TextBot({minSendDelay: 0})
.use(Middleware.commandController)
.use(Middleware.firstRun)
.add('/', luis)
.add('/firstrun', Waterfall.firstRun)
.add('/getCity'  , Waterfall.getCity)
.add('/getMoney' , Waterfall.getMoney)
.add('/getNumber', Waterfall.getNumber)
.on('error', e => log.error('TextBot', e))
.on('reply', function (reply) {
  console.log('reply to who??? event reply: ' + reply.text)
})

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
        bot.processMessage(dialogMessage)
      }
      break
  }
  rl.prompt();
}).on('close', () => { // XXX: no session here...
  console.log('Have a great day!')
  process.exit(0)
})
