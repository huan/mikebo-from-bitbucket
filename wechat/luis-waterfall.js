const util = require('util')

const {BotBuilder, log} = require('./requires')
const DialogAction      = BotBuilder.DialogAction
const Prompts           = BotBuilder.Prompts
const PromptType        = BotBuilder.PromptType
const EntityRecognizer  = BotBuilder.EntityRecognizer

const replies = require('./requires')

const askStartup = [
   function(session, args, next) {
    log.verbose('Waterfall', 'askStartup')

    // console.log(session)
    const address = session.message.from.address
    const userData = session.userData
    const dialogData = session.dialogData

    Prompts.text(session, '先简单了解一下你的情况')
  }
  , function(session, results, next) {
    session.beginDialog('/getCity', { prompt: "你在哪个城市？" })
  }
  , function(session, results, next) {
    log.verbose('IntentAction', 'default() %s', util.inspect(results))

    // Check their answer
    if (results.response) {
        session.send("了解，你的城市是" + results.response)
    } else {
        session.send("抱歉，我只看北京地区的项目")
    }
    next()
  }
  , function(session, results, next) {
    session.beginDialog('/getMoney', { prompt: "你们融资金额是？"})
  }
  , function (session, results, next) {
    log.verbose('IntentAction', 'default() %s', util.inspect(results))

    // Check their answer
    if (results.response) {
        Prompts.text(session, "了解，你们希望融资" + results.response.entity)
    } else {
        Prompts.text(session, "抱歉，我没弄明白你们希望融资多少钱。")
    }
  }
  , function(session, results, next) {
    session.beginDialog('/getNumber', { prompt: "你们团队多少人？"})
  }
  , function (session, results, next) {
    log.verbose('IntentAction', 'default() %s', util.inspect(results))

    // Check their answer
    if (results.response) {
        session.send("了解，你们团队有" + results.response + '人。先这样，我们回聊。')
    } else {
        session.send("抱歉，我没弄明白你们团队多少人。")
    }
    next()
  }
]


const Waterfall = {
  firstRun: [
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
  , askStartup: askStartup

  , getCity: DialogAction.validatedPrompt(PromptType.text, function (response) {
    return /北京|上海|深圳|广州|武汉|成都|杭州/.test(response)
  })

  , getMoney: function(session, results) {
    Prompts.choice(session, "你们本轮融资需要多少钱？", ["数十万", "数百万", "没想好"])
    // session.endDialog({ response: { bar: 'foo' }});
  }

  , getNumber: function(session, results) {
    Prompts.number(session, '你们团队多少人？')
    // session.endDialog({ response: { bar: 'foo' }});
  }
}

    /**
     * session.replaceDialog('/menu');
     * session.beginDialog('/getNumber', { prompt: "你们团队多少人？"})
     */

module.exports = Waterfall