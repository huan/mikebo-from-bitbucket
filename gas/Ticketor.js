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
  
  var ID_AGENT_MARY = 5008844005
  var ID_AGENT_ZIXIA = 5006515033

  var Ticketor = function () {
  }
  
  Ticketor.create = create
  Ticketor.process = process
  
  Ticketor.tryToPair = tryToPair
  Ticketor.noteOrCreate = noteOrCreate
  Ticketor.replyOrCreate = replyOrCreate
  
  return Ticketor
  
  /////////////////////////////////////////////////////////// 
  
  function tryToPair(req, res, next) {
    var email = req.table.email
    
    var contacts = Contact.list({ email: email })
    log(log.DEBUG, 'paired contacts[%s] for %s', contacts, email)

    if (contacts && contacts.length) {
      var contactId = contacts[0].getId()
      if (contactId) {
        var tickets = Ticket.list({ requester_id: contactId });
      }
      log(log.DEBUG, 'tickets: %s', tickets)
      
      if (tickets && tickets.length) {
        req.ticket = tickets[0]
      }
    }
    
    var ticketId = req.ticket ? req.ticket.getId() : '?'
    
    req.errors.push('paired ticket#' + ticketId )
    
    next()
  }
  
  /**
  *
  *
  *
  */ 
  function noteOrCreate(req, res, next) {
    var tableHtml = req.tableHtml
    var table = req.table
        
    var ticket = req.ticket
    
    if (ticket) { 
      ticket.note({
        body_html: tableHtml
        , private: true
      })
      ticket.open()
      req.errors.push('added note to ticket#' + ticket.getId())
      
    } else { // new ticket
      
      ticket = new Ticket({
        description_html: tableHtml
        , subject: table.company || '未填写'
        , name: table.name
        , email: table.email
      })
      req.ticket = ticket
      req.errors.push('created note as ticket#' + ticket.getId())
                    
    }
    
    next()
  }

  /**
  *
  *
  *
  */ 
  function replyOrCreate(req, res, next) {
    var tableHtml = req.tableHtml
    var table = req.table
        
    var ticket = req.ticket
    
    if (ticket) { 
      ticket.reply({
        body_html: tableHtml
        // already replied, no cc needed anymore:
        // , cc_emails: [ table.email ]
      })
      ticket.open()
      req.errors.push('replied ticket#' + ticket.getId())
      
    } else { // new ticket
      
      ticket = new Ticket({
        description_html: tableHtml
        , subject: table.company
        , name: table.name
        , email: table.email
      })
      req.ticket = ticket
      req.errors.push('created reply as ticket#' + ticket.getId())
                    
    }
    
    next()
  }

  function process(req, res, next) {
    
    var analyze = req.analyze
    var ticket = req.ticket
    var bizplan = req.bizplan

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
        if (req.bizplan && req.bizplan.deliverTo) {
          noteMsg.concat(': ', req.bizplan.deliverTo)
        }
        
        ticket.assign(ID_AGENT_ZIXIA)
        ticket.close()
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

    req.errors.push(noteMsg)
    
    next()
  }
  

  /*********************************************
  *
  * create freshdesk ticket!
  *
  */
  function create(req, res, next) {
    log(log.DEBUG, 'entered Ticketor.create')

    var bizplan = req.bizplan
    
    /**
    *
    * log all recipients in the email body
    *
    */
    htmlTo = bizplan.to
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    
    htmlTo = '<p>To: ' + htmlTo + '</p><br />'
    
    bizplan.description = htmlTo + bizplan.description
    
    /**
    *
    * deal with some email with hundreds of CCs... 
    *
    */
    var recipients = bizplan.to.split(/\s*,\s*/)
    
    if (recipients.length > 3) {   
      // need not CC to them
      bizplan.to = ''  
      req.errors.push('Too many(' + recipients.length + ') recipients. will not cc anybody.')
    }
    
    /**
    *
    * make payload for api
    *
    */
    var ticketObj = {
      description_html: bizplan.description
      , subject: bizplan.subject
      , name: GasContact.getEmailName(bizplan.from)
      , email: GasContact.getEmailAddress(bizplan.from)
//      , cc_emails: bizplan.to
    }

    if (bizplan.attachments && bizplan.attachments instanceof Array && bizplan.attachments.length) {
      
      ticketObj.attachments = []
      
      bizplan.attachments.forEach(function (attachment) {
        ticketObj.attachments.push(attachment)
      })  
    }
    // XXX
//log(log.NOTICE, 'before new Ticket')    
//ticketObj.description_html = 'test'
//ticketObj.attachments = [ Utilities.newBlob('DATA').setName('test.dat') ]
//log(ticketObj.attachments[0].getName())
//log(JSON.stringify(ticketObj))
    req.ticket = new Ticket(ticketObj)
//log(log.NOTICE, 'after new Ticket')    
    
    req.errors.push('created ticket #' + req.ticket.getId())
    next()
  }
  
  
  
  
  /////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////
  //
  // The Following are Helper functions, not Middle Ware.
  //
  /////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////


  

}())
