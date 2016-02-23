function cleanInbox() {
  'use strict'  

  // DAYSPAN: how many day(s) looks back by search 
  var DAYSPAN = 7
  // LIMIT: how many message(s) processed per call
  var LIMIT   = 7
  
  if ((typeof log)==='undefined') eval ('var log = new GasLog()')

  if ((typeof GmailChannel)==='undefined') { // GmailChannel Initialization. (only if not initialized yet.)
    var TTL = 3
    var CODE = undefined
    while (!CODE && TTL-->0) {
      try {
        CODE = UrlFetchApp.fetch('https://raw.githubusercontent.com/zixia/gas-gmail-channel/master/src/gas-gmail-channel-lib.js?3').getContentText()
      } catch (e) {
        log(log.ERR, 'UrlFetchApp.fetch exception(ttl:%s): %s', TTL, e.message)
        Utilities.sleep(1000)
      }
    }
    if (CODE) {
      eval(CODE)
      GmailApp.getAliases() // Require permission
    }
  } // Class GmailChannel is ready for use now!


//  var gasContact = new GasContact()

  var startTime = new Date()
  log(log.DEBUG, 'InboxCleaner starting...')

  
  ////////////////////////////////////////////////////
  // 
  // Development & Testing
  //
//  return development()
//  return doZixiaChannel()
  //
  ////////////////////////////////////////////////////
  

  /////////////////////////////////////////////////////////////////////
  //
  // Start Cleaning
  
  
  doBulkChannel()         // 0. 群发邮件，并且不是发到我的邮箱的

  doBpWithCipherChannel() // 1. 只发到 bp@pre 邮箱的，但是有我的名字
  doBpZixiaChannel()      // 2. 同时发给 zixia@pre 和  bp@pre 邮箱
  doZixiaChannel()        // 3. 只发到 zixia@pre 邮箱
  
  doFormChannel()         // 4. 通过表单提交(JsForm)
  doApplyChannel()        // 5. PreAngel申请表(MikeCRM)
  doIntviuChannel()       // 6. 橙云面试视频(IntViu)
  
  // End Cleaning
  //
  /////////////////////////////////////////////////////////////////////
  
  var endTime = new Date()
  var totalTime = endTime - startTime
  
  var totalSeconds = Math.floor(totalTime/1000)
  
  return log(log.INFO, 'InboxCleaner runned(%ss)', totalSeconds)

  
  
  
  
  
  
  
  //////////////////////////////////////////////////////////////////////////
  //
  // END: Main code above execute END here
  //
  //////////////////////////////////////////////////////////////////////////

  
  
  
  
  
  function development() {
    var a = {}
    log('from: %s', a.from)
  }
  
  
  
  
  /******************************************************
  *
  *
  *
  * 0. Clean bulk emails of inbox
  *
  *
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
      , query: ['-(zixia'
                , ' OR lizh OR lizhuohuan OR lzhuohuan OR zhuohuan '
                , ' OR 卓桓 OR 李兄 OR 李卓桓 OR 卓恒 OR 李卓恒 OR 李总 OR 李老师 OR 李先生 '
                , ' OR abu OR 阿布 OR bruce OR ceibsmobi.com OR akamobi.com'
                , ')'

                , '-is:important'
                , '-17salsa'
                , '-融资申请'
                , '-最简单的创业计划书'
                , '-PreAngel创始人申请表'
               ].join(' ')
      
      , doneLabel: 'OutOfBulkChannel'
      , limit: LIMIT
      , res: {}
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
//      }
//    })
    
    
    log(log.DEBUG, bulkChannel.getName() + ' QUERY_STRING: [' + bulkChannel.getQueryString() + ']')

    bulkChannel.use(
      Tracker.logOnStart
      
      , Mailer.skipFromInvalidSender
      , Mailer.skipFromMyContacts

      , Mailer.replySubmitGuideIfMailToBpAddress
      
      , Bizplaner.summaryBizPlan
      , Parser.mail2Table
      , Ticketor.tryToPair
      , Ticketor.noteOrCreate
      , Ticketor.close

      , Mailer.labelAdd_ToBeDeleted
      , Mailer.moveToArchive

      , Bizplaner.ibot
      
//      , Mailer.labelDel_Bug
    )
    
    return bulkChannel.done(Tracker.logOnEnd)
    
  }

  
  
  
  
  
  
  
  
  
  
  
  
  /******************************************************
  *
  *
  *
  * 1. to:bp@pre-angel.com with CIPHER for zixia
  *
  *
  *
  */
  function doBpWithCipherChannel() {
    
    // 1. to:bp with CIPHER
    var bpWithCipherChannel = new GmailChannel({
      name: 'bpWithCipher'
      , keywords: []
      , labels: [ 'inbox', '-trash' ]
      , dayspan: DAYSPAN
      , query: ['(to:(bp@pre-angel.com OR bp@preangelpartners.com) NOT to:zixia)'
                , '(abu OR 阿布 OR bruce OR zixia OR lizh OR lizhuohuan OR zhuohuan OR 卓桓 OR 李兄 OR 李卓桓 OR 卓恒 OR 李卓恒 OR 李总 OR 李老师 OR 李先生)'
                , '("邮箱发来的超大附件" OR "邮箱发来的云附件" OR (filename:pptx OR filename:ppt OR filename:pdf OR filename:doc))'
               ].join(' ')
      , doneLabel: 'OutOfBpCipherChannel'
      , limit: LIMIT
      , res: {}
    })
    
//    bpWithCipherChannel = new GmailChannel({
//      name: 'bpWithCipher'
//      , query: '新型资产管理公司商业计划简要'
//      , keywords: []
//      , labels: [
//        , '-' + 'trash'
//      ]
//      
//      , doneLabel: null
//      , limit: LIMIT
//      , res: {
//        Ticket: MyFreshdesk.Ticket
//      }
//    })
    
    log(log.DEBUG, bpWithCipherChannel.getName() + ' QUERY_STRING: [' + bpWithCipherChannel.getQueryString() + ']')
    
    bpWithCipherChannel.use(
      Tracker.logOnStart
//      , Mailer.labelAdd_Mike
      , Mailer.labelAdd_NotBizPlan

      , Mailer.skipFromInvalidSender
      , Mailer.skipFromMyContacts
      , Bizplaner.skipInvalidBizPlan
      
      , Mailer.labelDel_NotBizPlan
      , Mailer.labelAdd_BizPlan
//      , Mailer.labelAdd_Bug
      
      , Bizplaner.summaryBizPlan
      , Ticketor.create
      , Ticketor.process
      , Mailer.trashBizplan

      , Bizplaner.ibot

//      , Mailer.labelDel_Bug
    )

    bpWithCipherChannel.done(Tracker.logOnEnd)
    
  }

  
  
  
  
  
  
  
  
  /***************************************************
  *
  *
  *
  * 2. to:(zixia@pre-angel.com OR bp@pre-angel.com)
  *
  *
  *
  */
  function doBpZixiaChannel() {
    
    // 2. to:bp AND to:zixia
    var bpZixiaChannel = new GmailChannel({
      name: 'bpZixia'
      , keywords: []
      , labels: [ 'inbox', '-trash' ]
      , dayspan: DAYSPAN
      , query: [ 'to:(zixia@pre-angel.com OR zixia@preangelpartners.com)'
                , 'to:(bp@pre-angel.com OR bp@preangelpartners.com)'
                , 'has:attachment'
               ].join(' ')
      , doneLabel: 'OutOfBpZixiaChannel'
      , limit: LIMIT
      , res: {}
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
      Tracker.logOnStart
//      , Mailer.labelAdd_Mike
      , Mailer.labelAdd_NotBizPlan

      , Mailer.skipFromInvalidSender
      , Mailer.skipFromMyContacts
      , Bizplaner.skipInvalidBizPlan

      , Mailer.labelDel_NotBizPlan
      , Mailer.labelAdd_BizPlan
//      , Mailer.labelAdd_Bug
      
      , Bizplaner.summaryBizPlan
      , Ticketor.create
      , Ticketor.process
      , Mailer.trashBizplan
      
      , Bizplaner.ibot
      , Ticketor.noteIbot

//      , Mailer.labelDel_Bug
    )

    bpZixiaChannel.done(Tracker.logOnEnd)

  }
  
  
  
  
  
  
  
  
  
  
  /******************************************************
  *
  *
  *
  * 3. to:zixia@pre-angel.com (ONLY. NOT to:bp@pre-angel.com)
  *
  *
  *
  */
  function doZixiaChannel() {
    
    var zixiaChannel = new GmailChannel({
      name: 'zixia'
      , keywords: []
      , labels: [ 'inbox', '-trash' ]
      , dayspan: DAYSPAN
      , query: [ '("邮箱发来的超大附件" OR "邮箱发来的云附件" OR (filename:pptx OR filename:ppt OR filename:pdf))'
                , '(to:(zixia@pre-angel.com OR zixia@preangelpartners.com OR zixia@preangelfund.com) NOT to:(bp@pre-angel.com OR bp@preangelpartners.com))'
               ].join(' ')
      , doneLabel: 'OutOfZixiaChannel'
      , limit: LIMIT
      , res: {}
    })
    
//    zixiaChannel = new GmailChannel({
//      name: 'zixiaChannel'
//      , query: '为我的创业项目“去耍”寻求筹款'
//      , labels: []
//      , doneLabel: null
//      , res: {}
//    })

    log(log.DEBUG, zixiaChannel.getName() + ' QUERY_STRING: [' + zixiaChannel.getQueryString() + ']')
    
    zixiaChannel.use(
      Tracker.logOnStart
//      , Mailer.labelAdd_Mike
      , Mailer.labelAdd_NotBizPlan

      , Mailer.skipFromInvalidSender
      , Mailer.skipFromMyContacts
      , Bizplaner.skipInvalidBizPlan

      , Mailer.labelDel_NotBizPlan
      , Mailer.labelAdd_BizPlan
//      , Mailer.labelAdd_Bug
      
      , Bizplaner.summaryBizPlan
      , Ticketor.create
      , Ticketor.process
      , Mailer.forwardBizplan          
      , Mailer.trashBizplan
      
//      , Mailer.labelDel_Bug
    )
    
    zixiaChannel.done(Tracker.logOnEnd)
    
  } 
  
  
  
  
  
  
  
  
  
  
  /******************************************************
  *
  *
  *
  * 4. Submit from form
  *
  *
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
      , labels: ['-trash']
      , dayspan: DAYSPAN
      , query: 'to:bp'
      , doneLabel: 'OutOfFormChannel'
      , limit: LIMIT
      , res: {}
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
      Tracker.logOnStart
//      , Mailer.labelAdd_Bug

//      , Mailer.labelAdd_Mike
      , Mailer.labelAdd_BizPlan
      
      , Parser.jsForm2Table
      , Parser.table2Bizplan
      
      
      , Ticketor.tryToPair
      , Ticketor.noteOrCreate
//      , Ticketor.create

      , Bizplaner.analyzeDetails
      , Ticketor.process

      , Mailer.labelAdd_ToBeDeleted
      , Mailer.moveToArchive

//      , Mailer.labelDel_Bug
    )
    
    formChannel.done(Tracker.logOnEnd)
    
  }   
  
  
  
  
  
  
  
  
  
  
  /******************************************************
  *
  *
  *
  * 5. Submit from MikeCRM
  *
  *
  *
  */
  function doApplyChannel() {
        
    var applyChannel = new GmailChannel({
      name: 'apply'
      , keywords: [ 'PreAngel创始人申请表' ]
      , labels: [ '-trash' ]
      , dayspan: DAYSPAN
      , query: 'from:mikecrm.com to:(zixia OR bp)'
      , doneLabel: 'OutOfApplyChannel'
      , limit: LIMIT
      , res: {}
    })
    
    log(log.DEBUG, applyChannel.getName() + ' QUERY_STRING: [' + applyChannel.getQueryString() + ']')
    
    applyChannel.use(
      Tracker.logOnStart
      , Mailer.labelAdd_BizPlan
//      , Mailer.labelAdd_Mike
//      , Mailer.labelAdd_Bug

      , Parser.mikeCrm2Table
      , Parser.table2Apply
      
      , Ticketor.tryToPair
      , Ticketor.noteOrCreate
//      , Ticketor.replyOrCreate
      , Ticketor.mediumPriority

      , Mailer.markRead
      , Mailer.moveToArchive
//      , Mailer.labelDel_Bug
    )
    
    applyChannel.done(Tracker.logOnEnd)
    
  }   
  
  
  
  
  
  
  
  
  
  
  
  /******************************************************
  *
  *
  *
  * 6. Intviu Interview
  *
  *
  *
  */
  function doIntviuChannel() {
        
    var intviuChannel = new GmailChannel({
      name: 'intviu'
      , keywords: [ '您发布的职位已有面试视频上传' ]
      , labels: [ '-trash' ]
      , dayspan: DAYSPAN
      , query: 'from:@intviu.cn to:(zixia OR bp)'
      
      // dont touch thread label.
      // instead, we trash message after process. 
      // because maybe there'll be new message in this thread.
      , doneLabel: null 
      , conversation: false
      
      , limit: LIMIT
      , res: {}
    })
    
    log(log.DEBUG, intviuChannel.getName() + ' QUERY_STRING: [' + intviuChannel.getQueryString() + ']')
    
    intviuChannel.use(
      Tracker.logOnStart
      , Mailer.labelAdd_BizPlan
//      , Mailer.labelAdd_Mike
//      , Mailer.labelAdd_Bug

      , Parser.intviu2Table
      , Parser.table2Interview
      
      , Ticketor.tryToPair
      , Ticketor.noteOrCreate
      , Ticketor.highPriority
//      , Ticketor.replyOrCreate

      , Mailer.trashMessage
//      , Mailer.labelDel_Bug
    )
    
    intviuChannel.done(Tracker.logOnEnd)
    
  }   

 
}