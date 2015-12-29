 
function cleanInbox() {
  'use strict'  
  
  if ((typeof log)==='undefined') eval ('var log = new GasLog()')

  if ((typeof GmailChannel)==='undefined') { // GmailChannel Initialization. (only if not initialized yet.)
    var TTL = 3
    var CODE = undefined
    while (!CODE && TTL-->0) {
      try {
        CODE = UrlFetchApp.fetch('https://raw.githubusercontent.com/zixia/gas-gmail-channel/master/src/gas-gmail-channel-lib.js?2').getContentText()
      } catch (e) {
        log(log.ERR, 'UrlFetchApp.fetch exception: %s', e.message)
      }
    }
    if (CODE) {
      eval(CODE)
      GmailApp.getAliases() // Require permission
    }
  } // Class GmailChannel is ready for use now!

  var FRESHDESK_URL = PropertiesService.getScriptProperties().getProperty('FreshdeskDomainUrl')
  var FRESHDESK_KEY = PropertiesService.getScriptProperties().getProperty('FreshdeskApiKey')
  var MyFreshdesk = new Freshdesk(FRESHDESK_URL, FRESHDESK_KEY)

  var gasContact = new GasContact()
  
  var ID_AGENT_MARY = '5008844005'
  var ID_AGENT_ZIXIA = '5006515033'
  
  /**
  *
  * LIMIT: how many message(s) processed per call
  * DAYSPAN: how many day(s) looks back by search 
  *
  */
  var DAYSPAN = 1
  var LIMIT   = 7


  var startTime = new Date()
  log(log.DEBUG, 'InboxCleaner starting...')

  ///////////////////////////////////////////////////////////////////////////
  //
  // Start Cleaning
  
//  return doIntviuChannel()       // 7. 橙云面试视频(IntViu)
  
  doBpZixiaChannel()      // 1. 同时发给 zixia@pre 和  bp@pre 邮箱
  doBpWithCipherChannel() // 2. 只发到 bp@pre 邮箱的，但是有我的名字
  doZixiaChannel()        // 3. 只发到 zixia@pre 邮箱
  doFormChannel()         // 4. 通过表单提交

  doBulkChannel()         // 5. 群发邮件，并且不是发到我的邮箱的
  
  doApplyChannel()        // 6. PreAngel申请表（MikeCRM）
  
  
  // End Cleaning
  //
  ////////////////////////////////////////////////////////////////////////////
  
  var endTime = new Date()
  var totalTime = endTime - startTime
  
  var totalSeconds = Math.floor(totalTime/1000)
  
  return log(log.INFO, 'InboxCleaner runned(%ss)', totalSeconds)

  
  
  
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
      name: 'bulk'
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
    
    // DEBUG
//    bulkChannel = new GmailChannel ({
//      name: 'bulkChannel'
//      , keywords: []
//      , labels: [
//        'inbox'
//        , '-' + 'ToBeDeleted'
//        , '-' + 'trash'
//      ]
//      , query: '企业如何获得政府财税支持'
//      , doneLabel: 'OutOfBulkChannel'
//      , limit: 1
//      , res: {
//        Ticket: MyFreshdesk.Ticket
//        , gasContact: gasContact
//      }
//    })
    
    
    log(log.DEBUG, bulkChannel.getName() + ' QUERY_STRING: [' + bulkChannel.getQueryString() + ']')

    bulkChannel.use(
      logOnStart
      , labelAdd_Mike
      
      , skipFromMyContacts
      , labelAdd_Bug

      , replySubmitGuideIfMailToBpAddress
      
      , labelAdd_ToBeDeleted
      , moveToArchive
      
      , labelRemove_Bug
    )
    
    return bulkChannel.done(logOnEnd)
    
  }

  
  /**
  *
  * 1. to:bp@pre-angel.com with CIPHER for zixia
  *
  */
  function doBpWithCipherChannel() {
    
    // 1. to:bp with CIPHER
    var bpWithCipherChannel = new GmailChannel({
      name: 'bpWithCipher'
      , keywords: []
      , labels: [
        'inbox'
        , '-' + 'trash'
      ]
      , dayspan: DAYSPAN
      , query: '(to:(bp@pre-angel.com OR bp@preangelpartners.com) NOT to:zixia)'
      + ' ' + '(abu OR 阿布 OR bruce OR zixia OR lizh OR lizhuohuan OR zhuohuan OR 卓桓 OR 李兄 OR 李卓桓 OR 卓恒 OR 李卓恒 OR 李总 OR 李老师 OR 李先生)'
      + ' ' + '("邮箱发来的超大附件" OR "邮箱发来的云附件" OR (filename:pptx OR filename:ppt OR filename:pdf OR filename:doc))'
      
      , doneLabel: 'OutOfBpCipherChannel'
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
      , processTicket
      , trashBizplan

      , labelRemove_Bug
    )

    bpWithCipherChannel.done(logOnEnd)
    
  }

  /**
  * 2. to:(zixia@pre-angel.com OR bp@pre-angel.com)
  **/
  function doBpZixiaChannel() {
    
    // 2. to:bp AND to:zixia
    var bpZixiaChannel = new GmailChannel({
      name: 'bpZixia'
      , keywords: []
      , labels: [
        'inbox'
        , '-' + 'trash'
      ]
      , dayspan: DAYSPAN
      , query: 'to:(zixia@pre-angel.com OR zixia@preangelpartners.com)'
      + ' ' + 'to:(bp@pre-angel.com OR bp@preangelpartners.com)'
      + ' ' + 'has:attachment'
      
      , doneLabel: 'OutOfBpZixiaChannel'
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
    
    log(log.DEBUG, bpZixiaChannel.getName() + ' QUERY_STRING: ' + bpZixiaChannel.getQueryString())
    
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
      , processTicket
      // no need to forward because I have a gmail filter to forward all mails to bp@pre* already
      // , forwardBizplan          
      , trashBizplan
      
      , labelRemove_Bug
    )

    bpZixiaChannel.done(logOnEnd)

  }
  
  /**
  *
  * 1. to:zixia@pre-angel.com (ONLY. NOT to:bp@pre-angel.com)
  *
  */
  function doZixiaChannel() {
    
    var zixiaChannel = new GmailChannel({
      name: 'zixia'
      , keywords: []
      , labels: [
        'inbox'
        , '-' + 'trash'
      ]
      , dayspan: 1
      , query: '("邮箱发来的超大附件" OR "邮箱发来的云附件" OR (filename:pptx OR filename:ppt OR filename:pdf))'
      + ' ' + '(to:(zixia@pre-angel.com OR zixia@preangelpartners.com) NOT to:(bp@pre-angel.com OR bp@preangelpartners.com))'
      
      , doneLabel: 'OutOfZixiaChannel'
      , limit: 1
      , res: {
        Ticket: MyFreshdesk.Ticket
        , gasContact: gasContact
      }
    })
    
//    zixiaChannel = new GmailChannel({
//      name: 'zixiaChannel'
//      , query: '1217 Bosrado自制真人秀-挑战老板（投资版）'
//      , labels: []
//      , res: {
//        Ticket: MyFreshdesk.Ticket
//        , gasContact: gasContact
//      }
//    })
    
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
      , processTicket
      , forwardBizplan          
      , trashBizplan
      
      , labelRemove_Bug
    )
    
    zixiaChannel.done(logOnEnd)
    
  } 
  
  /**
  *
  * Submit from form
  *
  */
  function doFormChannel() {
    
    var formChannel = new GmailChannel({
      name: 'form'
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
      , doneLabel: 'OutOfFormChannel'
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

    log(log.DEBUG, formChannel.getName() + ' QUERY_STRING: [' + formChannel.getQueryString() + ']')
    
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
    )
    
    formChannel.done(logOnEnd)
    
  }   
  
  /**
  *
  * Submit from MikeCRM
  *
  */
  function doApplyChannel() {
        
    var applyChannel = new GmailChannel({
      name: 'apply'
      , keywords: [
        'PreAngel申请表 '
      ]
      , labels: [
        , '-trash'
      ]
      , dayspan: DAYSPAN
      , query: 'from:mikecrm.com to:(zixia OR bp)'
      , doneLabel: 'OutOfApplyChannel'
      , limit: LIMIT
      , res: {
        Ticket: MyFreshdesk.Ticket
//        , Contact: MyFreshdesk.Contact
        , gasContact: gasContact
      }
    })
    
    log(log.DEBUG, applyChannel.getName() + ' QUERY_STRING: [' + applyChannel.getQueryString() + ']')
    
    applyChannel.use(
      logOnStart
      , labelAdd_Mike
      , labelAdd_Bug

      , parseApplyFromMikeCrm
      , attachApplyToTicket

      , moveToArchive
      , labelRemove_Bug
    )
    
    applyChannel.done(logOnEnd)
    
  }   
  
  ////////////////////////////////////////////////////////////////////////////////////////////////////
  
  /**
  *
  *
  *
  */ 
  
  function attachApplyToTicket(req, res, next) {
    
    var Ticket = res.Ticket
//    var Contact = res.Contact
    if (!Ticket /*|| !Contact*/) throw Error('no Ticket or Contact class found!')
    
    var apply = req.apply
    var applyHtml = req.applyHtml
    
    var tickets = Ticket.list({ email: apply.email })
    
    var ticket
    if (tickets && tickets.length) {
      ticket = tickets[tickets.length-1]
    }
    
    /**
    * existing ticket
    */
    if (ticket) { 
      ticket.note({
        helpdesk_note: {
          body_html: applyHtml
          , private: true
        }
      })
      ticket.open()
      req.errors.push('attached apply to ticket#' + ticket.getId())
      
    } else { // new ticket
      
      ticket = new Ticket({
        helpdesk_ticket: {
          description_html: applyHtml
          , subject: apply.company
          , email: apply.name + '<' + apply.email + '>'
        }
      })
      req.errors.push('created apply to ticket#' + ticket.getId())
                    
    }
    
    ticket.mediumPriority()
    ticket.assign(ID_AGENT_ZIXIA)
    

    next()
  }
  
  function parseApplyFromMikeCrm(req, res, next) {
    var message = req.getThread().getMessages()[0]
    
    var body = message.getBody()
    
    var match = /(<table><tbody>[\s\S]+<\/tbody><\/table>)/i.exec(body)
    
    if (!match) {
      return req.errors.push('attachApplyToTicket failed to extract info from [%s]', message.getSubject())
    }
    var tableHtml = match[1]
    .replace(/<wbr>/ig, '')
    
    var RE = /([^<>]+?)<\/p><\/td><\/tr><tr[\s\S]+?>([^<>]+?)<\/div><\/td><\/tr><\/tbody><\/table>/gi
    var FORM_TABLE = {}
    while (match=RE.exec(tableHtml)) {
      var header = match[1]
      var description = match[2]
      
//      Logger.log(header + ':' + description)
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
    
    
    var apply = {
      name: getValue('姓名')
      , email: getValue('Email')
      , company: getValue('公司')
    }
    
    match = /mailto:([^@]+?@[^@]+?)['"]/.exec(apply.email)
    if (match) apply.email = match[1]
    
    req.apply = apply
    req.applyHtml = tableHtml
    
    next()
  }
  
  
  function analyzeDetails(req, res, next) {
    var bizplan = req.bizplan
    var startup = req.startup
    var message = req.getThread().getMessages()[0]
    
    if (!bizplan) {
      req.errors.push('no bizplan found, cant analyze for [' + req.getThread().getFirstMessageSubject() + ']')
//      log(log.ERR, 'no bizplan found, cant analyze for [%s]', req.getThread().getFirstMessageSubject())
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
      , 'MIKEBO'
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
    
    if (startup && startup.deliverTo) {
      if (!/李卓桓|无所谓/.test(startup.deliverTo)) isToZixia = false
    }
        
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
      if (GasContact.isBeijingMobile(startup.mobile)) {
        isBeijing = true
      } else {
        req.errors.push('手机号码非北京')
      }
      if (/电商|O2O/i.test(startup.name + startup.description + startup.problem)) {
        isOffline = true
        req.errors.push('电商/O2O方向')
      }
      if (/游戏/.test(startup.name + startup.description + startup.problem)) {
        isGame = true
        req.errors.push('游戏方向')
      }
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
      helpdesk_note: {
        body: noteMsg
        , private: true
      }
    })

    req.errors.push(noteMsg)
    
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
      deliverTo: getValue('联系哪位合伙人')
      , name: getValue('产品叫什么')
      , description: getValue('一句话')
      , problem: getValue('痛点')
      , team: getValue('团队')
      , slogan: getValue('名言')
      , willing: getValue('投入')
      , money: getValue('融多少钱')
      , keyword: getValue('关键词')
      , file: getValue('文件')
      , need: getValue('帮助')
      , refer: getValue('哪里找到我们')
      , founder: getValue('姓名')
      , sex: getValue('性别')
      , email: getValue('Email')
      , mobile: getValue('手机')
      , wechat: getValue('微信')
      , birthday: getValue('生日')
      , zodiac: getValue('星座')
      , company: getValue('公司')
      , web: getValue('网址')
      , address: getValue('地址')
      , ex: getValue('扩展属性')
    }
    
    match = /mailto:([^@]+?@[^@]+?)['"]/.exec(startup.email)
    if (match) startup.email = match[1]
    
    match = /<strong>([\s\S]+)<\/strong>/ig.exec(startup.address)
    if (match) startup.address = match[1].replace(/<[^>]+>/g, '')
    
    match = />(http[\s\S]+?)</.exec(startup.web)
    if (match) startup.web = match[1]
    
    Object.keys(startup).forEach(function (k) {
      log(log.DEBUG, k + '=' + startup[k])
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
      return req.errors.push('skipped because no startup.email for '.concat(startup.name))
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
    
    var ttl = 9
    while (ttl-- > 0) {
      
      var threadId = message.getThread().getId()
     
      // GmailApp.refreshThread(thread) not work???
      // must use GmailApp getThread, for force reload
      var thread = GmailApp.getThreadById(threadId)
             
      log(log.DEBUG, 'forward ttl:%s, message num:%s', ttl, thread.getMessages().length)
      
      messages = thread.getMessages().filter(function(m) {
        return 
        ( 
          !m.isInTrash() 
          && 'zixia@zixia.net' == m.getFrom() 
          && ZIXIABPGROUP == m.getTo()
        )
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
      req.errors.push('is not bizplan because ' + reason)
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
      
      req.errors.push('attachments dropped. original ' + Math.floor(attachments.length) + ' attachments.')
    }
    
    req.bizplan = {
      from: from
      , to: to // + ',' + cc
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
      req.errors.push('Too many(' + recipients.length + ') recipients. will not cc anybody.')
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
//      , cc_emails: bizplan.to
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
  
  function labelAdd_BizPlan(req, res, next) { req.getThread().addLabel(GmailApp.getUserLabelByName('BizPlan')); next() }
  
  function labelAdd_NotBizPlan(req, res, next) { req.getThread().addLabel(GmailApp.getUserLabelByName('NotBizPlan')); next() }
  function labelRemove_NotBizPlan(req, res, next) { req.getThread().removeLabel(GmailApp.getUserLabelByName('NotBizPlan')); next() }

  function labelAdd_Mike(req, res, next) { req.getThread().addLabel(GmailApp.getUserLabelByName('Mike/MikeBo')); next() }
  function labelRemove_Mike(req, res, next) { req.getThread().removeLabel(GmailApp.getUserLabelByName('Mike/MikeBo')); next() }
 
  function labelAdd_Bug(req, res, next) { req.getThread().addLabel(GmailApp.getUserLabelByName('Mike/BugBo')); next() }
  function labelRemove_Bug(req, res, next) { req.getThread().removeLabel(GmailApp.getUserLabelByName('Mike/BugBo')); next() }

  function labelAdd_ToBeDeleted(req, res, next) { req.getThread().addLabel(GmailApp.getUserLabelByName('ToBeDeleted')); next() }

  function moveToArchive(req, res, next) { req.getThread().moveToArchive(); next() }


  
  function logOnStart(req, res, next) {
    req.startTime = new Date()
    req.errors = []
    log(log.DEBUG, '%s start processing %s'
        , req.getChannelName()
        , req.getThread().getFirstMessageSubject()
       )
    next()
  }

  function logOnEnd(req, res, next) {
    log(log.NOTICE, 'C(%s/%ss)[%s] %s'
        , req.getChannelName()  
        , Math.floor((new Date() - req.startTime)/1000)
        
        , req.getThread().getFirstMessageSubject()
        , req.errors.join(',')
       )
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