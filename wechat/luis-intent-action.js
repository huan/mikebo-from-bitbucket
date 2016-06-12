const {log} = require('./requires')
const util = require('util')

const replies = require('./replies')

const IntentAction = {
  /**
   *
   * IntentAction: BizPlan
   *
   */
  BizPlanNew: [
    howtoSubmitBizPlan
  ]
  , BizPlanSent: confirmSubmitBizPlan
  , GreetingChat: greetingChat
  , GreetingHoliday: greetingHoliday
  , Thank: thank
  , None: none
  , Default: defaultAct

}

function howtoSubmitBizPlan(session, args, next) {
  log.verbose('IntentAction', 'BizPlan')

  // console.log(session)
  const address = session.message.from.address
  const userData = session.userData
  const dialogData = session.dialogData

  log.verbose('IntentAction', `default() address: %s`, util.inspect(address))
  log.verbose('IntentAction', 'default() userData: %s', util.inspect(userData))
  log.verbose('IntentAction', 'default() dialogData: %s', util.inspect(dialogData))

  if (!userData.BizPlanNew) {
    session.send(replies('mailBizPlan'))
    userData.BizPlanNew = true
  } else if (!userData.AskStartup) {
    userData.AskStartup = true
    session.beginDialog('/askStartup', { prompt: "你们团队多少人？"})
  }

  if (dialogData[address]) {
    dialogData[address] += 1
  } else {
    dialogData[address] = 1
  }
  let n = dialogData[address]
  log.verbose('IntentAction',`default() ${address} ${n} times`)

  next({bizplan: true})
}

function confirmSubmitBizPlan(session, args) {
  log.verbose('IntentAction', 'BizPlan.Sent')

  const userData = session.userData
  const dialogData = session.dialogData
  const address = session.message.from.address

  if (!userData.BizPlanSent) {
    userData.BizPlanSent = true

    session.send(replies('replyBizPlan'))
  }
}

function greetingChat (session, args) {
  log.verbose('IntentAction', 'Greeting.Chat')

  const userData = session.userData
  const dialogData = session.dialogData

  if (!userData.GreetingChat) {
    session.send(replies('greetingChat'))
    // console.log(session)
    const address = session.message.from.address

    userData.GreetingChat = true
  }
}
function greetingHoliday(session, args) {
  log.verbose('IntentAction', 'Greeting.Holiday')

  const userData = session.userData
  const dialogData = session.dialogData

  if (!userData.GreetingHoliday) {
    session.send(replies('greetingHoliday'))
    // console.log(session)
    const address = session.message.from.address

    userData.GreetingHoliday = true
  }
}

function thank(session, args) {
  log.verbose('IntentAction', 'Thank')

  const userData = session.userData
  const dialogData = session.dialogData

  if (!userData.Thank) {
    session.send(replies('welcome'))
    // console.log(session)
    const address = session.message.from.address

    userData.Thank = true
  }
}
function none(sesssion, args) {
  log.verbose('IntentAction', 'None %s', util.inspect(args))
}

function defaultAct(session, args) {
  log.verbose('IntentAction', 'Default')

  const userData = session.userData
  const dialogData = session.dialogData

  if (!userData.fakeChat) { userData.fakeChat = 0 }
  if (userData.fakeChat < 3) {
    if (Math.random() > 0.5) {
      session.send(replies('fakeChat'), session.userData.name)
      userData.fakeChat++
    }
  }
}
module.exports = IntentAction