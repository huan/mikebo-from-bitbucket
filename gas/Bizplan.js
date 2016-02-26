var Bizplan = (function () {
  'use strict'
  
  var VERSION = '0.1.0'

  var STATIC_METHODS = {
    pickAttachments: pickAttachments
  }
  
  var Bizplan = function (message) {
    
    if (typeof this == 'undefined' || Object.keys(this).length) { // called instead of 'newed'
      throw Error('must use "new" keyword to Bizplan')
    }
    
    var BP = {
      subject: ''
      , description: ''
      
      , industry: ''
      , location: ''
      
      , pre_valuation: 0
      , funding: 0

      , founder: {
        name: ''
        , email: ''
        , mobile: ''
        , title: ''
        , percentage: 0
      }
      
      , attachments: []
      
      //////////////////////
      
      , to: ''        // founder want to deliver this bizplan to who
      , cc: ''
      , channel: ''   // where this bizplan from (from marketing view)
    }
          
        
    var INSTANCE_METHODS = {
        setSubject: setSubject
      , getSubject: getSubject
      
      , setDescription: setDescription
      , getDescription: getDescription
      
      , setIndustry: setIndustry
      , getIndustry: getIndustry
      
      , setLocation: setLocation
      , getLocation: getLocation
      
      , setPreValuation: setPreValuation
      , getPreValuation: getPreValuation
      
      , setFunding: setFunding
      , getFunding: getFunding

      , setFounderName: setFounderName
      , getFounderName: getFounderName
      , setFounderEmail: setFounderEmail
      , getFounderEmail: getFounderEmail

      , getAttachments: getAttachments
      , setAttachments: setAttachments
      
      , setTo: setTo
      , getTo: getTo
      
      , setCc: setCc
      , getCc: getCc

      , setChannel: setChannel
      , getChannel: getChannel
    }
    
    var from = message.getReplyTo() || message.getFrom()
    
    var name = GasContact.getEmailName(from)
    var email = GasContact.getEmailAddress(from)    
    
    setSubject    (message.getSubject())
    setDescription(message.getBody())
    
    setAttachments( 
      pickAttachments( 
        message.getAttachments()
      ) 
    )
    
    setFounderName (name)
    setFounderEmail(email)
    
    
    /////////////////////////////////////////
    // export static method on Instance
    Object.keys(STATIC_METHODS)  .forEach(function (k) { this[k] = STATIC_METHODS[k]   }, this)
    // export instance methods on Instance
    Object.keys(INSTANCE_METHODS).forEach(function (k) { this[k] = INSTANCE_METHODS[k] }, this)
    /////////////////////////////////////////
    
    return this
    
    ////////////////////////////////////////////////////
    // 
    // Instance methods
    //
    function setSubject(s) { BP.subject = s }
    function getSubject()  { return BP.subject }
      
    function setDescription(s) { BP.description = s }
    function getDescription()  { return BP.description }
      
    function setIndustry(s) { BP.industry = s }
    function getIndustry()  { return BP.industry }
      
    function setLocation(s) { BP.location = s }
    function getLocation()  { return BP.location }
      
    function setPreValuation(n) { BP.pre_valuation = n }
    function getPreValuation()  { return BP.pre_valuation }
      
    function setFunding(n) { BP.funding = n }
    function getFunding()  { return BP.funding }

    function setFounderName(s) { BP.founder.name = s }
    function getFounderName()  { return BP.founder.name }
    function setFounderEmail(s) { BP.founder.email = s }
    function getFounderEmail()  { return BP.founder.email }

    function setAttachments(a) { BP.attachments = a }
    function getAttachments()  { return BP.attachments }
    
    function setTo(s) { BP.to = s }
    function getTo()  { return BP.to }

    function setCc(s) { BP.cc = s }
    function getCc()  { return BP.cc }

    function setChannel(s) { BP.channel = s }
    function getChannel()  { return BP.channel }
    
  }
  
  // export static methods on Class
  Object.keys(STATIC_METHODS).forEach(function (k) { Bizplan[k] = STATIC_METHODS[k] })

  return Bizplan
  
  ////////////////////////////////////////////////////////////////////////////////
  //
  // Static methods
  //
  
  function pickAttachments(attachments) {
    var totalSize = attachments
    .map(function(a) { return a.getSize() })
    .reduce(function(s1,s2) { return s1 + s2 }, 0)
    
    // URL Fetch POST size 10MB / call - https://developers.google.com/apps-script/guides/services/quotas?hl=en
    var MAX_SIZE = 10 * 1024 * 1024

    /**
    *
    * 1. return all the attachments if not exceed size limit
    *
    */
    if (totalSize < MAX_SIZE) return attachments
    
    /**
    *
    * 2. try to find out which attachment is more important    
    *
    */
   
    var importantAttachments = []   
    var RE = /(\.ppt|\.pptx|\.pdf)/i // get a ppt/pdf is enough
    
//    Logger.log('attachment num:' + attachments.length)
//    Logger.log('importantAttachment num:' + importantAttachments.length)

    /**
    *
    * How to deleting array items in javascript with forEach() and splice()
    *  - https://gist.github.com/chad3814/2924672
    *
    */
    var skipMarks = []
    
    // loop to check out bp format attachments first
    attachments.forEach(function (att, idx, obj) {
      var importantAttachmentsSize = importantAttachments
      .map   (function (a) { return a.getSize() })
      .reduce(function (s1, s2) { return s1 + s2 }, 0)
      
//      Logger.log('checking ' + att.getName())
      
      // 2.1 not bp format
      if (!RE.test(att.getName())) return
      // 2.2 exceed max size
      if ((importantAttachmentsSize + att.getSize()) > MAX_SIZE) return
      
      // 2.3 this attachment is "important", and move it to import list.
      importantAttachments.push(att)
      skipMarks[idx] = true
      
//      Logger.log('picked ' + att.getName())
    })
    
//    Logger.log('attachment num:' + attachments.length)
//    Logger.log('importantAttachment num:' + importantAttachments.length)
    
    /**
    *
    * 3 2nd loop to check if not exceed max size, add more "not-important" attachments.
    *
    */    
    attachments.forEach(function (att, idx, obj) {
      if (skipMarks[idx]) return
    
      var importantAttachmentsSize = importantAttachments
      .map   (function (a) { return a.getSize() })
      .reduce(function (s1, s2) { return s1 + s2 }, 0)
      
//      Logger.log('checking ' + att.getName())

      if ((importantAttachmentsSize + att.getSize()) > MAX_SIZE) return
      
      // 3.1 there is some room for this attachment
      importantAttachments.push(att)
      
//      Logger.log('picked ' + att.getName())
    })

//    Logger.log('attachment num:' + attachments.length)
//    Logger.log('importantAttachment num:' + importantAttachments.length)
    
    /**
    *
    * 4. finished
    *
    */
    return importantAttachments
  } 
  
}())

function testBizplan() {
}