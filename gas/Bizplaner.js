var Bizplaner = (function () {
  'use strict'
  
  var VERSION = '0.1.0'
  
  var Bizplaner = function () {
  }
  
  Bizplaner.skipInvalidBizplan = skipInvalidBizplan
  Bizplaner.init = init
  Bizplaner.analyzeDetails = analyzeDetails

  Bizplaner.ibot = ibot
  
  return Bizplaner
  
  
  ///////////////////////////////////////////////////////////
  
  function ibot(req, res, next) {
    var message = req.getMessage()
    var attachments = message.getAttachments()
    
    var attachment
    var MAX_SIZE = 8 * 1024 * 1024 - message.getBody().length
    
    log(log.DEBUG, 'MAX_SIZE: %s', MAX_SIZE)
    
    for (var i in attachments) {
      if (attachments[i].getSize() > MAX_SIZE) {
        continue
      }
      attachment = attachments[i]
      break
    }
    
//    req.ibot = IBot.query({
//      from: message.getReplyTo() || message.getFrom()
//      , to: message.getTo()
//      , subject: message.getSubject()
//      , body: message.getBody()
//      , attachment: attachment
//    })
    
    return next('iboted')
  }
  
  /**
  *
  *
  */
  function skipInvalidBizplan(req, res, next) {
    log(log.DEBUG, 'entered skipInvalidBizplan')
            
    var messages = req.getThread().getMessages()
    
    /**
    *
    * 1. Should has no trash message (fresh: had never been touched)
    * 2. Should has no other people reply (fresh: only sender self)
    * 3. Should has attachment
    *
    */
    var from = messages[0].getFrom()
    
    var isNotBizPlan = false
    var noAttachment = true
    
    for (var i=0; i<messages.length; i++) {
      
      if (/@google.com/.test(messages[i].getFrom()) ) continue
      
      // 1. check trashed message
      if (messages[i].isInTrash()) {
        isNotBizPlan = true
        req.pushError('someone have touched this thread')
      }
      
      // 2. check if other people had replied
      if (messages[i].getFrom() != from) {
        isNotBizPlan = true
        req.pushError('not all message sent from one sender.')
      }
      
      // 3. check attachment
      if (messages[i].getAttachments().length) {
        noAttachment = false
      }
    }
    
    if (noAttachment) {
      req.pushError('has no attachment')
      isNotBizPlan = true
    }
    
    // stop and return if not bp
    if (isNotBizPlan) return
    
    next()
  }
  
  
  function init(req, res, next) {
    // the first email from entrepreneur, normaly is BP
    var message = req.getMessage()
    var bizplan = new Bizplan(message)

    req.bizplan = bizplan   
    return next()
  }
  
  
  function analyzeDetails(req, res, next) {
    var bizplan = req.bizplan
    var startup = req.startup
    var message = req.getThread().getMessages()[0]
    
    if (!bizplan) {
      req.pushError('no bizplan found, cant analyze for [' + req.getThread().getFirstMessageSubject() + ']')
      return false
    }
    
    /////////////////////////////////////////////////
    //
    // 1. isToZixia
    
    var zixiaCiphers = [
      'abu'
      , '阿布'
      , 'bruce'
      , 'zixia'
      , 'lizh'
      , 'lizhuohuan'
      , 'zhuohuan'
      , '卓桓'
      , '李兄'
      , '李卓桓'
      , '卓恒'
      , '李卓恒'
      , '李总'
      , '李老师'
      , '李先生'
      , 'PABP'
      , 'MIKEBO'
    ]
    var zixiaCiphersRe = new RegExp(zixiaCiphers.join('|'), 'i')
    
    var isToZixia = false
    
    if (zixiaCiphersRe.test
        (
          bizplan.getSubject()
          + bizplan.getTo()
          + bizplan.getBody()
       )
      ) isToZixia = true;
        
    if (startup && startup.deliverTo) {
      if (/无所谓|所有人/.test(startup.deliverTo)) isToZixia = true
      else if (!/李卓桓/.test(startup.deliverTo)) isToZixia = false
    }
        
    // isToZixia
    //
    /////////////////////////////////////////
    
    
    /////////////////////////////////////////////////
    //
    // 2. positioning
    
    var isBeijing = false
    var isOffline = false
    var isGame = false

    if (startup) {
      if (/北京|beijing|中关村|海淀/i.test(startup.address + startup.company)) isBeijing = true
      if (GasContact.isBeijingMobile(startup.mobile)) {
        isBeijing = true
      } else {
        req.pushError('手机号码非北京')
      }
      if (/电商|O2O/i.test(startup.name + startup.description + startup.problem)) {
        isOffline = true
        req.pushError('电商/O2O方向')
      }
      if (/游戏/.test(startup.name + startup.description + startup.problem)) {
        isGame = true
        req.pushError('游戏方向')
      }
    }

    // positioning
    //
    /////////////////////////////////////////
    
    req.analyze = {
      zixia: isToZixia
      , beijing: isBeijing
      , game: isGame
      , offline: isOffline
    }
    
    return next()
  }


  
  /////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////
  //
  // The Following are Helper functions, not Middle Ware.
  //
  /////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////
  


}())
