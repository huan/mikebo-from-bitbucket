/**
*
* Classify BP mail by MikeBO - zixia 20151025
* This is a Google Apps Script
*
* Author: Zhuohuan LI <zixia@zixia.net>
* https://zixia.freshdesk.com/support/home
*
*
*/
'use strict'

var LABEL_BP = 'BizPlan'
var LABEL_NOT_BP = 'NotBP'
var LABEL_MIKEBO = 'Mike/MikeBo'
var LABEL_BUGBO = 'Mike/BugBo'

/**
*
* for DEBUG: 
* 1. log or not
*
*/
var DEBUG=true

/**************************************************************************
*
* Main
*
*/ 
function bp2Ticket() {

  log(log.DEBUG, 'bp2Ticket start.')
  
  /**
  *
  * for DEBUG:
  *
  */
  var DEBUG_SEARCH_PATTERN=false
//  DEBUG_SEARCH_PATTERN='融资申请 259 游学者'

  if (DEBUG && DEBUG_SEARCH_PATTERN) {
    log(log.DEBUG, 'DEBUG_SEARCH_PATTERN: ' + DEBUG_SEARCH_PATTERN)
    processBpThreads('label:inbox ' + DEBUG_SEARCH_PATTERN)
    return
  }

  var COMMON_BP_QUERY = ' newer_than:1d NOT in:trash ' // 最新1天内，被删了的不算
  + ' AND (label:inbox NOT label:' + LABEL_BP + ' NOT label:' + LABEL_NOT_BP + ') '
  + ' NOT (label:' + LABEL_BUGBO + ')'
    
  var NEW_BP_PATTERNS = {
    
    to_zixia_preangel_only: COMMON_BP_QUERY
    + ' '
    + ' AND (to:(zixia@pre-angel.com OR zixia@preangelpartners.com) NOT to:(bp@pre-angel.com OR bp@preangelpartners.com)) '
    + ' '
    + ' AND ("邮箱发来的超大附件" OR "邮箱发来的云附件" OR (filename:pptx OR filename:ppt OR filename:pdf)) '

    , to_zixia_and_bp_both: COMMON_BP_QUERY
    + ' '
    + 'to:(zixia@pre-angel.com OR zixia@preangelpartners.com)'
    + ' '
    + 'AND (bp@pre-angel.com OR bp@preangelpartners.com)'
    
    , to_bp_preangel_only: COMMON_BP_QUERY
    + ' '
    + ' AND (to:(bp@pre-angel.com OR bp@preangelpartners.com) NOT to:zixia) '
    + ' '
    + ' AND (abu OR 阿布 OR bruce OR zixia OR lizh OR lizhuohuan OR zhuohuan OR 卓桓 OR 李兄 OR 李卓桓 OR 卓恒 OR 李卓恒 OR 李总 OR 李老师 OR 李先生) '
    + ' '
    + ' AND ("邮箱发来的超大附件" OR "邮箱发来的云附件" OR (filename:pptx OR filename:ppt OR filename:pdf OR filename:doc)) '
    
    , to_wufoo: COMMON_BP_QUERY
    + ' '
    + 'PreAngel天使基金-项目计划书提交'

    , to_jsform: COMMON_BP_QUERY
    + ' '
    + '一句最能打动你的名言'
    + ' '
    + '融资申请 NOT from:service@m.jsform.com'

  }
  
  
  /**
  *
  * Loop BizPlan search patterns
  *
  */
  var total = 0
  var numBp = 0
  
  for (var name in NEW_BP_PATTERNS) {
    log(log.DEBUG, 'process %s ->[ %s ]', name, NEW_BP_PATTERNS[name])
    var [m, n] = processBpThreads(NEW_BP_PATTERNS[name])
    
    total += Math.floor(m)
    numBp += Math.floor(n)

    if (n) {
      log(log.DEBUG, 'bp2Ticket %s processed %s/%s mail(s, bp/total)', name, n, m)
    }
  }

//  var logLevel = log.DEBUG
//  if (total > 0) logLevel = log.INFO
  
  log(log.DEBUG, 'bp2Ticket processed %s/%s mail(s, bp/total)', numBp, total)
}

