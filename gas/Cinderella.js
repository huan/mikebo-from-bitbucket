var Cinderella = (function () {
  'use strict'
  
  var VERSION = '0.1.0'
  
//  var ENDPOINT = 'http://111.207.243.70:8838/Cinderella/GetInfo'
  
  // HK proxy
  // $ sudo apt-get update && sudo apt-get install socat
  // $ socat TCP-LISTEN:8088,fork TCP:111.207.243.70:8088
  var ENDPOINT = 'http://106.186.29.141:8838/Cinderella/GetInfo'
  
  var Cinderella = function () {
  }
  
  Cinderella.query = query

    
  return Cinderella
  
  
  ///////////////////////////////////////////////////////////
 
  function query(options) {
    
    var headers = {
    }
    
    var payload = {
      sender: options.from || 'zixia@zixia.net'
      , receiver: options.to || 'bupt@bupt.edu'
      , sendtime: getSendTime()
      , subject: options.subject || '测试demo'
      , body: options.body || '快塞给我一封邮件吧！'
      
      // bug compatible
//      , uploadFiles: Utilities.newBlob('TEST DATA1').setName('test-data1.dat') // XXX bug compatible
    }
    
    if (options.attachment) {
      payload.uploadFiles = options.attachment
    }

    // https://developers.google.com/apps-script/reference/url-fetch/url-fetch-app#fetch(String,Object)
    //    
    // Because payload is a JavaScript object, it will be interpreted as
    // an HTML form. (We do not need to specify contentType; it will
    // automatically default to either 'application/x-www-form-urlencoded'
    // or 'multipart/form-data')
    
    var options = {
      muteHttpExceptions: true
      , method : "post"
      , headers: headers
      , payload : payload
    }
    
    var resp = UrlFetchApp.fetch(ENDPOINT, options)
    var code = resp.getResponseCode()
    
    var retObj = {}
    
    switch (true) {
      case /^2/.test(code):
        retObj = JSON.parse(resp.getContentText())
        break;
      default:
        retObj.error = true
        retObj.description = resp.getContentText()
        break;
    }
    
    return retObj
  }
  
  function getSendTime() {
    var date = new Date()
    
    var year = date.getFullYear()
    var month = date.getMonth() + 1
    var day = date.getDate()
    var hour = date.getHours()
    var minute = date.getMinutes()
    
    var sendtime = year + '-' + month + '-' + day + ' ' + hour + ':' + minute
//    Logger.log(sendtime)
    return sendtime
  }  
}())

function testCinderella() {
  Logger.log(JSON.stringify(Cinderella.query({
    attachment: Utilities.newBlob('TEST DATA1 北京 融资 项目 一百万 10%').setName('北京阿卡科技有限公司-大宝贝商业计划书')
  })))
  
}