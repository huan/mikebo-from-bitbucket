var Bizplaner = (function () {
  'use strict'
  
  var VERSION = '0.1.0'
  
  var Bizplaner = function () {
  }
  
  Bizplaner.skipInvalidBizplan = skipInvalidBizplan
  Bizplaner.init = init
  Bizplaner.analyzeDetails = analyzeDetails

  Bizplaner.cinderella = cinderella
  
  return Bizplaner
  
  
  ///////////////////////////////////////////////////////////
  
  function cinderella(req, res, next) {
    var bizplan = req.bizplan
    
    req.cinderella = Cinderella.query({
      from: bizplan.getFromEmail()
      , to: bizplan.getTo()
      , subject: bizplan.getSubject()
      , body: bizplan.getBody()
      , attachment: bizplan.getAttachments()
    })
    
    return next('fake cinderella-ed')
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
    
    /**
    * Check all the messages in thread(also include trashed ones)
    */
    for (var i=0; i<messages.length; i++) {
      
      if (/@google.com/.test(messages[i].getFrom()) ) continue
      
      // 1. check trashed message
      // duplated check with step 2.
//      if (messages[i].isInTrash() && messages[i].getFrom() !== messages[0].getFrom()) {
//        isNotBizPlan = true
//        req.pushError('someone have touched this thread')
//      }
      
      // 2. check if other people had replied
      if (messages[i].getFrom() != from) return req.pushError('not all message sent from one sender')
    }
    
    if (!hasAttachment(req.bizplan)) return req.pushError('has no attachment')
    
    next()
  }
  
  
  function init(req, res, next) {
    // the current email from entrepreneur, normaly is BP
    var message = req.getMessage()

    req.bizplan = new Bizplan(message)
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
    if (/??????|beijing|?????????|??????/i.test(testStr)) isBeijing = true
    
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
    if (/??????/.test(str)) {
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
    if (/??????|O2O/i.test(str)) {
      isOffline = true
    }
    
    return isOffline
  }

  function isToZixia(bizplan) {    
    var zixiaCiphers = [
      'abu'
      , '??????'
      , 'bruce'
      , 'zixia'
      , 'lizh'
      , 'lizhuohuan'
      , 'zhuohuan'
      , '??????'
      , '??????'
      , '?????????'
      , '??????'
      , '?????????'
      , '??????'
      , '?????????'
      , '?????????'
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
      if (/?????????|?????????/.test(destination)) isToZixia = true
      else if (!/?????????/.test(destination)) isToZixia = false
    }
    
    return isToZixia
  }
  
  function hasAttachment(bizplan) {
    if (!bizplan)                        return false
    if (bizplan.getAttachments().length) return true
    
    var cloudWords = [
      '???????????????????????????'
      , '????????????????????????'
    ]
    
    var RE = new RegExp(cloudWords.join('|'), 'i')
    
    if (RE.test(bizplan.getBody())) return true
    
    
  }
  
}())
