'use strict'

function moveFromInboxToBeDeleted() {
  
  var LABEL_TOBEDELETED = 'ToBeDeleted'
  var LABEL_MIKEBO = 'Mike/MikeBo'
  
  var QUERY_PATTERN = 'is:inbox is:unread NOT label:ToBeDeleted '
  + ' ' 
  + 'NOT (zixia OR lizh OR lizhuohuan OR lzhuohuan OR zhuohuan OR 卓桓 OR 李兄 OR 李卓桓 OR 卓恒 OR 李卓恒 OR 李总 OR 李老师 OR 李先生 OR abu OR 阿布 OR bruce OR ceibsmobi.com OR akamobi.com)'
  + ' '
  + 'NOT (wufoo.com)'
  
  Logger.log(QUERY_PATTERN)
  // search for mails
  var threads = GmailApp.search(QUERY_PATTERN, 0, 9)
  
  if (threads.length <= 0) {
    log(LOG_DEBUG, 'InboxCleaner: No new matched mail by search')
    return
  }
  
  // get gmail labels
  var labelToBeDeleted = GmailApp.getUserLabelByName(LABEL_TOBEDELETED)
  var labelMikeBo = GmailApp.getUserLabelByName(LABEL_MIKEBO)

  var numBp = 0
 
  Logger.log(threads.length)
  Logger.log(threads[0].getMessages()[0].getFrom())
  // I'll do it myself: dont clean mail from my contacts.
  threads = threads.filter(function (t) { return !isMyContact(t.getMessages()[0].getFrom()) }) 
//  Logger.log(threads.length)
  
  // find & process bp from mails
  for (var i=0; i<threads.length; i++) {
    var thread = threads[i]
    
    // All mails had processed by mike tag MikeBo label.
    thread.addLabel(labelMikeBo) 
    
    /**
    *
    * send email to sender, provide submit form url and suggestions
    *
    */
    var to = thread.getMessages()[0].getTo()
    var isReplied = false
    if (/bp@pre/i.test(to)) {
      replySubmitGuide_(thread.getMessages()[0])
      isReplied = true
    }
    
    thread.addLabel(labelToBeDeleted)    
    thread.moveToArchive()
    
    log(LOG_INFO
        , 'InboxCleaner%s: %s from %s to %s.'
        , isReplied ? '(replied)' : ''
        , thread.getFirstMessageSubject()
        , thread.getMessages()[0].getFrom()
        , thread.getMessages()[0].getTo()
       )
  }     
  
  log(LOG_DEBUG
      , 'InboxSkipper: move %s to ToBeDeleted.'
      , Math.floor(threads.length)
     )
}

/**************************************************************************
*
* Helper 2 - Reply BP
*
*/
function replySubmitGuide_(message) {

//  log(LOG_INFO, 'reply submit guide')
  
  var from = message.getFrom()
  var name = getEmailName(from)

/*  
  var plainForwardBody = name + '，你好！\n'
  + '\n'
  + '感谢你投递项目给PreAngel。\n'
  + '\n'
  + '如果你希望自己的项目可以更快速的被我们处理，那么请你前往 '
  + ' http://preangel.wufoo.com/forms/preangelaeeeceaeae/ 进行信息登记（推荐人栏请尽量填写，因为很重要。自荐可填“PABP”）。'
  + '因为我们每天会收到大量格式不统一的商业计划书，登记过的项目我们将能够优先进行处理。\n'
  + '\n'
  + 'PreAngel是专注于移动互联网创业项目的天使投资机构，核心价值是提供“职业联合创始人”服务。'
  + '它借助自身在移动互联网产业领域的深刻的认识和资源积累，投资与早期创业团队并且帮助他们成长。\n'
  + '\n'
  + '在等待回复的同时，你可以通过关注我们的微信公号和微博PreAngel（搜索“PreAngel”可见认证帐号），来了解我们的投资风格和动态。我们非常期待未来可以有机会和你合作。\n'
  + '\n'
  + '\n'
  + '顺颂创祺！\n'
  + '\n'
  + '李卓桓\n'
  + 'PreAngel合伙人\n'
  + '--\n'
  + 'www.Pre-Angel.com - 职业联合创始人服务\n'
  + '微信公号：PreAngel_wx | 微博：www.weibo.com/PreAngel\n'
  + '\n'
  + '\n'
  
  var htmlForwardBody = plainForwardBody
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
*/

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