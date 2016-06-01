const readline = require('readline');
const rl = readline.createInterface(process.stdin, process.stdout);

const BotBuilder = require('/home/ubuntu/git/BotBuilder/Node')

const DialogAction  = BotBuilder.DialogAction
const TextBot       = BotBuilder.TextBot
const LuisDialog    = BotBuilder.LuisDialog
const Prompts       = BotBuilder.Prompts
const PromptType    = BotBuilder.PromptType
const EntityRecognizer = BotBuilder.EntityRecognizer

const util = require('util')
const log = require('npmlog')
log.level = 'verbose'

const replies = require('./replies')

const MyMiddleware = {
  commandController: function(session, next) {
    const userData = session.userData
    const text = session.message.text

    if (!/^\//.test(text)) {
      return next()
    }

    log.verbose('Middleware', `CMD ${text} found. To Be Executed...`)
    let [cmd, key, value] = text.split(/\s+/)
    log.verbose('Middleware', `${cmd} : ${key} -> ${value}`)

    switch (true) {
      case /\/set/i.test(cmd):
        if (!key) {
          session.send('need key')
          break
        }
        if (!value) {
          value = true
        }
        dialogMessage.from[key] = value
        session.send(`set msg from[${key}] to ${value}`)
        break
      default:
        session.send(`${cmd} not supported yet`)
        break
    }
  }
  , firstRun: function(session, next) {
      if (!session.userData.firstRun) {
          session.userData.firstRun = true
          session.beginDialog('/firstrun')
      } else {
          next()
      }
  }
}

const MyWaterfall = {
  firstRun: function() {
    return [
      function (session) {
      Prompts.text(session, "Hello... What's your name?");
      },
      function (session, results) {
        // We'll save the prompts result and return control to main through
        // a call to replaceDialog(). We need to use replaceDialog() because
        // we intercepted the original call to main and we want to remove the
        // /firstRun dialog from the callstack. If we called endDialog() here
        // the conversation would end since the /firstRun dialog is the only
        // dialog on the stack.
        log.verbose('Waterfall', 'firstRun() result: %s', util.inspect(results))
        session.userData.name = results.response;
        session.replaceDialog('/');
      }
    ]
  }
  , getCity: function() {
    return DialogAction.validatedPrompt(PromptType.text, function (response) {
      return /北京|上海|深圳|广州|武汉|成都|杭州/.test(response)
    })
  }
}


const IntentAction = {
  /**
   *
   * IntentAction: BizPlan
   *
   */
  BizPlan: function() {
    return [
      // BizPlan - 1.
      function BianPlanStep1(session, args, next) {
        log.verbose('Waterfall', 'bizplan()')
        session.send(replies('mailBizplan'))
        // console.log(session)
        const address = session.message.from.address
        const userData = session.userData
        const dialogData = session.dialogData

        log.verbose('Waterfall', `default() address: %s`, util.inspect(address))
        log.verbose('Waterfall', 'default() userData: %s', util.inspect(userData))
        log.verbose('Waterfall', 'default() dialogData: %s', util.inspect(dialogData))

        if (dialogData[address]) {
          dialogData[address] += 1
        } else {
          dialogData[address] = 1
        }
        let n = dialogData[address]
        log.verbose('Waterfall',`default() ${address} ${n} times`)

        next({bizplan: true})
      }
      // BizPlan - 2
      , function BizPlanStep2(session, results, next) {
        session.beginDialog('/getCity', { prompt: "你在哪个城市？" });
      }
      , function BizPlanStep2(session, results, next) {
        log.verbose('Waterfall', 'default() %s', util.inspect(results))

        // Check their answer
        if (results.response) {
            session.send("了解，你的城市是" + results.response);
        } else {
            session.send("抱歉，我只看北京地区的项目");
        }
      }
    ]
  }

  /**
   *
   * IntentAction: None
   *
   */
  , None: function() {
    return [
      function (session, args, next) {
        log.verbose('Waterfall', 'default()')
        session.send("Hi %s, glad to see you.", session.userData.name);
        // console.log(session)
        const address = session.message.from.address
        const userData = session.userData
        const dialogData = session.dialogData


        log.verbose('Waterfall', `default() address: %s`, util.inspect(address))
        log.verbose('Waterfall', 'default() userData: %s', util.inspect(userData))
        log.verbose('Waterfall', 'default() dialogData: %s', util.inspect(dialogData))

        if (dialogData[address]) {
          dialogData[address] += 1
        } else {
          dialogData[address] = 1
        }
        let n = dialogData[address]
        log.verbose('Waterfall',`default() ${address} ${n} times`)

        next({haha: 'xixi'})
      }

      , function (sesssion, args) {
        log.verbose('Waterfall', 'default() %s', util.inspect(args))
      }
    ]
  }

  /**
   *
   * IntentAction: Greeting
   *
   */
  , Greeting: function() {
    return function (session, args) {
      log.verbose('Waterfall', 'greeting()')

      const userData = session.userData
      const dialogData = session.dialogData

      if (!userData.greeting) {
        session.send(replies('greeting') + ' %s', session.userData.name)
        // console.log(session)
        const address = session.message.from.address

        userData.greeting = true
      }
    }
  }

  /**
   *
   * IntentAction: No Intent
   *
   */
  , Default: function() {
    return function (session, args) {
      log.verbose('Waterfall', 'greeting()')

      const userData = session.userData
      const dialogData = session.dialogData

      session.send(replies('unknown'), session.userData.name)
    }
  }
}

// Create LUIS Dialog that points at our model and add it as the root '/' luis for our Cortana Bot.
var model = 'https://api.projectoxford.ai/luis/v1/application?id=a672fa00-adb4-4420-9f83-f6f674a1f438&subscription-key=2bc35bd5cc7f42e0839dd8400aafcd08'
// var model = 'https://api.projectoxford.ai/luis/v1/application/preview?id=a672fa00-adb4-4420-9f83-f6f674a1f438&subscription-key=2bc35bd5cc7f42e0839dd8400aafcd08'

var luis = new LuisDialog(model)
luis.on('BizPlan'   , IntentAction.BizPlan())
luis.on('Greeting'  , IntentAction.Greeting())
luis.on('None'      , IntentAction.None())
luis.onDefault(IntentAction.Default())

luis.on('error', e => {
  log.error('Luis', e)
})
/////////////////////////////////////////////////////
var bot = new TextBot({minSendDelay: 0})
bot.on('error', e => {
  log.error('TextBot', e)
})

bot.use(MyMiddleware.commandController)
bot.use(MyMiddleware.firstRun)

bot.add('/', luis)
bot.add('/firstrun', MyWaterfall.firstRun())
bot.add('/getCity', MyWaterfall.getCity())

const dialogMessage = {
  text: ''
  , language: 'zh-CHS'
  , from: {
    channelId: 'wechat'
    , address: 'unknown address'
  }
}

bot.on('reply', function (reply) {
  console.log('reply to who??? event reply: ' + reply.text)
})

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
