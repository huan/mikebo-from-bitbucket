/**
*
* MiddleWare Parser
*
*/
var Parser = (function () {
  'use strict'

  VERSION = '0.1.0'
  
  var Parser = function () {
  }
  
  /**
  *
  * Public Static Methods
  *
  */
//  Parser.mail2Table = mail2Table
//  Parser.mikeCrm2Table = mikeCrm2Table
//  Parser.table2Apply = table2Apply

//  Parser.jsForm2Table = jsForm2Table
//  Parser.table2Bizplan = table2Bizplan
  Parser.jsform = jsform
  Parser.intviu = intviu
  Parser.mikecrm = mikecrm
  
//  Parser.intviu2Table = intviu2Table
//  Parser.table2Interview = table2Interview
  

  // for testing
  Parser.mapTable = mapTable

  
  return Parser


  
  /////////////////////////////////////////////////////////////////
  
//  function mail2Table(req, res, next) {
//    var message = req.getMessage()
//    var from = message.getReplyTo() || message.getFrom()
//    
//    var name = GasContact.getEmailName(from)
//    var email = GasContact.getEmailAddress(from)
//    
//    req.tableHtml = message.getBody()
//    
//    req.table = {
//      name: name
//      , company: message.getSubject()
//      , email: email
//    }
//
//    next()  
//  }

//  function mikeCrm2Table(req, res, next) {
//    var message = req.getThread().getMessages()[0]
//    var body = message.getBody()
//    
//    var match = /(<table><tbody>[\s\S]+<\/tbody><\/table>)/i.exec(body)    
//    if (!match) {
//      return next('parseMikeCrm failed to extract info from ' + message.getSubject())
//    }
//    
//    var tableHtml = match[1].replace(/<wbr>/ig, '')
//    
//    var RE = /([^<>]+?)<\/p><\/td><\/tr><tr [^>]+>[\s\S]*?<div [^>]+>([\s\S]+?)<\/div><\/td><\/tr><\/tbody><\/table>/gi
//    var tableArray = {}
//    while (match=RE.exec(tableHtml)) {
//      var header = stripHtmlTag(match[1])
//      var description = stripHtmlTag(match[2])
//      //      Logger.log(header + ':' + description)
//      tableArray[header] = description
//    }
//    
//    req.table = tableArray
//    req.tableHtml = tableHtml
//    
//    next()  
//  }
//  
//  function table2Apply(req, res, next) {
//    var apply = {
//      name: '姓名'
//      , email: 'Email'
//      , company: '公司'
//    }
//    
//    apply = mapTable(apply, req.table)
//    
//    match = /mailto:([^@]+?@[^@]+?)['"]/.exec(apply.email)
//    if (match) apply.email = match[1]
//    
//    req.table = apply
//    
//    next()
//  }
  
  
//  /**
//  *
//  * conversation off(false) mode: use req.getMessage instead of req.getThread
//  *
//  */
//  function intviu2Table(req, res, next) {
//    var message = req.getMessage()
//    
//    var body = message.getBody()
//    
//    var match = /(<table align="center"[\s\S]+?intviu.cn[\s\S]+?<\/table>)/i.exec(body)
//    if (!match) {
//      return next('parseIntviu failed to extract info from ' + message.getSubject())
//    }
//    var tableHtml = match[1]
////    Logger.log(tableHtml) // XXX
//    
////    <tr>
////      <td bgcolor="#f8f8f8" style="color:#666666">面试名称：</td>
////      <td bgcolor="#f8f8f8" style="color:#333333"><b>PreAngel申请项目视频介绍</b></td>
////    </tr>
//
//    var RE = /<tr>[\s\S]*?<td bgcolor="#f8f8f8" style="color:#666666">([\s\S]+?)<\/td>[\s\S]*?<td bgcolor="#f8f8f8" style="color:#333333">([\s\S]+?)<\/td>[\s\S]*?<\/tr>/gi
//    var tableArray = {}
//    while (match=RE.exec(tableHtml)) {
//      var header = stripHtmlTag(match[1])
//      var description = stripHtmlTag(match[2])
////    Logger.log(header) //XXX  
//      tableArray[header] = description
//    }
////Logger.log(JSON.stringify(tableArray))//XXX
//    req.table = tableArray
//    req.tableHtml = tableHtml
//    
//    next()
//  }
//  
//  function table2Interview(req, res, next) {
//    var interview = {
//      name: '面试者'
//      , mobile: '手机'
//      , email: '邮箱'
//      , company: '面试名称' // for ticket subject
//    }
//    
//    interview = mapTable(interview, req.table)
//    
//    match = /mailto:([^@]+?@[^@]+?)['"]/.exec(interview.email)
//    if (match) interview.email = match[1]
////    Logger.log(JSON.stringify(req.table)) // XXX
////    Logger.log(JSON.stringify(interview)) // XXX
//    
//    req.table = interview
//    next()
//  }

  function intviu(req, res, next) {
    var bizplan = req.bizplan
    
    if (!intviu2Table(bizplan))        return req.pushError('intviu2Table failed')
    if (!intviuTable2Bizplan(bizplan)) return req.pushError('intviuTable2Bizplan failed')
    
    next()
  }

  function mikecrm(req, res, next) {
    var bizplan = req.bizplan
    
    if (!mikecrm2Table(bizplan))        return req.pushError('mikecrm2Table failed')
    if (!mikecrmTable2Bizplan(bizplan)) return req.pushError('mikecrmTable2Bizplan failed')
    
    next()
  }
  

  function jsform(req, res, next) {
    var bizplan = req.bizplan
    
    if (!jsform2Table(bizplan))        return req.pushError('jsForm2Table failed')
    if (!jsformTable2Bizplan(bizplan)) return req.pushError('jsFormTable2Bizplan failed')
    
    next()
  }
  
  
//  function jsForm2Table(req, res, next) {    
//    var messages = req.getThread().getMessages()
//    var message = messages[0]
//    
//    var body = message.getBody()
//    
//    var match = /(<table [\s\S]+?<\/table>)/i.exec(body)
//    if (!match) {
//      return next('parseJsForm failed to extract info from ' + message.getSubject())
//    }
//    var tableHtml = match[1]
//    
//    
//    var RE = /<tr><th>([\s\S]*?)<\/th><td>([\s\S]*?)<\/td><\/tr>/gi
//    var tableArray = {}
//    while (match=RE.exec(tableHtml)) {
//      var header = stripHtmlTag(match[1])
//      var description = stripHtmlTag(match[2])
//      
//      tableArray[header] = description
//    }
//
//    req.table = tableArray
//    req.tableHtml = tableHtml
//    
//    next()
//  }
//  
//
//  function table2Bizplan(req, res, next) {
//    var startup = {
//      deliverTo: '联系哪位合伙人'
//      , name: '产品叫什么'
//      , description: '一句话'
//      , problem: '痛点'
//      , team: '团队'
//      , slogan: '名言'
//      , willing: '投入'
//      , money: '融多少钱'
//      , keyword: '关键词'
//      , file: '文件'
//      , need: '帮助'
//      , refer: '哪里找到我们'
//      , founder: '姓名'
//      , sex: '性别'
//      , email: 'Email'
//      , mobile: '手机'
//      , wechat: '微信'
//      , birthday: '生日'
//      , zodiac: '星座'
//      , company: '公司'
//      , web: '网址'
//      , address: '地址'
//      , ex: '扩展属性'
//    }
//    
//    startup = mapTable(startup, req.table)
//
//    match = /mailto:([^@]+?@[^@]+?)['"]/.exec(startup.email)
//    if (match) startup.email = match[1]
//    
//    match = /<strong>([\s\S]+)<\/strong>/ig.exec(startup.address)
//    if (match) startup.address = match[1].replace(/<[^>]+>/g, '')
//    
//    match = />(http[\s\S]+?)</.exec(startup.web)
//    if (match) startup.web = match[1]
//    
////    Object.keys(startup).forEach(function (k) {
////      log(log.DEBUG, k + '=' + startup[k])
////    })
//    
//    req.bizplan = new Bizplan({
//      setFrom: startup.founder + '<' + startup.email + '>'
//      , setTo: 'bp@pre-angel.com'
//      , setSubject: startup.name
//      , setDescription: req.tableHtml
//      
//      , setLocation: startup.address
//      , setCompany: startup.company
//      
//      , setFounderName: startup.founder
//      , setFounderEmail: startup.email
//      , setFounderMobile: startup.mobile
//    })
//    
//    
//    // save details for later use.
//    req.startup = startup
//    
//    
//    if (!startup.email) {
//      return req.pushError('skipped because no startup.email for '.concat(startup.name))
//    }
//    
//    req.table = {
//      name: startup.founder
//      , company: startup.company || startup.name
//      , email: startup.email
//      , mobile: startup.mobile
//    }
//    return next()
//  }


  
  
  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  //
  // The Following are Helper Functions, not Middle Ware
  //
  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  
  
  

  /**
  *
  * Util method
  * @tested
  */
  function mapTable(mapper, tableArray) {
    var newTable = {}
    
    for (var key in mapper) {
      newTable[key] = getValue(mapper[key], tableArray)
    }
    
    return newTable
    
    function getValue(keyword, table) {
      var keys = Object.keys(table)
      var re = new RegExp(keyword, 'i')
      for (var i=0; i<keys.length; i++) {
        var key = keys[i]
        if (re.test(key)) {
          return table[key]
        }
      }
      return ''
    }
  }
  
  function stripHtmlTag(html) {
    var rex = /<[^>]+?>/ig
    return html.replace(rex, '').trim()
  }
  
  function jsform2Table(bizplan) {    
    var description = bizplan.getDescription()
    
    var match = /(<table [\s\S]+?<\/table>)/i.exec(description)
    if (!match) return false

    var tableHtml = match[1]   
    
    var RE = /<tr><th>([\s\S]*?)<\/th><td>([\s\S]*?)<\/td><\/tr>/gi
    var tableArray = {}
    while (match=RE.exec(tableHtml)) {
      var header = stripHtmlTag(match[1])
      var description = stripHtmlTag(match[2])
      
      tableArray[header] = description
    }
    
    bizplan.setDescription(tableHtml)    
    bizplan.table = tableArray
    
    return true
  }
  
  
  function jsformTable2Bizplan(bizplan) {
    var startup = {
      deliverTo: '联系哪位合伙人'
      , name: '产品叫什么'
      , description: '一句话'
      , problem: '痛点'
      , team: '团队'
      , slogan: '名言'
      , willing: '投入'
      , money: '融多少钱'
      , keyword: '关键词'
      , file: '文件'
      , need: '帮助'
      , refer: '哪里找到我们'
      , founder: '姓名'
      , sex: '性别'
      , email: 'Email'
      , mobile: '手机'
      , wechat: '微信'
      , birthday: '生日'
      , zodiac: '星座'
      , company: '公司'
      , web: '网址'
      , address: '地址'
      , ex: '扩展属性'
    }
    
    startup = mapTable(startup, bizplan.table)
    
    match = /mailto:([^@]+?@[^@]+?)['"]/.exec(startup.email)
    if (match) startup.email = match[1]
    
    match = /<strong>([\s\S]+)<\/strong>/ig.exec(startup.address)
    if (match) startup.address = match[1].replace(/<[^>]+>/g, '')
    
    match = />(http[\s\S]+?)</.exec(startup.web)
    if (match) startup.web = match[1]
    
    //    Object.keys(startup).forEach(function (k) {
    //      log(log.DEBUG, k + '=' + startup[k])
    //    })
    
//    req.bizplan = new Bizplan({
//      setFrom: startup.founder + '<' + startup.email + '>'
//      , setTo: 'bp@pre-angel.com'
//      , setSubject: startup.name
//      , setDescription: req.tableHtml
//      
//      , setLocation: startup.address
//      , setCompany: startup.company
//      
//      , setFounderName: startup.founder
//      , setFounderEmail: startup.email
//      , setFounderMobile: startup.mobile
//    })

    bizplan.setFromName(startup.founder)
    bizplan.setFromEmail(startup.email)
    bizplan.setTo('bp@pre-angel.com')
    bizplan.setSubject(startup.name)

    bizplan.setCompany(startup.company)
    bizplan.setFounderName(startup.founder)
    bizplan.setFounderMobile(startup.mobile)
    bizplan.setWeb(startup.web)
    bizplan.setLocation(startup.address) 
    
    
    if (!bizplan.getFromEmail()) {
      return false
    }
    return true
  }

  
  function mikecrm2Table(bizplan) {
    var match = /(<table><tbody>[\s\S]+<\/tbody><\/table>)/i.exec(bizplan.getDescription())    
    if (!match) return false
    
    var tableHtml = match[1].replace(/<wbr>/ig, '')
    
    var RE = /([^<>]+?)<\/p><\/td><\/tr><tr [^>]+>[\s\S]*?<div [^>]+>([\s\S]+?)<\/div><\/td><\/tr><\/tbody><\/table>/gi
    var tableArray = {}
    while (match=RE.exec(tableHtml)) {
      var header = stripHtmlTag(match[1])
      var description = stripHtmlTag(match[2])
      //      Logger.log(header + ':' + description)
      tableArray[header] = description
    }
    
    bizplan.table = tableArray
    bizplan.setDescription(tableHtml)
//    req.table = tableArray
//    req.tableHtml = tableHtml

    return true
  }
  
  function mikecrmTable2Bizplan(bizplan) {
    var apply = {
      name: '姓名'
      , email: 'Email'
      , company: '公司'
    }
    
    apply = mapTable(apply, bizplan.table)
    
    match = /mailto:([^@]+?@[^@]+?)['"]/.exec(apply.email)
    if (match) apply.email = match[1]

    bizplan.setFromName(apply.name)
    bizplan.setFromEmail(apply.email)
    bizplan.setCompany(apply.company)

    return true
  }

  /**
  *
  * conversation off(false) mode: use req.getMessage instead of req.getThread
  *
  */
  function intviu2Table(bizplan) {
//    Logger.log(bizplan.getDescription())
    
    var match = /(<table align="center"[\s\S]+?intviu.cn[\s\S]+?<\/table>)/i.exec(bizplan.getDescription())
    if (!match) return false

    var tableHtml = match[1]
    //    Logger.log(tableHtml) // XXX
    
    //    <tr>
    //      <td bgcolor="#f8f8f8" style="color:#666666">面试名称：</td>
    //      <td bgcolor="#f8f8f8" style="color:#333333"><b>PreAngel申请项目视频介绍</b></td>
    //    </tr>
    
    var RE = /<tr>[\s\S]*?<td bgcolor="#f8f8f8" style="color:#666666">([\s\S]+?)<\/td>[\s\S]*?<td bgcolor="#f8f8f8" style="color:#333333">([\s\S]+?)<\/td>[\s\S]*?<\/tr>/gi
    var tableArray = {}
    while (match=RE.exec(tableHtml)) {
      var header = stripHtmlTag(match[1])
      var description = stripHtmlTag(match[2])
      //    Logger.log(header) //XXX  
      tableArray[header] = description
    }
    //Logger.log(JSON.stringify(tableArray))//XXX
//    req.table = tableArray
//    req.tableHtml = tableHtml
    
    bizplan.table = tableArray
    bizplan.setDescription(tableHtml)
    
    return true
  }
  
  function intviuTable2Bizplan(bizplan) {
    var interview = {
      name: '面试者'
      , mobile: '手机'
      , email: '邮箱'
      , company: '面试名称' // for ticket subject
    }
    
    interview = mapTable(interview, bizplan.table)
    
    match = /mailto:([^@]+?@[^@]+?)['"]/.exec(interview.email)
    if (match) interview.email = match[1]
    //    Logger.log(JSON.stringify(req.table)) // XXX
    //    Logger.log(JSON.stringify(interview)) // XXX
    
    bizplan.setFromName     (interview.name)
    bizplan.setFromEmail    (interview.email)
    bizplan.setCompany      (interview.company)
    bizplan.setFounderMobile(interview.mobile)
    
    return true
  }

}())
