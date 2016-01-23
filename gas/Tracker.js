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
    req.errors = []
    log(log.DEBUG, '%s start processing %s'
        , req.getChannelName ? req.getChannelName() : 'unknown'
        , req.getThread      ? req.getThread().getFirstMessageSubject() : 'unknown'
       )
    return next()
  }
  
  function logOnEnd(req, res, next) {
    var errorMsg = ''
    
    if (req.errors.length) {
      errorMsg = req.errors.map(function (e) { 
        if (e instanceof Error) {
          return e.name + ':' + e.message + ':' + e.stack
        } else {
          return e || ''
        }
      }).join(',')
    }
    
    log(log.NOTICE, 'C(%s/%ss)[%s] %s'
        , req.getChannelName ? req.getChannelName() : 'unknown'
        , Math.floor((new Date() - req.startTime)/1000)
        
        , req.getMessage ? req.getMessage().getSubject() : 'unknown'
        , errorMsg
       )
    return next()
  }
  
}())
