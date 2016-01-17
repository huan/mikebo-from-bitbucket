var Bizplaner = (function () {
  'use strict'
  
  var VERSION = '0.1.0'
  
  var Bizplaner = function () {
  }
  
  Bizplaner.skipInvalidBizPlan = skipInvalidBizPlan
  Bizplaner.summaryBizPlan = summaryBizPlan
  Bizplaner.analyzeDetails = analyzeDetails

  Bizplaner.logOnEnd = logOnEnd
  Bizplaner.logOnStart = logOnStart
  
  return Bizplaner
  
  
  ///////////////////////////////////////////////////////////
  
  /**
  *
  *
  */
  function skipInvalidBizPlan(req, res, next) {
    log(log.DEBUG, 'entered skipInvalidBizPlan')
            
    var messages = req.getThread().getMessages()
    
    /**
    *
    * 1. Should has no trash message (fresh: had never been touched)
    * 2. Should has no other people reply (fresh: only sender self)
    *
    */
    var from = messages[0].getFrom()
    
    var isNotBizPlan = false
    var reason = ''
    
    for (var i=0; i<messages.length; i++) {
      
      if (/@google.com/.test(messages[i].getFrom()) ) continue
      
      if (messages[i].isInTrash()) {
        isNotBizPlan = true
        reason = 'someone have touched this thread.'
      }
      
      if (messages[i].getFrom() != from) {
        isNotBizPlan = true
        reason = 'not all message sent from one sender.'
      }
      
    }
    
    if (isNotBizPlan) {
      req.errors.push('is not bizplan because ' + reason)
    }
    
    next()
  }
  
  
  function summaryBizPlan(req, res, next) {
    log(log.DEBUG, 'entered summaryBizPlan')
    
    // the first email from entrepreneur, normaly is BP
    var message = req.getThread().getMessages()[0]
    
    var from = message.getReplyTo() || message.getFrom()
    var cc = message.getCc()
    var to = message.getTo()
    var subject = message.getSubject()
    var description = message.getBody()
    var attachments = message.getAttachments()
    
    // if attachments size more then 8MB, then pick one and keep size less than 8MB
    pickedAttachments = pickAttachments_(attachments)
    
    if (pickedAttachments.length < attachments.length) {
      var notice = Utilities.formatString('<p>NOTICE: %s attachments too large.</p><br />', Math.floor(attachments.length))
      description = notice + description
      
      req.errors.push('attachments dropped. original ' + Math.floor(attachments.length) + ' attachments.')
    }
    
    req.bizplan = {
      from: from
      , to: to // + ',' + cc
      , subject: subject
      , description: description
      , attachments: pickedAttachments
    }
    
    next()
  }
  
  
  function analyzeDetails(req, res, next) {
    var bizplan = req.bizplan
    var startup = req.startup
    var message = req.getThread().getMessages()[0]
    
    if (!bizplan) {
      req.errors.push('no bizplan found, cant analyze for [' + req.getThread().getFirstMessageSubject() + ']')
//      log(log.ERR, 'no bizplan found, cant analyze for [%s]', req.getThread().getFirstMessageSubject())
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
          bizplan.subject 
          + bizplan.to 
          + message.getBody()
       )
      ) isToZixia = true;
    
    Logger.log('isToZixia 1: ' + isToZixia)  
    
    if (startup && startup.deliverTo) {
      if (/无所谓/.test(startup.deliverTo)) isToZixia = true
      else if (!/李卓桓/.test(startup.deliverTo)) isToZixia = false
    }
    Logger.log('isToZixia 2: ' + isToZixia)    
        
    // isToZixia
    //
    /////////////////////////////////////////
    
    /////////////////////////////////////////////////
    //
    // 2. positioning
    
    var isBeijing = false
    var isOffline = false
    var isGame = false

//    log('startup: ' + startup)
//
//    log('isBeijing: ' + isBeijing)    
  
    if (startup) {
      if (/北京|beijing|中关村|海淀/i.test(startup.address + startup.company)) isBeijing = true
      if (GasContact.isBeijingMobile(startup.mobile)) {
        isBeijing = true
      } else {
        req.errors.push('手机号码非北京')
      }
      if (/电商|O2O/i.test(startup.name + startup.description + startup.problem)) {
        isOffline = true
        req.errors.push('电商/O2O方向')
      }
      if (/游戏/.test(startup.name + startup.description + startup.problem)) {
        isGame = true
        req.errors.push('游戏方向')
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
    
    next()
  }

  function logOnStart(req, res, next) {
    req.startTime = new Date()
    req.errors = []
    log(log.DEBUG, '%s start processing %s'
        , req.getChannelName ? req.getChannelName() : 'unknown'
        , req.getThread      ? req.getThread().getFirstMessageSubject() : 'unknown'
       )
    next()
  }

  function logOnEnd(req, res, next) {
    log(log.NOTICE, 'C(%s/%ss)[%s] %s'
        , req.getChannelName ? req.getChannelName() : 'unknown'
        , Math.floor((new Date() - req.startTime)/1000)
        
        , req.getThread ? req.getThread().getFirstMessageSubject() : 'unknown'
        , req.errors.map(function (e) { 
          if (e instanceof Error) {
            return e.name + ':' + e.message + ':' + e.stack
          } else {
            return e
          }
        }).join(',')
       )
    next()
  }
  
  
  /////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////
  //
  // The Following are Helper functions, not Middle Ware.
  //
  /////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////
  
  
  
  function pickAttachments_(attachments) {
    
    var totalSize = attachments
    .map(function(a) { return a.getSize() })
    .reduce(function(s1,s2) { return s1 + s2 }, 0)
    
    // URL Fetch POST size 10MB / call - https://developers.google.com/apps-script/guides/services/quotas?hl=en
    var MAX_SIZE = 10 * 1024 * 1024
    
    if (totalSize < MAX_SIZE) {
      return attachments
    }
    
    // get a ppt/pdf is enough
    var RE = /(\.ppt|\.pptx|\.pdf)/i
    
    for (var i = 0; i < attachments.length; i++) {
      
      Logger.log(attachments.length)
      if (RE.test(attachments[i].getName()) 
          && attachments[i].getSize() < MAX_SIZE) {
        return [attachments[i]]
      }
      
    }
    
    return []
    
  }


}())
