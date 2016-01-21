var Mailer = (function () {
  'use strict'
  
  var VERSION = '0.1.0'
  
  var Mailer = function () {
  }
  
  Mailer.trashBizplan = trashBizplan
  Mailer.skipFromMyContacts = skipFromMyContacts
  Mailer.forwardBizplan = forwardBizplan

  
  /**
  *
  * Labels
  *
  */
  Mailer.labelAdd_BizPlan = labelAdd_BizPlan
  
  Mailer.labelAdd_NotBizPlan = labelAdd_NotBizPlan
  Mailer.labelDel_NotBizPlan = labelDel_NotBizPlan
  
  Mailer.labelAdd_Mike = labelAdd_Mike
  Mailer.labelDel_Mike = labelDel_Mike
  
  Mailer.labelAdd_Bug = labelAdd_Bug
  Mailer.labelDel_Bug = labelDel_Bug
  
  Mailer.labelAdd_ToBeDeleted = labelAdd_ToBeDeleted
  Mailer.replySubmitGuideIfMailToBpAddress = replySubmitGuideIfMailToBpAddress
  
  
  /**
  *
  * Archive
  *
  */
  Mailer.moveToArchive = function (req, res, next) { req.getThread().moveToArchive(); next() }
  Mailer.trashMessage = function (req, res, next) { req.getMessage().moveToTrash(); next() }
  Mailer.markRead = function (req, res, next) { req.getThread().markRead(); next() }
  
  
  return Mailer
  
  
  ////////////////////////////////////////////////////////////////////////////////
  
  function labelAdd_BizPlan(req, res, next) { req.getThread().addLabel(GmailApp.getUserLabelByName('BizPlan')); next() }
  
  function labelAdd_NotBizPlan(req, res, next) { req.getThread().addLabel(GmailApp.getUserLabelByName('NotBizPlan')); next() }
  function labelDel_NotBizPlan(req, res, next) { req.getThread().removeLabel(GmailApp.getUserLabelByName('NotBizPlan')); next() }

  function labelAdd_Mike(req, res, next) { req.getThread().addLabel(GmailApp.getUserLabelByName('Mike/MikeBo')); next() }
  function labelDel_Mike(req, res, next) { req.getThread().removeLabel(GmailApp.getUserLabelByName('Mike/MikeBo')); next() }
 
  function labelAdd_Bug(req, res, next) { req.getThread().addLabel(GmailApp.getUserLabelByName('Mike/BugBo')); next() }
  function labelDel_Bug(req, res, next) { req.getThread().removeLabel(GmailApp.getUserLabelByName('Mike/BugBo')); next() }

  function labelAdd_ToBeDeleted(req, res, next) { req.getThread().addLabel(GmailApp.getUserLabelByName('ToBeDeleted')); next() }

  /**
  * 2. trash it.
  * do not keep bp in gmail
  * use a for loop is because: sometimes entrepreneur send their email more than one times.
  */
  function trashBizplan(req, res, next) {
    var messages = req.getThread().getMessages()
    var report = 'trashed message: '
    for (var i=0; i<messages.length; i++) {
      if (messages[i].getFrom() != messages[0].getFrom()) break
      // then the following message(i) is as the same sender as the first one
      messages[i].moveToTrash()
      report += i + ', '
    }
    req.errors.push(report)
    next()
  }

  /**
  *
  * 3. Do not touch mail from people I known
  *
  */
  function skipFromMyContacts(req, res, next) {
    if (!res.gasContact) throw Error('res.gasContact not found!')
    
    var firstMessage = req.getThread().getMessages()[0]
    
    var from = firstMessage.getReplyTo() || firstMessage.getFrom()
    
    if (res.gasContact.isMyContact(from)) {
      req.errors.push('skipped my contact:' + from)
      return log(log.DEBUG, req.getChannelName() + ': skipped my contact' + from)
    } 
    return next()
  }
  
  function replySubmitGuideIfMailToBpAddress(req, res, next) {
    
    var messages = req.getThread().getMessages() 
    
    var froms = messages
    .map(function (m) { return m.getFrom() })
    .join(',')
    
    var message = messages[0]
    var to = message.getTo()   
    
    var RE = /bp@pre/i
    if (RE.test(to)) { // 1. 是发给  bp@pre... 的
      if (!RE.test(froms)) { // 2. 没有用 bp@pre... 邮件地址作为发件人回复过。（如果  replySubmitGuide 过，就会有这样的发件人。代表不重复回复）
          replySubmitGuide(message)
      }
    }
    
    next()
  }
  
  /*********************************************
  *
  *
  *
  */
  function forwardBizplan(req, res, next) {
    
    var messages = req.getThread().getMessages()
    
    /**
    *
    * 3. Forward BizPlan email to zixia-bp@googlegroups.com (if not do it before)
    *
    * 1. bp send to 'bp@...'had alread been sent to zixia-bp@googlegroups.com, by gmail filter
    * 2. bp not sent to 'bp@xxx' should be forward here.
    *
    */
    if (!/bp@/.test(messages[0].getTo() + ',' + messages[0].getCc())) {
      try {
        var forwardMessage = forwardToZixiaBpGroup(messages[0])
        if (forwardMessage) {
          log(log.DEBUG, 'forwarded')
          forwardMessage.moveToTrash()
        }
      } catch (e) {
        req.errors.push('forwardMessage: ' + e.name + ', ' + e.message)
      }
    }
    
    next()
  }

  
  
  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  //
  // The Following are Helper Functions, not Middle Ware
  //
  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  
  
  
  /**************************************************************************
  *
  * Helper 2 - Reply BP
  *
  */
  function replySubmitGuide(message) {
    
    //  log(log.INFO, 'reply submit guide')
    
    var from = message.getFrom()
    var name = GasContact.getEmailName(from)
    
    var t = HtmlService.createTemplateFromFile('AutoReply')
    t.name = name
    var htmlReply = t.evaluate().getContent()
    
    //  var plainBody = plainForwardBody + message.getPlainBody()
    var htmlBody = htmlReply + '<blockquote>' + message.getBody() + '</blockquote>'
    
    message.reply(null, {
      //    from: 'support@zixia.freshdesk.com'
      from: 'bp@pre-angel.com'
      , name: '李卓桓(PreAngel)'
      , htmlBody: htmlBody
    })
    
  }  


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
      log(log.INFO, 'attachment size: %s, > 8MB(%s), skip forward.', totalSize, eightMegaByte)
      return null
    }
    
    var ZIXIABPGROUP = 'zixia-bp@googlegroups.com'
    
    message.forward(ZIXIABPGROUP, {
      from: 'zixia@zixia.net'
    })
    
    var fwdMessage
    
    var ttl = 7
    while (ttl-- > 0) {
      
      var threadId = message.getThread().getId()
      
      // GmailApp.refreshThread(thread) not work???
      // must use GmailApp getThread, for force reload
      var thread = GmailApp.getThreadById(threadId)
      
      log(log.NOTICE, 'forward ttl:%s, message num:%s', ttl, thread.getMessages().length)
      
      var messages = thread.getMessages().filter(function(m) {
//        log(log.NOTICE, 'isInTrash:%s, from:%s, to:%s', m.isInTrash(), m.getFrom(), m.getTo())
//        log(log.NOTICE, '!isInTrash:%s, from:%s, to:%s', !m.isInTrash(), 'zixia@zixia.net' == m.getFrom(), ZIXIABPGROUP == m.getTo())
        
        var isFwd = !m.isInTrash() && 'zixia@zixia.net' == m.getFrom() && ZIXIABPGROUP == m.getTo()
//        log(log.NOTICE, 'isFwd: %s', isFwd)
        
        return isFwd
//        ( 
//          !m.isInTrash() 
//          && 'zixia@zixia.net' == m.getFrom() 
//        && ZIXIABPGROUP == m.getTo()
//        )
      })
      
//      log(log.NOTICE, 'filtered messages.length: %s', messages.length)
      
      if (messages.length > 0) {
        fwdMessage = messages[0]
        break
      }
      Utilities.sleep(1000)
    }
    
    if (ttl <= 0) {
      throw Error('forwarded email ttl timeout.')
    }
    
    return fwdMessage
  }

}())
