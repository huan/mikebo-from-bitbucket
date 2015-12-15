'use strict'

function moveFromInboxToBeDeleted() {
  
  var LABEL_TOBEDELETED = 'ToBeDeleted'
  var LABEL_MIKEBO = 'Mike/MikeBo'
  
  var QUERY_PATTERN = 'is:inbox is:unread NOT label:ToBeDeleted '
  + ' ' 
  + 'NOT (zixia OR lizh OR lizhuohuan OR lzhuohuan OR zhuohuan OR 卓桓 OR 李兄 OR 李卓桓 OR 卓恒 OR 李卓恒 OR 李总 OR 李老师 OR 李先生 OR abu OR 阿布 OR bruce OR ceibsmobi.com OR akamobi.com)'
  + ' '
  + 'NOT (wufoo.com)'
  
  log(log.DEBUG, QUERY_PATTERN)
  
  // search for mails
  var threads = GmailApp.search(QUERY_PATTERN, 0, 9)
  
  if (threads.length <= 0) {
    log(log.DEBUG, 'InboxCleaner: No new matched mail by search')
    return
  }
  
  // get gmail labels
  var labelToBeDeleted = GmailApp.getUserLabelByName(LABEL_TOBEDELETED)
  var labelMikeBo = GmailApp.getUserLabelByName(LABEL_MIKEBO)

  var numBp = 0
 
//  log(log.DEBUG, threads.length)
//  log(log.DEBUG, threads[0].getMessages()[0].getFrom())

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
    var from = thread.getMessages()[0].getFrom()

    var isReplied = false
    if (/bp@pre/i.test(to) && !isMyContact(from)) {
      replySubmitGuide_(thread.getMessages()[0])
      isReplied = true
    }
    
    thread.addLabel(labelToBeDeleted)    
    thread.moveToArchive()
    
    log(log.INFO
        , 'InboxCleaner%s: %s from %s to %s.'
        , isReplied ? '(replied)' : ''
        , thread.getFirstMessageSubject()
        , thread.getMessages()[0].getFrom()
        , thread.getMessages()[0].getTo()
       )
  }     
  
  log(log.DEBUG
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

//  log(log.INFO, 'reply submit guide')
  
  var from = message.getFrom()
  var name = getEmailName(from)

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