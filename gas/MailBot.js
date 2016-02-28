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
  
  doPlugAndPlayChannel()  // 7. Plug and Play BP
  
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
    
    bulkChannel.use(
      Tracker.logOnStart     
      , Bizplaner.init

      , Mailer.skipFromInvalidSender
      , Mailer.skipFromMyContacts

      , Mailer.replySubmitGuideIfMailToBpAddress
      
      , Mailer.labelAdd_ToBeDeleted
      , Mailer.moveToArchive

      , Bizplaner.skipInvalidBizplan
      , Mailer.labelAdd_BizPlan

      , Bizplaner.ibot
      , Ticketor.tryToPair
      , Ticketor.noteOrCreate
      , Ticketor.close
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
        
    bpWithCipherChannel.use(
      Tracker.logOnStart
      , Mailer.labelAdd_NotBizPlan

      , Bizplaner.init

      , Mailer.skipFromInvalidSender
      , Mailer.skipFromMyContacts
      , Bizplaner.skipInvalidBizplan
      
      , Mailer.labelDel_NotBizPlan
      , Mailer.labelAdd_BizPlan
      

      , Ticketor.create
      , Ticketor.process
      , Mailer.trashBizplan

      , Bizplaner.ibot
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
        
    bpZixiaChannel.use(
      Tracker.logOnStart
      , Mailer.labelAdd_NotBizPlan

      , Bizplaner.init

      , Mailer.skipFromInvalidSender
      , Mailer.skipFromMyContacts
      , Bizplaner.skipInvalidBizplan

      , Mailer.labelDel_NotBizPlan
      , Mailer.labelAdd_BizPlan
      

      , Ticketor.create
      , Ticketor.process
      , Mailer.trashBizplan
      
      , Bizplaner.ibot
      , Ticketor.noteIbot
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
    
    zixiaChannel.use(
      Tracker.logOnStart
      , Mailer.labelAdd_NotBizPlan

      , Bizplaner.init

      , Mailer.skipFromInvalidSender
      , Mailer.skipFromMyContacts
      , Bizplaner.skipInvalidBizplan

      , Mailer.labelDel_NotBizPlan
      , Mailer.labelAdd_BizPlan
      
      , Ticketor.create
      , Ticketor.process
      , Mailer.forwardBizplan          
      , Mailer.trashBizplan
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
     
    formChannel.use(
      Tracker.logOnStart

      , Mailer.labelAdd_BizPlan
      
      , Bizplaner.init
      , Parser.jsform
      
      , Ticketor.tryToPair
      , Ticketor.replyOrCreate

      , Bizplaner.analyzeDetails
      , Ticketor.process

      , Mailer.labelAdd_ToBeDeleted
      , Mailer.moveToArchive
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

      , Bizplaner.init
      , Parser.mikecrm
      
      , Ticketor.tryToPair
      , Ticketor.replyOrCreate
      , Ticketor.mediumPriority

      , Mailer.markRead
      , Mailer.moveToArchive
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
      
      /**
      * Don't exclude thread out of channel after process.
      * instead, we trash each message after process. 
      * because maybe there'll be new message arrived in this thread when we are processing.
      */
      , doneLabel: null 
      , conversation: false
      
      , limit: LIMIT
      , res: {}
    })
        
    intviuChannel.use(
      Tracker.logOnStart
      , Mailer.labelAdd_BizPlan

      , Bizplaner.init
      , Parser.intviu
      
      , Ticketor.tryToPair
      , Ticketor.replyOrCreate
      , Ticketor.highPriority

      , Mailer.trashMessage
    )
    
    intviuChannel.done(Tracker.logOnEnd)
    
  }   

 
  function doPlugAndPlayChannel() {
    var pnpChannel = new GmailChannel({
      name: 'PnP'
      , labels: [ 'inbox', '-trash' ]
      , dayspan: DAYSPAN
      , query: 'to:bp@pnp.vc'
      
      , doneLabel: 'OutOfPnPChannel'
      
      , limit: LIMIT
      , res: {}
    })
    
    pnpChannel.use(
      Tracker.logOnStart
      , Mailer.labelAdd_BizPlan
      
      , Bizplaner.init
      
      , Ticketor.tryToPair
      , Ticketor.noteOrCreate
      , Ticketor.assignPnp
      , Ticketor.assignChen
      
      , Mailer.labelAdd_ToBeDeleted
      , Mailer.moveToArchive
    )
    
    pnpChannel.done(Tracker.logOnEnd)
    
  }
}

function testInboxCleaner() {
//  theChannel = new GmailChannel({
//    query: '知食分子BP'
//    , labels: []
//    , res: {}
//  })
}