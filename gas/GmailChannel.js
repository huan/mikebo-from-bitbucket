 
function cleanInbox() {
  'use strict'  
  
  if ((typeof log)==='undefined') eval ('var log = new GasLog()')

  if ((typeof GmailChannel)==='undefined') { // GmailChannel Initialization. (only if not initialized yet.)
    eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/zixia/gas-gmail-channel/master/src/gas-gmail-channel-lib.js?2').getContentText())
    GmailApp.getAliases() // Require permission
  } // Class GmailChannel is ready for use now!

  var FRESHDESK_URL = PropertiesService.getScriptProperties().getProperty('FreshdeskDomainUrl')
  var FRESHDESK_KEY = PropertiesService.getScriptProperties().getProperty('FreshdeskApiKey')
  var MyFreshdesk = new Freshdesk(FRESHDESK_URL, FRESHDESK_KEY)

  var gasContact = new GasContact()
  
  var ID_AGENT_MARY = '5008844005'
  var ID_AGENT_ZIXIA = '5006515033'
  
  // how many message(s) processed per call
  var LIMIT = 7
  // how many day(s) looks back by search 
  var DAYSPAN = 1

  
  doBpZixiaChannel()      // 1. 同时发给 zixia@pre 和  bp@pre 邮箱
  doBpWithCipherChannel() // 2. 只发到 bp@pre 邮箱的，但是有我的名字
  doZixiaChannel()        // 3. 只发到 zixia@pre 邮箱
  doFormChannel()         // 4. 通过表单提交

  doBulkChannel()         // 5. 群发邮件，并且不是发到我的邮箱的
  
  
  return 
  
  
  
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //
  // Main code above execute END here
  //
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
  *
  * 0. Clean bulk emails of inbox
  *
  */
  function doBulkChannel() {
    
    var bulkChannel = new GmailChannel ({
      name: 'bulkChannel'
      , keywords: []
      , labels: [
        'inbox'
        , 'unread'
        , '-' + 'ToBeDeleted'
        , '-' + 'trash'
      ]
      , dayspan: DAYSPAN
      , query: '-(zixia OR lizh OR lizhuohuan OR lzhuohuan OR zhuohuan OR 卓桓 OR 李兄 OR 李卓桓 OR 卓恒 OR 李卓恒 OR 李总 OR 李老师 OR 李先生 OR abu OR 阿布 OR bruce OR ceibsmobi.com OR akamobi.com)'
      + ' ' + '-is:important'
      + ' ' + '-17salsa'
      + ' ' + '-融资申请'
      + ' ' + '-最简单的创业计划书'
      
      , doneLabel: 'OutOfBulkChannel'
      , limit: LIMIT
      , res: {
        Ticket: MyFreshdesk.Ticket
        , gasContact: gasContact
      }
    })
    
    log(log.DEBUG, bulkChannel.getName() + ' QUERY_STRING: [' + bulkChannel.getQueryString() + ']')

    bulkChannel.use(
      logOnStart
      , labelAdd_Mike
      , labelAdd_Bug
      
      , skipFromMyContacts     
      , replySubmitGuideIfMailToBpAccount
      
      , labelAdd_ToBeDeleted
      , moveToArchive
      
      , labelRemove_Bug
      , logOnEnd
    )
    
    return bulkChannel.done()
    
  }

  
  /**
  *
  * 1. to:bp@pre-angel.com with CIPHER for zixia
  *
  */
  function doBpWithCipherChannel() {
    
    // 1. to:bp with CIPHER
    var bpWithCipherChannel = new GmailChannel({
      name: 'bpWithCipherChannel'
      , keywords: []
      , labels: [
        'inbox'
        , '-' + 'trash'
      ]
      , dayspan: DAYSPAN
      , query: '(to:(bp@pre-angel.com OR bp@preangelpartners.com) NOT to:zixia)'
      + ' ' + '(abu OR 阿布 OR bruce OR zixia OR lizh OR lizhuohuan OR zhuohuan OR 卓桓 OR 李兄 OR 李卓桓 OR 卓恒 OR 李卓恒 OR 李总 OR 李老师 OR 李先生)'
      + ' ' + '("邮箱发来的超大附件" OR "邮箱发来的云附件" OR (filename:pptx OR filename:ppt OR filename:pdf OR filename:doc))'
      
      , doneLabel: 'OutOfGmailChannel'
      , limit: LIMIT
      , res: {
        Ticket: MyFreshdesk.Ticket
        , gasContact: gasContact
      }
    })
    
//    bpChannel = new GmailChannel({
//      query: '天使帮推荐项目- 众趣3D'
//      , labels: []
//      , res: {
//        Ticket: MyFreshdesk.Ticket
//      }
//    })
    
    log(log.DEBUG, bpWithCipherChannel.getName() + ' QUERY_STRING: [' + bpWithCipherChannel.getQueryString() + ']')
//    log(log.DEBUG, 'debug')
//    log(log.INFO, 'info')
//    log(log.NOTICE, 'notice')
    
    bpWithCipherChannel.use(
      logOnStart
      , labelAdd_Mike
      , labelAdd_NotBizPlan
      
      , skipFromMyContacts
      , skipInvalidBizPlan
      
      , labelRemove_NotBizPlan
      , labelAdd_BizPlan
      , labelAdd_Bug
      
      , summaryBizPlan
      , createTicket
      , trashBizplan

      , labelRemove_Bug
      , logOnEnd
    )

    bpWithCipherChannel.done()
    
  }

  /**
  * 2. to:(zixia@pre-angel.com OR bp@pre-angel.com)
  **/
  function doBpZixiaChannel() {
    
    // 2. to:bp AND to:zixia
    var bpZixiaChannel = new GmailChannel({
      name: 'bpZixiaChannel'
      , keywords: []
      , labels: [
        'inbox'
        , '-' + 'trash'
      ]
      , dayspan: DAYSPAN
      , query: 'to:(zixia@pre-angel.com OR zixia@preangelpartners.com)'
      + ' ' + 'to:(bp@pre-angel.com OR bp@preangelpartners.com)'
      + ' ' + 'has:attachment'
      
      , doneLabel: 'OutOfGmailChannel'
      , limit: LIMIT
      , res: {
        Ticket: MyFreshdesk.Ticket
        , gasContact: gasContact
      }
    })
    
//    bpChannel = new GmailChannel({
//      query: '天使帮推荐项目- 众趣3D'
//      , labels: []
//      , res: {
//        Ticket: MyFreshdesk.Ticket
//      }
//    })
    
    log(bpZixiaChannel.getName() + ': ' + bpZixiaChannel.getQueryString())
    
    bpZixiaChannel.use(
      logOnStart
      , labelAdd_Mike
      , labelAdd_NotBizPlan

      , skipFromMyContacts
      , skipInvalidBizPlan

      , labelRemove_NotBizPlan
      , labelAdd_BizPlan
      , labelAdd_Bug
      
      , summaryBizPlan
      , createTicket
      // no need to forward because I have a gmail filter to forward all mails to bp@pre* already
      // , forwardBizplan          
      , trashBizplan
      
      , labelRemove_Bug
      , logOnEnd
    )

    bpZixiaChannel.done()

  }
  
  /**
  *
  * 1. to:zixia@pre-angel.com (ONLY. NOT to:bp@pre-angel.com)
  *
  */
  function doZixiaChannel() {
    
    var zixiaChannel = new GmailChannel({
      name: 'zixiaChannel'
      , keywords: []
      , labels: [
        'inbox'
        , '-' + 'trash'
      ]
      , dayspan: 1
      , query: '("邮箱发来的超大附件" OR "邮箱发来的云附件" OR (filename:pptx OR filename:ppt OR filename:pdf))'
      + ' ' + '(to:(zixia@pre-angel.com OR zixia@preangelpartners.com) NOT to:(bp@pre-angel.com OR bp@preangelpartners.com))'
      
      , doneLabel: 'OutOfGmailChannel'
      , limit: 1
      , res: {
        Ticket: MyFreshdesk.Ticket
        , gasContact: gasContact
      }
    })
    
    zixiaChannel = new GmailChannel({
      name: 'zixiaChannel'
      , query: '1217 Bosrado自制真人秀-挑战老板（投资版）'
      , labels: []
      , res: {
        Ticket: MyFreshdesk.Ticket
        , gasContact: gasContact
      }
    })
    
    log(log.DEBUG, zixiaChannel.getName() + ' QUERY_STRING: [' + zixiaChannel.getQueryString() + ']')
    
    zixiaChannel.use(
      logOnStart
      , labelAdd_Mike
      , labelAdd_NotBizPlan

      , skipFromMyContacts
      , skipInvalidBizPlan

      , labelRemove_NotBizPlan
      , labelAdd_BizPlan
      , labelAdd_Bug
      
      , summaryBizPlan
      , createTicket
      , forwardBizplan          
      , trashBizplan
      
      , labelRemove_Bug
      , logOnEnd
    )
    
    zixiaChannel.done()
    
  } 
  
  /**
  *
  * Submit from form
  *
  */
  function doFormChannel() {
    
    var formChannel = new GmailChannel({
      name: 'formChannel'
      , keywords: [
        '融资申请'
        , '最简单的创业计划书'
        , '-abcdefghijklmnopqrstuvwxyz'
      ]
      , labels: [
        , '-trash'
      ]
      , dayspan: DAYSPAN
      , query: 'to:bp'
      , doneLabel: 'OutOfGmailChannel'
      , limit: LIMIT
      , res: {
        Ticket: MyFreshdesk.Ticket
        , gasContact: gasContact
      }
    })
    
    //  formChannel = new GmailChannel({
    //    query: '融资申请 133 天天车城二手车 to:bp'
    //    , labels: []
    //    , res: {
    //      Ticket: MyFreshdesk.Ticket
    //    }
    //  })

    log(formChannel.getName() + ' QUERY_STRING: [' + formChannel.getQueryString() + ']')
    
    formChannel.use(
      logOnStart
      , labelAdd_Mike
      , labelAdd_BizPlan
      , labelAdd_Bug
      
      , summaryFormBizplan
      , createTicket

      , analyzeDetails
      , processTicket

      , labelAdd_ToBeDeleted
      , moveToArchive

      , labelRemove_Bug
      , logOnEnd
    )
    
    formChannel.done()
    
  }   
  
  
  ////////////////////////////////////////////////////////////////////////////////////////////////////
  
  /**
  *
  *
  *
  */ 
  
  function analyzeDetails(req, res, next) {
    var bizplan = req.bizplan
    var startup = req.startup
    var message = req.getThread().getMessages()[0]
    
    if (!bizplan) {
      log('no bizplan found, cant analyze for [%s]', req.getThread().getFirstMessageSubject())
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
      if (isBeijingMobile(startup.mobile)) {
        isBeijing = true
      } else {
        req.memo = (req.memo||'') + ' 手机号码非北京 '
      }
      if (/电商|O2O/i.test(startup.name + startup.description + startup.problem)) isOffline = true
      if (/游戏/.test(startup.name + startup.description + startup.problem)) isGame = true
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
  
  function processTicket(req, res, next) {
    
    var analyze = req.analyze
    var ticket = req.ticket
    
    if (!analyze || !ticket) {
      log('no analyze or ticket fouond, cant processTicket for [%s]', req.getThread().getFirstMessageSubject())
      return false
    }
    
    if (!analyze.zixia) {
      
      if (!analyze.beijing) {
        ticket.note({
          helpdesk_note: {
            body: '非北京\n' + (req.memo || '')
            , private: true
          }
        })
        ticket.close()
      } else if (analyze.game) {
        ticket.note({
          helpdesk_note: {
            body: '游戏\n' + (req.memo || '')
            , private: true
          }
        })
        ticket.close()      
      } else if (analyze.offline) {
        ticket.note({
          helpdesk_note: {
            body: '电商/O2O\n' + (req.memo || '')
            , private: true
          }
        })
        ticket.close()
      } else {
        
        ticket.note({
          helpdesk_note: {
            body: '内容分析结果未知\n' + (req.memo || '')
            , private: true
          }
        })
        ticket.lowPriority()
        ticket.assign(ID_AGENT_MARY)
        
      }
      
    } else { // is to zixia
      
      ticket.note({
        helpdesk_note: {
          body: '是投递给zixia的\n' + (req.memo || '')
          , private: true
        }
      })
      ticket.mediumPriority()
      ticket.assign(ID_AGENT_MARY)
      
    }
    
    next()
  }
  
  function summaryFormBizplan(req, res, next) {
    var messages = req.getThread().getMessages()
    var message = messages[0]
    
    var body = message.getBody()
    
    var match
    
    match = /(<table [\s\S]+?<\/table>)/i.exec(body)
    if (!match) {
      log('summaryFormBizplan failed to extract info from [%s]', message.getSubject())
      return false
    }
    var tableHtml = match[1]
    
    
    var RE = /<tr><th>([\s\S]*?)<\/th><td>([\s\S]*?)<\/td><\/tr>/gi
    var FORM_TABLE = {}
    while (match=RE.exec(tableHtml)) {
      var header = match[1]
      var description = match[2]
      
      FORM_TABLE[header] = description
    }
    
    function getValue(keyword) {
      var keys = Object.keys(FORM_TABLE)
      for (var i=0; i<keys.length; i++) {
        var key = keys[i]
        var re = new RegExp(keyword, 'i')
        if (re.test(key)) {
          return FORM_TABLE[key]
        }
      }
      return ''
    }
    
    var startup = {
      name: getValue('产品叫什么')
      , description: getValue('一句话')
      , problem: getValue('痛点')
      , team: getValue('团队')
      , slogan: getValue('名言')
      , willing: getValue('投入')
      , money: getValue('多少钱')
      , file: getValue('文件')
      , need: getValue('帮助')
      , founder: getValue('姓名')
      , sex: getValue('性别')
      , email: getValue('Email')
      , mobile: getValue('手机')
      , wechat: getValue('微信')
      , birthday: getValue('生日')
      , company: getValue('公司')
      , web: getValue('网址')
      , address: getValue('地址')
    }
    
    match = /mailto:([^@]+?@[^@]+?)['"]/.exec(startup.email)
    if (match) startup.email = match[1]
    
    match = /<strong>([\s\S]+)<\/strong>/ig.exec(startup.address)
    if (match) startup.address = match[1].replace(/<[^>]+>/g, '')
    
    match = />(http[\s\S]+?)</.exec(startup.web)
    if (match) startup.web = match[1]
    
    Object.keys(startup).forEach(function (k) {
      log(k + '=' + startup[k])
    })
    
    req.bizplan = {
      from: startup.founder + '<' + startup.email + '>'
      , to: 'bp@pre-angel.com'
      , subject: startup.name
      , description: tableHtml
      
      , address: startup.address
      , company: startup.company
    }
    
    
    // save details for later use.
    req.startup = startup
    
    
    if (!startup.email) {
      log(log.NOTICE, 'skipped because no startup.email for %s', startup.name)
      return
    }
    
    next()
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
    var thread = message.getThread()
    
    var ttl = 9
    while (ttl-- > 0) {
      GmailApp.refreshThread(thread)
             
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
  
  
  
  /**
  *
  *
  */
  function skipInvalidBizPlan(req, res, next) {
            
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
      return log(log.NOTICE, req.getChannelName() + ': is not bizplan because ' + reason)
    }
    
    next()
  }
  
  
  function summaryBizPlan(req, res, next) {
    
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
      
      log(log.INFO, 'attachments dropped. original %s attachments.', Math.floor(attachments.length))
    }
    
    req.bizplan = {
      from: from
      , to: to + ',' + cc
      , subject: subject
      , description: description
      , attachments: pickedAttachments
    }
    
    next()
  }
  
  
  /*********************************************
  *
  * create freshdesk ticket!
  *
  */
  function createTicket(req, res, next) {
    
    var Ticket = res.Ticket
    if (!Ticket) throw Error('no Ticket class found!')
    
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
      log(log.ALERT, 'Too many(%s) recipients. will not cc anybody.', recipients.length)
    }
    
    /**
    *
    * make payload for api
    *
    */
    var ticketObj = {
      helpdesk_ticket: {
        description_html: bizplan.description
        , subject: bizplan.subject
        , email: bizplan.from
      }
      , cc_emails: bizplan.to
    }
    
    if (bizplan.attachments && bizplan.attachments instanceof Array && bizplan.attachments.length) {
      
      ticketObj.helpdesk_ticket.attachments = []
      
      bizplan.attachments.forEach(function (attachment) {
        ticketObj.helpdesk_ticket.attachments.push({
          resource: attachment
        })
      })  
    }
    
    req.ticket = new 
    Ticket(ticketObj)
    
    next()
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
    log(log.DEBUG, report)
    next()
  }
  
  function moveToArchive(req, res, next) { req.getThread().moveToArchive(); next() }
  
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
        log(log.ERR, 'forwardMessage: ' + e.message)
      }
    }
    
    next()
  }
  
  function labelAdd_BizPlan(req, res, next) { req.getThread().addLabel(GmailApp.getUserLabelByName('BizPlan')); next() }
  function labelAdd_ToBeDeleted(req, res, next) { req.getThread().addLabel(GmailApp.getUserLabelByName('ToBeDeleted')); next() }
  
  function labelAdd_NotBizPlan(req, res, next) { req.getThread().addLabel(GmailApp.getUserLabelByName('NotBizPlan')); next() }
  function labelRemove_NotBizPlan(req, res, next) { req.getThread().removeLabel(GmailApp.getUserLabelByName('NotBizPlan')); next() }

  function labelAdd_Mike(req, res, next) { req.getThread().addLabel(GmailApp.getUserLabelByName('Mike/MikeBo')); next() }
  function labelRemove_Mike(req, res, next) { req.getThread().removeLabel(GmailApp.getUserLabelByName('Mike/MikeBo')); next() }
 
  function labelAdd_Bug(req, res, next) { req.getThread().addLabel(GmailApp.getUserLabelByName('Mike/BugBo')); next() }
  function labelRemove_Bug(req, res, next) { req.getThread().removeLabel(GmailApp.getUserLabelByName('Mike/BugBo')); next() }

  function isBeijingMobile(mobile) {
    
    var SEARCH_URL = 'https://tcc.taobao.com/cc/json/mobile_tel_segment.htm?tel='
    
    var response = UrlFetchApp.fetch(SEARCH_URL + mobile, {
                                     muteHttpExceptions: true
                                     })
    
    if (response.getResponseCode()!=200) return false
    
//    Logger.log(response.getContentText('GBK'))
    return /北京/.test(response.getContentText('GBK'))
  }
  
  function logOnStart(req, res, next) {
    req.beginTime = new Date()
    log(req.getChannelName() + ' begin of processing ' + req.getThread().getFirstMessageSubject())
    next()
  }

  function logOnEnd(req, res, next) {
    log(req.getChannelName() + ' end of processing ' + req.getThread().getFirstMessageSubject())
    log(req.getChannelName() + ' time cost: ' + Math.floor((new Date() - req.beginTime)/1000) + 's' )
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
      return log(req.getChannelName() + ': ' + from + ' isMyContact.')
    } 
    return next()
  }
  
  function replySubmitGuideIfMailToBpAccount(req, res, next) {
    
    var message = req.getThread().getMessages()[0]
    var to = message.getTo()   
    
    if (/bp@pre/i.test(to)) {
      replySubmitGuide(message)
    }
    
    next()
  }
  
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
 
}