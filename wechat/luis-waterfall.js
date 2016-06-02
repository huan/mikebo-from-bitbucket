const log = require('npmlog')
const util = require('util')

const BotBuilder = require('/home/ubuntu/git/BotBuilder/Node')
const DialogAction      = BotBuilder.DialogAction
const Prompts           = BotBuilder.Prompts
const PromptType        = BotBuilder.PromptType
const EntityRecognizer  = BotBuilder.EntityRecognizer

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

module.exports = Waterfall