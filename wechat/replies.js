const replies = {
  mailBizPlan: '好，请发送商业计划书到 zixia@pre-angel.com ，同时抄送 bp@pre-angel.com 。我们所有的合伙人都可以收到。'
  , replyBizPlan: '好的，谢谢。等我用电脑上处理商业计划书时回复你。'
  , greetingChat: [
    'hi'
    , 'hello'
    , '你好'
    , '好'
    , '在'
  ]
  , greetingHoliday: [
    '假期好'
    , '节日好'
  ]
  , fakeChat: [
    '哦'
    , '嗯'
    , '了解'
    , '好的'
    , 'en'
    , 'cool'
    , '赞'
  ]
  , unknown: [
    '什么？'
    , '没懂。'
  ]
  , welcome: [
    '客气啦'
    , ':)'
  ]
}
module.exports = function(textkey) {
  if (!(textkey in replies)) {
    textkey = 'unknown'
  }
  const value = replies[textkey]
  if (value.map) { // isArray
    return value[Math.floor(Math.random()*value.length)] // http://stackoverflow.com/questions/5915096/get-random-item-from-javascript-array
  } else {
    return value
  }
}
