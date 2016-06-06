const log = require('npmlog')
const util = require('util')

const replies = require('./replies')

const IntentAction = {
  /**
   *
   * IntentAction: BizPlan
   *
   */
  BizPlan: [
    // BizPlan - 1.
    function BianPlanStep1(session, args, next) {
      log.verbose('IntentAction', 'BizPlan')

      session.send(replies('mailBizplan'))
      // console.log(session)
      const address = session.message.from.address
      const userData = session.userData
      const dialogData = session.dialogData

      log.verbose('IntentAction', `default() address: %s`, util.inspect(address))
      log.verbose('IntentAction', 'default() userData: %s', util.inspect(userData))
      log.verbose('IntentAction', 'default() dialogData: %s', util.inspect(dialogData))

      if (dialogData[address]) {
        dialogData[address] += 1
      } else {
        dialogData[address] = 1
      }
      let n = dialogData[address]
      log.verbose('IntentAction',`default() ${address} ${n} times`)

      next({bizplan: true})
    }
    // BizPlan - 2
    , function BizPlanStep2(session, results, next) {
      session.beginDialog('/getCity', { prompt: "你在哪个城市？" })
    }
    , function BizPlanStep3(session, results, next) {
      log.verbose('IntentAction', 'default() %s', util.inspect(results))

      // Check their answer
      if (results.response) {
          session.send("了解，你的城市是" + results.response);
      } else {
          session.send("抱歉，我只看北京地区的项目");
      }
      next()
    }
    , function BizPlanStep4(session, results, next) {
      session.beginDialog('/getMoney', { prompt: "你们融资金额是？"})
    }
    , function (session, results, next) {
      log.verbose('IntentAction', 'default() %s', util.inspect(results))

      // Check their answer
      if (results.response) {
          session.send("了解，你们希望融资" + results.response.entity)
      } else {
          session.send("抱歉，我没弄明白你们希望融资多少钱。")
      }
      next()
    }
    , function(session, results, next) {
      session.beginDialog('/getNumber', { prompt: "你们团队多少人？"})
    }
    , function (session, results, next) {
      log.verbose('IntentAction', 'default() %s', util.inspect(results))

      // Check their answer
      if (results.response) {
          session.send("了解，你们团队有" + results.response + '人')
      } else {
          session.send("抱歉，我没弄明白你们团队多少人。")
      }
      next()
    }
    /**
     * session.replaceDialog('/menu');
     * session.beginDialog('/getNumber', { prompt: "你们团队多少人？"})
     */
  ]

  /**
   *
   * IntentAction: Greeting
   *
   */
  , Greeting: function (session, args) {
    log.verbose('IntentAction', 'Greeting')

    const userData = session.userData
    const dialogData = session.dialogData

    if (!userData.greeting) {
      session.send(replies('greeting') + ' %s', session.userData.name)
      // console.log(session)
      const address = session.message.from.address

      userData.greeting = true
    }
  }

  /**
   *
   * IntentAction: None
   *
   */
  , None: function (sesssion, args) {
    log.verbose('IntentAction', 'None %s', util.inspect(args))
  }

  /**
   *
   * IntentAction: No Intent
   *
   */
  , Default: function (session, args) {
    log.verbose('IntentAction', 'Default')

    const userData = session.userData
    const dialogData = session.dialogData

    session.send(replies('unknown'), session.userData.name)
  }
}

module.exports = IntentAction