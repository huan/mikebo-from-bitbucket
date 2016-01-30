var IBot = (function () {
  'use strict'
  
  var VERSION = '0.1.0'
  
//  var ENDPOINT = 'http://111.207.243.70:8088/IbotInfo/GetInfo'
  
  // HK proxy
  // $ sudo apt-get update && sudo apt-get install socat
  // $ socat TCP-LISTEN:8088,fork TCP:111.207.243.70:8088
  var ENDPOINT = 'http://119.28.15.194:8088/IbotInfo/GetInfo'
//  var ENDPOINT = 'http://119.28.15.194:8888/IbotInfo/GetInfo'
  
  var IBot = function () {
  }
  
  IBot.query = query

    
  return IBot
  
  
  ///////////////////////////////////////////////////////////
 
  function query(options) {
    
    var headers = {
    }
    
    var payload = {
      sender: options.from || 'zixia@zixia.net'
      , receiver: options.to || 'bupt@bupt.edu'
      , sendtime: '2015-12-16 10:43'
      , subject: options.subject || '测试demo'
      , body: options.body || '快塞给我一封邮件吧！'
      
      // bug compatible
      , uploadFiles: Utilities.newBlob('TEST DATA1').setName('test-data1.dat') // XXX bug compatible
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
  
}())

function testIBot() {
  Logger.log(JSON.stringify(IBot.query({
//    attachment: Utilities.newBlob('TEST DATA1').setName('test-data1.dat')
  })))
}