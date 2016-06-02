const replies = {
  mailBizplan: '好，请发送商业计划书到 zixia@pre-angel.com ，同时抄送 bp@pre-angel.com 。我们所有的合伙人都可以收到。'
  , greeting: [
    'hi'
    , 'hello'
    , '你好'
    , '好'
    , '在'
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
