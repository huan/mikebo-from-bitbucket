var Ticketor = (function () {
  'use strict'
  
  var VERSION = '0.1.0'

  /**
  *
  * 3. Freshdesk API
  *
  */
  if ((typeof GasFreshdesk)==='undefined') { // GasFreshdesk Initialization. (only if not initialized yet.)
    var TTL = 3
    var CODE = undefined
    while (!CODE && TTL-->0) {
      try {
        CODE = UrlFetchApp.fetch('https://raw.githubusercontent.com/zixia/gas-freshdesk/master/src/gas-freshdesk-lib.js').getContentText()
      } catch (e) {
        log(log.ERR, 'UrlFetchApp.fetch exception(ttl:%s): %s', TTL, e.message)
        Utilities.sleep(1000)
      }
    }
    if (CODE) {
      eval(CODE)
    } 
  } // Class Freshdesk is ready for use now!
  
  var FRESHDESK_URL = PropertiesService.getScriptProperties().getProperty('FreshdeskDomainUrl')
  var FRESHDESK_KEY = PropertiesService.getScriptProperties().getProperty('FreshdeskApiKey')
  
  var MyFreshdesk = new GasFreshdesk(FRESHDESK_URL, FRESHDESK_KEY)
  var Ticket = MyFreshdesk.Ticket
  var Contact = MyFreshdesk.Contact
  var Agent = MyFreshdesk.Agent

  // hardcoded for cache
  var ID_AGENT_MARY = 5008844005
  var ID_AGENT_ZIXIA = 5006515033

//  var ID_AGENT_ZIXIA = Agent.list({ email: 'zixia@zixia.net' })[0].getId()
//  var ID_AGENT_MARY  = Agent.list({ email: 'mary@aka.cn'     })[0].getId()

  var Ticketor = function () {
  }
  
  Ticketor.create  = create
  Ticketor.process = process
  Ticketor.close   = function (req, res, next) { req.ticket.close(); next() }
  
  Ticketor.tryToPair = tryToPair
  Ticketor.noteOrCreate = noteOrCreate
  Ticketor.replyOrCreate = replyOrCreate
  
  Ticketor.mediumPriority = function (req, res, next) { req.ticket.mediumPriority(); next() }
  Ticketor.highPriority = function (req, res, next) { req.ticket.highPriority(); next() }
  
  Ticketor.assignMary = function (req, res, next) { req.ticket.assign(ID_AGENT_MARY); next() }
  
  Ticketor.noteIbot = noteIbot
  
  return Ticketor
  
  /////////////////////////////////////////////////////////// 
  
  function noteIbot(req, res, next) {
    var ticket = req.ticket
    var ibot = req.ibot
    
    if (ticket && ibot) { 
      ticket.note({
        body_html: JSON.stringify(ibot)
        , private: true
      })
      req.pushError('ibot reported to ticket#' + ticket.getId())
    }
    
    return next()
  }

  
  function tryToPair(req, res, next) {
//    var email = (req.table && req.table.email) || req.getMessage().getReplyTo() || req.getMessage().getFrom()
    var email = req.bizplan.getFromEmail()
    
//    email = GasContact.getEmailAddress(email)
        
    if (email) var contacts = Contact.list({ email: email })
    
//    log(log.DEBUG, 'pairing contacts for %s', email)

    if (contacts && contacts.length) {
      var contactId = contacts[0].getId()
      if (contactId) var tickets = Ticket.list({ requester_id: contactId })
      if (tickets && tickets.length) req.ticket = tickets[0]
//      log(log.DEBUG, 'tickets: %s', tickets)
    }
    
    var ticketId = req.ticket ? req.ticket.getId() : '?'
    
    return next('paired ticket#' + ticketId )
  }
  
  /**
  *
  *
  *
  */ 
  function noteOrCreate(req, res, next) {
//    var tableHtml = req.tableHtml
//    var table = req.table
    
    var ticket  = req.ticket
    var bizplan = req.bizplan

    var description = bizplan.getDescription()

    // 1. existing ticket
    if (ticket) { 
      ticket.open()
      ticket.note({
        body_html: description
        , private: true
      })
      return next('added note to ticket#' + ticket.getId())
    } 
    
    // 2. new ticket    
    ticket = new Ticket({
      description_html: description
//      , subject: table.company || table.name || '未填写'
//      , name: table.name
//      , email: table.email
      , subject: bizplan.getSubject()
      , name: bizplan.getFromName()
      , email: bizplan.getFromEmail()
      
      , attachments: bizplan.getAttachments()
    })
    
    req.ticket = ticket
    
    return next('created note as ticket#' + ticket.getId())
  }

  /**
  *
  *
  *
  */ 
  function replyOrCreate(req, res, next) {
//    var tableHtml = req.tableHtml
//    var table = req.table
        
    var ticket  = req.ticket
    var bizplan = req.bizplan
    
    // 1. existing ticket
    if (ticket) { 
      ticket.open()
      ticket.reply({
        body_html: bizplan.getDescription()
        // already replied, no cc needed anymore:
        // , cc_emails: [ table.email ]
      })
      
      return next('replied ticket#' + ticket.getId())
    }
    
    // 2. create new ticket
    ticket = new Ticket({
      description_html: bizplan.getDescription()
//      , subject: table.company
//      , name: table.name
//      , email: table.email
      , subject: bizplan.getCompany()
      , name: bizplan.getFromName()
      , email: bizplan.getFromEmail()
    })
    req.ticket = ticket
    
    return next('created reply as ticket#' + ticket.getId())
  }

  function process(req, res, next) {
    
    var analyze = req.analyze
    var ticket = req.ticket
//    var bizplan = req.bizplan

    var shouldClose = false
    var noteMsg = ''
    
    if (analyze) {
      
      if(analyze.zixia) { // is to zixia, known it from formChannel
        if (!analyze.beijing) {
          noteMsg = '非北京'
          //        ticket.close()
        } else if (analyze.game) {
          noteMsg = '游戏'
          //        ticket.close()      
        } else if (analyze.offline) {
          noteMsg =  '电商/O2On'
          //        ticket.close()
        } else {
          noteMsg = '内容分析结果未知'
        }
        
        noteMsg += '，是投递给zixia的'
        ticket.mediumPriority()
        ticket.assign(ID_AGENT_MARY)
        
      } else {
        noteMsg = '不碰指定发给他人的BP' 
        shouldClose = true
        if (req.startup && req.startup.deliverTo) {
          noteMsg = noteMsg.concat('(', req.startup.deliverTo, ')')
        }
      }
      
    } else { // no analyze
      noteMsg = '未能进行分析'
      ticket.lowPriority()
      ticket.assign(ID_AGENT_MARY)
    }      
    
    ticket.note({
      body: noteMsg
      , private: true
    })

    if (shouldClose) ticket.close()
    
    return next(noteMsg)
  }
  

  /*********************************************
  *
  * create freshdesk ticket!
  *
  */
  function create(req, res, next) {
//    log(log.DEBUG, 'entered Ticketor.create')

    var bizplan = req.bizplan
    
    /**
    *
    * log all recipients in the email body
    *
    */
//    htmlTo = bizplan.to
    htmlTo = bizplan.getTo()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    
    htmlTo = '<p>To: ' + htmlTo + '</p><br />'
    
//    bizplan.description = htmlTo + bizplan.description
    var description = htmlTo + bizplan.getDescription()
    
    /**
    *
    * deal with some email with hundreds of CCs... 
    *
    */
//    var recipients = bizplan.getTo().split(/\s*,\s*/)
//    
//    if (recipients.length > 3) {   
//      // need not CC to them
//      bizplan.to = ''  
//      req.pushError('Too many(' + recipients.length + ') recipients. will not cc anybody.')
//    }
    
    /**
    *
    * make payload for api
    *
    */
    var ticketObj = {
      description_html: description
      , subject: bizplan.getSubject()
      , name: GasContact.getEmailName(bizplan.getFrom())
      , email: GasContact.getEmailAddress(bizplan.getFrom())
//      , name: bizplan.getFounderName())
//      , email: bizplan.getFounderEmail())
//      , cc_emails: bizplan.to
    }

    var attachments = bizplan.getAttachments()
    
    if (attachments.length) ticketObj.attachments = attachments

//    if (bizplan.attachments && bizplan.attachments instanceof Array && bizplan.attachments.length) {
      
//      bizplan.attachments.forEach(function (attachment) {
//        ticketObj.attachments.push(attachment)
//      })  
//    }
    // XXX
//log(log.NOTICE, 'before new Ticket')    
//ticketObj.description_html = 'test'
//ticketObj.attachments = [ Utilities.newBlob('DATA').setName('test.dat') ]
//log(ticketObj.attachments[0].getName())
//log(JSON.stringify(ticketObj))
    req.ticket = new Ticket(ticketObj)
//log(log.NOTICE, 'after new Ticket')    
    
    return next('created ticket #' + req.ticket.getId())
  }
  
    
  /////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////
  //
  // The Following are Helper functions, not Middle Ware.
  //
  /////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////


  

}())
