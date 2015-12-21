function testPerformance() {
  var c = new GasContact()
  
  var num = 10
  var email = 'xyjj510@vip.sina.com'
  
  var startTime = new Date()
  
  for (var i=0; i<num; i++) {
    var beforeTime = new Date()
    c.isMyContact(email)
    var afterTime = new Date()
    
    var callTime = afterTime - beforeTime
    Logger.log('call time: ' + callTime)
  }
  
  var endTime = new Date()
  
  var totalTime = endTime - startTime
  var averageTime = totalTime / num
  
  Logger.log('total time: ' + totalTime + ', average: ' + averageTime)
  
}