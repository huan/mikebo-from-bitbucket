var GasContact = (function() {
  'use strict'

  var CONTACT_SHEET_NAME = 'Contacts'
  
  var EMAILS = []
  
  var GasContact = function () {
    return {
      isMyContact: isMyContact
    }
  }
  
  GasContact.reloadContacts = reloadContacts
  GasContact.getEmailName = getEmailName
  GasContact.getEmailAddress = getEmailAddress
  
  // for test
  GasContact.binary = binary
  
  return GasContact
  
  
  /////////////////////////////////////////
  
  
  function isMyContact(email) {
    
    email = getEmailAddress(email)
    
    if (!email) return false
  
    if (!EMAILS.length) {
      sheet = getSheet(CONTACT_SHEET_NAME)
    
      var lastRow = sheet.getLastRow();
      var emailRange = sheet.getRange(1,1,lastRow,1)
    
      values = emailRange.getValues()
    
      for (var i=0; i<values.length; i++) {
        EMAILS.push(values[i][0])
      }
      
      EMAILS = EMAILS.sort()
    }
    
//    for (var i=0; i<EMAILS.length; i++) {
////      if (i<5000 && i>4990) {
////        log(EMAILS[i])
////      }
//      
//      if (EMAILS[i] == email) {
//        return true
//      }
//    }

    var index = binary(EMAILS, email)
    
    return index != -1
  }
  
  function binary(list, value)
  {
    var left = 0, right = list.length - 1, mid = 0
    mid = Math.floor((left + right) / 2)
    while( left < right && list[mid] != value )
    {
//      Logger.log('left:'+left+', right:'+right+', mid:'+mid)
      if (list[mid] < value ) {
        left = mid + 1
      } else if( list[mid] > value ) {
        right = mid - 1;
      }
      mid = Math.floor((left + right) / 2)
    }
    if( list[mid] == value )
      return mid
      
    return -1
  }
  
  /**
  *
  * get all contacts from google, then save emails to a sheet cache.
  * run weekly is enough.
  *
  */
  function reloadContacts() {
    
    /**
    *
    * 1. Load contacts from google contact. (very slow, for minutes.)
    *
    */
    log(log.DEBUG, 'Start loading contacts...')
    
    //  var contacts = ContactsApp.getContacts()
    var contacts = ContactsApp
    .getContactGroup('System Group: My Contacts')
    .getContacts()
    
    log(log.DEBUG, 'Contacts loaded.')
    
    /**
    *
    * 2. Translate google contacts to a ranged array
    *
    */
    var values = new Array()
    
    contacts.forEach(function(c) {
      emails = c.getEmails()
      
      if (!emails.length) return
      
      emails.forEach(function(e) {
        values.push([e.getAddress()])
      })
        })
    log(log.DEBUG, 'Email address loaded.')
    
    /**
    *
    * 3. Save emails to a sheet, for fast load in the furture use
    *
    */
    contactSheet = getSheet(CONTACT_SHEET_NAME)
    contactSheet.clear()
    
    var range = contactSheet.getRange(1,1, values.length, 1)
    
    range.setValues(values)
    
    var remainingDailyQuota = MailApp.getRemainingDailyQuota()
    
    log(log.INFO, 'Sheet for contacts set: Total contact: %s , email: %s , quota left: %s .', contacts.length, values.length, remainingDailyQuota)
    
  }
  
  
  /**
  *
  * @param String emailString "Zhuohuan LI" <zixia@zixia.net>
  *
  * @return String|null zixia@zixia.net
  *
  */
  function getEmailAddress(emailString) {
    
    if (/,/.test(emailString)) {
      return emailString.split(/,/).map(function (e) {
        return getEmailAddress(e)
      })
    }
    
    var RE = /[^<\s]+@[^>\s]+/
    var email = RE.exec(emailString)
    
    return email ? 
      email[0] : null
  }
  
  function getEmailName(emailString) {
    
    if (/,/.test(emailString)) {
      return emailString.split(/,/).map(function (e) {
        return getEmailName(e)
      })
    }
    
    var name = emailString
    .replace(/[^<\s]+@[^>\s]+/, '')
    .replace(/[<>]/g, '')
    .replace(/"/g, '')
    .replace(/^\s*/, '')
    .replace(/\s*$/, '')
    
    if (/@/.test(name)) {
      name = name.replace(/@.+$/, '')
    }
    
    return name ?
      name : emailString
  }

}())