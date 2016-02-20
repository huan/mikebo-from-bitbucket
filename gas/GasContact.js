var GasContact = (function() {
  'use strict'

  var CONTACT_SHEET_NAME = 'Contacts'
  
  var EMAILS = []
  
  var STATIC_METHODS = {
      reloadContacts:  reloadContacts
    , getEmailName:    getEmailName
    , getEmailAddress: getEmailAddress
    , isBeijingMobile: isBeijingMobile
    , isMyContact:     isMyContact
    
    // for test
    , binary: binary
  }
  
  var GasContact = function () {
    INSTANCE_METHODS = {
    }
    
    var vm = {}
    
    // export static method on Instance
    Object.keys(STATIC_METHODS)  .forEach(function (k) { vm[k] = STATIC_METHODS[k]   })
    // export instance methods on Instance
    Object.keys(INSTANCE_METHODS).forEach(function (k) { vm[k] = INSTANCE_METHODS[k] })
    
    return vm
    
  }

  // export static methods on Class
  Object.keys(STATIC_METHODS).forEach(function (k) { GasContact[k] = STATIC_METHODS[k] })
  
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
        // very important for compare as string!
        var stringValue = values[i][0].toString()
        EMAILS.push(stringValue)
      }
      
      EMAILS = EMAILS.sort()
    }
    
    var index = binary(EMAILS, email)
    
    return index != -1
  }
  
  function binary(list, value)
  {
    /**
    * 
    * very important for compare as string!
    * or we could got NaN , which is much trouble for comparing...
    * https://stackoverflow.com/questions/34388974/
    *
    */
    if ((typeof value)!='string') value = value.toString()
    
    var left = 0, right = list.length - 1, mid = 0
    mid = Math.floor((left + right) / 2)
    while( left < right && list[mid] != value )
    {
      if (list[mid] < value ) {
        left = mid + 1
      } else if( list[mid] > value ) {
        right = mid - 1;
      }
      mid = Math.floor((left + right) / 2)
    }
    if( list[mid] == value ) return mid
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
    
    log(log.NOTICE, 'GasContact reload: contacts: %s , emails: %s , mail quota left: %s .', contacts.length, values.length, remainingDailyQuota)
    
  }
  
  
  /**
  *
  * @param String emailString "Zhuohuan LI" <zixia@zixia.net>
  *
  * @return String|null zixia@zixia.net
  *
  */
  function getEmailAddress(emailString) {
    
    // Array
    if (/,/.test(emailString)) {
      return emailString.split(/,/).map(function (e) {
        return getEmailAddress(e)
      })
    }
    
    var RE = /([^<\s]+@[^>\s]+)>?$/
    var email = RE.exec(emailString)
    
    return email ? 
      email[1] : null
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

  function isBeijingMobile(mobile) {
    
    var SEARCH_URL = 'https://tcc.taobao.com/cc/json/mobile_tel_segment.htm?tel='
    
    var TTL = 3
    var response = undefined
    var retCode = undefined
    
    while (!retCode && TTL--) {
//      Logger.log('while loop ttl:'+TTL)
      try {
        response = UrlFetchApp.fetch(SEARCH_URL + mobile, {
                                     muteHttpExceptions: true
                                     })
        retCode = response.getResponseCode()
      } catch (e) {
        log(log.ERR, 'UrlFetchApp.fetch exception: %s, %s', e.name, e.message)
      }
    }
    
    if (retCode!=200) return false
    
    //    Logger.log(response.getContentText('GBK'))
    return /北京/.test(response.getContentText('GBK'))
  }

}())

function testGasContact() {
  Logger.log(GasContact.getEmailAddress('MD@hguyj.ggradual.xyz Aaron Singleton MD <Aaron.Singleton>'))
}