/**
*
* Do search & process
*
*/
function processBpThreads(pattern) {
 
  // how many emails will be processed by run once.
  var NUM_PER_QUERY = 9

  if (!pattern) {
    throw new Error('no search pattern!')
  }

  // search for mails
  var threads = GmailApp.search(pattern, 0, NUM_PER_QUERY)
  
  if (threads.length <= 0) {
    log(log.DEBUG, 'No matched mail by search')
    return [0,0]
  }
  
  // get gmail labels
  var labelBp = GmailApp.getUserLabelByName(LABEL_BP)
  var labelNotBp = GmailApp.getUserLabelByName(LABEL_NOT_BP)
  var labelMikeBo = GmailApp.getUserLabelByName(LABEL_MIKEBO)
  var labelBugBo = GmailApp.getUserLabelByName(LABEL_BUGBO)
  
  var numBp = 0
  
  // find & process bp from mails
  for (var i=0; i<threads.length; i++) {
    var thread = threads[i]
    
    // All mails had processed by mike tag MikeBo label.
    thread.addLabel(labelMikeBo) 
    
    // Tag as bug first, remove after confirm success.
    thread.addLabel(labelBugBo) 
    
    var messages = thread.getMessages()
    
    var isNotBp = isNotNewBizPlan(messages)
    
    
    if (isNotBp) {
      thread.addLabel(labelNotBp)
      thread.removeLabel(labelBugBo)

      log(log.INFO, "BP2Ticket %s: %s from %s to %s because %s."
          , isNotBp ? 'NotBP' : 'BP' 
          , messages[0].getSubject().substring(0,30)
          , messages[0].getReplyTo() || messages[0].getFrom()
      , messages[0].getTo()
      , isNotBp ? isNotBp : 'I think so'
      )

      continue
    }
  
    thread.addLabel(labelBp)
    numBp++
        
    try {
      // 1. submit to freshdesk
      var ticket = addToTicket(thread)
      
      log(log.INFO, "BP2Ticket %s#%s: %s from %s to %s because %s."
          , isNotBp ? 'NotBP' : 'BP' 
          , ticket.getId()
          , messages[0].getSubject().substring(0,30)
          , messages[0].getReplyTo() || messages[0].getFrom()
      , messages[0].getTo()
      , isNotBp ? isNotBp : 'I think so'
      )

      /**
      * 2. trash it.
      * do not keep bp in gmail
      * use a for loop is because: sometimes entrepreneur send their email more than one times.
      */
      for (var i=0; i<messages.length; i++) {
        if (messages[i].getFrom() != messages[0].getFrom()) break
        // then the following message(i) is as the same sender as the first one
        messages[i].moveToTrash()
      }

      /**
      *
      * 3. Forward BizPlan email to zixia-bp@googlegroups.com (if not do it before)
      *
      * 1. bp send to 'bp@...'had alread been sent to zixia-bp@googlegroups.com, by gmail filter
      * 2. bp not sent to 'bp@xxx' should be forward here.
      *
      */
      if (!/bp@/.test(messages[0].getTo() + ',' + messages[0].getCc())) {
        forwardMessage = forwardToZixiaBpGroup(messages[0])
        if (forwardMessage) {
          log(log.INFO, 'forwarded')
          forwardMessage.moveToTrash()
        }
      }

      thread.removeLabel(labelBugBo)
    } catch (e) {
      log(log.ERR, 'addToTicket Error:' + e)
    }       
           
  }
  
  log(log.DEBUG, 'processed %s BizPlan(s).', numBp)
  
  return [threads.length, numBp]
}

