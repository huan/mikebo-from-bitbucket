var Tracker = (function () {
  'use strict'
  
  var VERSION = '0.1.0'
  
  var Tracker = function () {
  }
  
  Tracker.logOnEnd = logOnEnd
  Tracker.logOnStart = logOnStart
    
  return Tracker
  
  
  ///////////////////////////////////////////////////////////
  
  
  function logOnStart(req, res, next) {
    req.startTime = new Date()
    log(log.DEBUG, '%s start processing %s'
        , req.getChannelName ? req.getChannelName() : 'unknown'
        , req.getMessage     ? req.getMessage().getSubject() : 'unknown'
       )
    
    Mailer.labelAdd_Bug (req, res, next)
    Mailer.labelAdd_Mike(req, res, next)

    return next()
  }
  
  function logOnEnd(req, res, next) {
    var errorMsg = ''
    
    var noException = true
    
    var errors = req.getErrors()
    
    if (errors.length) {
      errorMsg = errors.map(function (e) { 
        if (e instanceof Error) {
          noException = false
          return e.name + ':' + e.message + ':' + e.stack
        } else {
          return e || ''
        }
      }).join(',')
    }
    
    if (noException) Mailer.labelDel_Bug(req, res, function() {})

    log(log.NOTICE, 'C(%s/%ss)[%s] %s'
        , req.getChannelName ? req.getChannelName() : 'unknown'
        , Math.floor((new Date() - req.startTime)/1000)
        
        , req.getMessage ? req.getMessage().getSubject() : 'unknown'
        , errorMsg
       )
    return next()
  }
  
}())
