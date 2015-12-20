function testContact() {
  //  var isKnown = isMyContact('sadfa <zixia@zixia.net>')
  var n = 'yangjinyu@muche365.com <yangjinyu@muche365.com>, yangjinyu2@muche3652.com <yangjinyu2@muche3652.com>'
  
  log(log.INFO, 'isKnown: %s', getEmailName(n)[1])
}

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
    }
    
    for (var i=0; i<EMAILS.length; i++) {
      if (EMAILS[i] == email) {
        return true
      }
    }
    
    return false
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