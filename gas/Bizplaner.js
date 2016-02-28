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
    var bizplan = req.bizplan
    
//    req.ibot = IBot.query({
//      from: bizplan.getFromEmail()
//      , to: bizplan.getTo()
//      , subject: bizplan.getSubject()
//      , body: bizplan.getBody()
//      , attachment: bizplan.getAttachments()
//    })
    
    return next('fake iboted')
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
      
    }
    
    if (!hasAttachment(req.bizplan)) {
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
    
    if (!bizplan) throw Error('no bizplan found, cant analyze')

    req.analyze = {
      zixia: isToZixia(bizplan)
      , beijing: isBeijing(bizplan)
      , game: isGame(bizplan)
      , offline: isOffline(bizplan)
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
  

  function isBeijing(bizplan) {
    var testStr = bizplan.getLocation() + ',' + bizplan.getCompany()
    
    var isBeijing = false
    if (/北京|beijing|中关村|海淀/i.test(testStr)) isBeijing = true
    
    var mobile = bizplan.getFounderMobile()
    if (GasContact.isBeijingMobile(mobile)) {
      isBeijing = true
    }
    
    return isBeijing
  }

  function isGame(bizplan) {
    var str = [
      bizplan.getSubject()
      , bizplan.getBody()
      , bizplan.getProblem()
      , bizplan.getSolution()
    ].join(',')
      
    var isGame = false
    if (/游戏/.test(str)) {
      isGame = true
    }
    
    return isGame
  }
  
  function isOffline(bizplan) {
    var str = [
      bizplan.getSubject()
      , bizplan.getBody()
      , bizplan.getProblem()
      , bizplan.getSolution()
    ].join(',')
    
    var isOffline = false
    if (/电商|O2O/i.test(str)) {
      isOffline = true
    }
    
    return isOffline
  }

  function isToZixia(bizplan) {    
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
    
    var testStr = [
      bizplan.getSubject()
      , bizplan.getTo()
      , bizplan.getBody()
    ].join(',')
    
    var isToZixia = false
    
    if (zixiaCiphersRe.test(testStr)) isToZixia = true
    
    var destination = bizplan.getDestination()
    
    if (destination) {
      if (/无所谓|所有人/.test(destination)) isToZixia = true
      else if (!/李卓桓/.test(destination)) isToZixia = false
    }
    
    return isToZixia
  }
  
  function hasAttachment(bizplan) {
    if (!bizplan)                        return false
    if (bizplan.getAttachments().length) return true
    
    var cloudWords = [
      '邮箱发来的超大附件'
      , '邮箱发来的云附件'
    ]
    
    var RE = new RegExp(cloudWords.join('|'), 'i')
    
    if (RE.test(bizplan.getBody())) return true
    
    
  }
  
}())
