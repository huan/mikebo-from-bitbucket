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

  log(LOG_DEBUG, 'bp2Ticket start.')
  
  /**
  *
  * for DEBUG:
  *
  */
  var DEBUG_SEARCH_PATTERN=false
//  DEBUG_SEARCH_PATTERN='“船来船网”细分行业B2B项目计划书'

  if (DEBUG && DEBUG_SEARCH_PATTERN) {
    log(LOG_DEBUG, 'DEBUG_SEARCH_PATTERN: ' + DEBUG_SEARCH_PATTERN)
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
    + '融资申请'

  }
  
  
  /**
  *
  * Loop BizPlan search patterns
  *
  */
  var total = 0
  var numBp = 0
  
  for (var name in NEW_BP_PATTERNS) {
    log(LOG_DEBUG, 'process %s ->[ %s ]', name, NEW_BP_PATTERNS[name])
    var [m, n] = processBpThreads(NEW_BP_PATTERNS[name])
    
    total += Math.floor(m)
    numBp += Math.floor(n)

    if (n) {
      log(LOG_DEBUG, 'bp2Ticket %s processed %s/%s mail(s, bp/total)', name, n, m)
    }
  }

  var logLevel = LOG_DEBUG
//  if (total > 0) logLevel = LOG_INFO
  
  log(logLevel, 'bp2Ticket processed %s/%s mail(s, bp/total)', numBp, total)
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
    log(LOG_DEBUG, 'No matched mail by search')
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
    
    log(LOG_INFO, "BP2Ticket %s: %s from %s to %s because %s."
        , isNotBp ? 'NotBP' : 'BP' 
        , messages[0].getSubject().substring(0,30)
        , messages[0].getReplyTo() || messages[0].getFrom()
        , messages[0].getTo()
        , isNotBp ? isNotBp : 'I think so'
       )
    
    if (isNotBp) {
      thread.addLabel(labelNotBp)
      thread.removeLabel(labelBugBo)
      continue
    }
  
    thread.addLabel(labelBp)
    numBp++
        
    try {
      // 1. submit to freshdesk
      addToTicket(thread)
      
      
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
          log(LOG_INFO, 'forwarded')
          forwardMessage.moveToTrash()
        }
      }

      thread.removeLabel(labelBugBo)
    } catch (e) {
      log(LOG_ERR, 'addToTicket Error:' + e)
    }       
           
  }
  
  log(LOG_DEBUG, 'processed %s BizPlan(s).', numBp)
  
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
    log(LOG_INFO, 'attachment size: %s, > 8MB(%s), skipped.', totalSize, eightMegaByte)
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
    
    log(LOG_DEBUG, 'forward ttl:%s, message num:%s', ttl, thread.getMessages().length)
    
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
    
    log(LOG_INFO, 'attachments dropped. original %s attachments.', Math.floor(attachments.length))
  }

  return createFreshdeskTicket(from, to + ',' + cc, subject, description, pickedAttachments)
 
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
    
//    log(LOG_INFO, messages[i].getFrom())
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
function createFreshdeskTicket(from, to, subject, description, attachments) {
  
  var API_KEY = PropertiesService.getScriptProperties().getProperty('FreshDeskApiKey')
  if (!API_KEY) throw new Error('FreshDeskApiKey not found in script properties.')
  
  var ENDPOINT = Utilities.formatString('https://%s.freshdesk.com', 'zixia')

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
    log(LOG_ALERT, 'Too many(%s) recipients. will not cc anybody.', recipients.length)
  }
  
  /**
  *
  * make payload for api
  *
  */
  var payload = [
    ['helpdesk_ticket[description_html]', description]
    , ['helpdesk_ticket[subject]', subject]
    , ['helpdesk_ticket[email]', from]
    , ['cc_emails', to]
  ]

  for (var i=0; i<attachments.length; i++) {
    payload.push(
      [
        'helpdesk_ticket[attachments][][resource]'
        , attachments[i]
      ]
    )
  }
  
  var boundary = '-----CUTHEREelH7faHNSXWNi72OTh08zH29D28Zhr3Rif3oupOaDrj'
  
  payload = makeMultipartBody(payload, boundary)

  var headers = {
    'Authorization': 'Basic ' + Utilities.base64Encode(API_KEY + ':X')
  }

  var options = {
    contentType: "multipart/form-data; boundary=" + boundary
    , headers: headers
    , payload: payload
    , method: 'post'
    , muteHttpExceptions: true
  }
  
  /**
  *
  * submit to freshdesk API
  *
  */
  var url = ENDPOINT + '/helpdesk/tickets.json'
//  url = 'http://aka.cn:3333'
  
  var response = UrlFetchApp.fetch(url, options)
  
  if (response.getResponseCode() != 200) {
    throw new Error(
      Utilities.formatString('UrlFetchApp: Freshdesk API failed! code: %s, content: %s'
                             , response.getResponseCode()
                             , response.getContentText()
                            )
    )
  }
}


/**
*
* helper function
*
*/
function makeMultipartBody(payload, boundary) {
  
  var body = Utilities.newBlob('').getBytes()
  
  for (var i in payload) {
    var [k, v] = payload[i]
    
    if (v.toString() == 'Blob'
       || v.toString() == 'GmailAttachment' 
    ) {
      
      // attachment
      body = body.concat(
        Utilities.newBlob(
          '--' + boundary + '\r\n'
          + 'Content-Disposition: form-data; name="' + k + '"; filename="' + v.getName() + '"\r\n'
        + 'Content-Type: ' + v.getContentType() + '\r\n\r\n'
      ).getBytes())
      
      body = body
      .concat(v.getBytes())
      .concat(Utilities.newBlob('\r\n').getBytes())
      
    } else {
      
      // string
      body = body.concat(
        Utilities.newBlob(
          '--'+boundary+'\r\n'
          + 'Content-Disposition: form-data; name="' + k + '"\r\n\r\n'
          + v + '\r\n'
        ).getBytes()
      )
      
    }
  
  }
  
  body = body.concat(Utilities.newBlob('--' + boundary + "--\r\n").getBytes())
  
  return body
 
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