/**
*
* forward
*
*/
function forwardToZixiaBpGroup(message) {
  /*
  * Get size(in bytes) of all attachments
  */
  var totalSize = 0
  var attachments = message.getAttachments()
  for (var i = 0; i < attachments.length; i++) {
      totalSize += message.getAttachments()[i].getSize()
  }
  var eightMegaByte = 8 * 1024 * 1024
    
  if (totalSize > eightMegaByte) {
    log(log.INFO, 'attachment size: %s, > 8MB(%s), skipped.', totalSize, eightMegaByte)
    return null
  }
  
  var ZIXIABPGROUP = 'zixia-bp@googlegroups.com'
  message.forward(ZIXIABPGROUP, {
    from: 'zixia@zixia.net'
  })
  
  var fwdMessage
  
  var ttl = 9
  while (ttl-- > 0) {
    var threadId = message.getThread().getId()
    
    // must use GmailApp getThread, for force reload
    var thread = GmailApp.getThreadById(threadId)
    
    log(log.DEBUG, 'forward ttl:%s, message num:%s', ttl, thread.getMessages().length)
    
    messages = thread.getMessages().filter(function(m) {
      return (!m.isInTrash() && 'zixia@zixia.net' == m.getFrom() && ZIXIABPGROUP == m.getTo())
    })
    
    if (messages.length > 0) {
      fwdMessage = messages[0]
      break
    }
    Utilities.sleep(1000)
  }
  
  if (ttl <= 0) {
    throw Error('ticket mail cant found.')
  }
  
  return fwdMessage
}

/**************************************************************************
*
*
* Process Ticket - send mail to freshdesk
*
*/ 
function addToTicket(thread) {
  
  // the first email from entrepreneur, normaly is BP
  var message = thread.getMessages()[0]

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
    
    log(log.INFO, 'attachments dropped. original %s attachments.', Math.floor(attachments.length))
  }

  return newTicket(from, to + ',' + cc, subject, description, pickedAttachments)
 
}


/**
*
* return 0 means it is.
* return string to tell the reason why it is NOT
*
*/
function isNotNewBizPlan(messages) {
  
  /**
  *
  * 1. Should has no trash message (fresh: had never been touched)
  * 2. Should has no other people reply (fresh: only sender self)
  *
  */
  var from = messages[0].getFrom()
  
  for (var i=0; i<messages.length; i++) {
    
//    log(log.INFO, messages[i].getFrom())
    // skip google group response, it means nothing
    if (/@google.com/.test(messages[i].getFrom()) ) continue
      
    if (messages[i].isInTrash()) return 'someone have touched this thread.'
      
    if (messages[i].getFrom() != from) return 'not all message sent from one sender.'
    
  }
  
  /**
  *
  * 3. Do not touch mail from people I known
  *
  */
  if ( isMyContact(from) ) {
    return 'isNewBizPlan: ' + from + ' isMyContact.'
  }
  
  // false means it IS bp (not NOT bp)
  return false
}

/**
*
* new freshdesk ticket!
*
*/
function newTicket(from, to, subject, description, attachments) {
  
  var API_KEY = PropertiesService.getScriptProperties().getProperty('FreshDeskApiKey')
  if (!API_KEY) throw new Error('FreshDeskApiKey not found in script properties.')
  
  var MyFreshdesk = new Freshdesk('https://zixia.freshdesk.com/', API_KEY)

  /**
  *
  * log all recipients in the email body
  *
  */
  htmlTo = to
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  
  var toInfo = '<p>To: ' + htmlTo + '</p><br />'
  
  description = toInfo + description

  /**
  *
  * deal with some email with hundreds of CCs... 
  *
  */
  var recipients = to.split(/\s*,\s*/)
  
  if (recipients.length > 3) {   
    // need not CC to them
    to = ''  
    log(log.ALERT, 'Too many(%s) recipients. will not cc anybody.', recipients.length)
  }
  
  /**
  *
  * make payload for api
  *
  */
  var ticketObj = {
    helpdesk_ticket: {
      description_html: description
      , subject: subject
      , email: from
    }
    , cc_emails: to
  }
  
  if (attachments.length) {
    ticketObj.helpdesk_ticket.attachments = attachments
  }
  
  return new MyFreshdesk.Ticket(ticketObj)
}


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
      
    if (RE.test(attachments[i].getName()) 
        && attachments[i].getSize() < MAX_SIZE) {
      return [attachments[i]]
    }
 
  }

  return []
  
}

