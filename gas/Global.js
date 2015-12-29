/**
*
* 1. Log for GAS
*
*/
if ((typeof GasLog)==='undefined') { // GasL Initialization. (only if not initialized yet.)
  var TTL = 3
  var CODE = undefined
  while (!CODE && TTL--) {
    try {
      CODE = UrlFetchApp.fetch('https://raw.githubusercontent.com/zixia/gasl/master/src/gas-log-lib.js').getContentText()
    } catch (e) {
      Logger.log('UrlFetchApp.fetch exception: ' + e.message)
    }
  }
  if (CODE) {
    eval(CODE)
  } 
} // Class GasLog is ready for use now!

var log = new GasLog({
  ident: 'MikeBo'
  , priority: 'NOTICE'
//  , priority: 'INFO'
//  , priority: 'DEBUG'
  , printer: new GasLog.Printer.Spreadsheet({
    spreadsheet: SpreadsheetApp.getActiveSpreadsheet()
    , sheetName: 'Logs'
    , clear: false
    , scroll: 'UP'
  })
})

//log(log.INFO, 'Hello, %s!', 'Spreadsheet')


/**
*
* 2. find a named sheet
*
*/
function getSheet(name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name)

  // create log sheet if not exist
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(name)
    log(LOG_WARNING, 'Sheet Created for %s', name)
  }

  return sheet
}

/**
*
* 3. Freshdesk API
*
*/
if ((typeof Freshdesk)==='undefined') { // GasFreshdesk Initialization. (only if not initialized yet.)
  var TTL = 3
  var CODE = undefined
  while (!CODE && TTL-->0) {
    try {
      CODE = UrlFetchApp.fetch('https://raw.githubusercontent.com/zixia/gas-freshdesk/master/src/gas-freshdesk-lib.js?2').getContentText()
    } catch (e) {
      log(log.ERR, 'UrlFetchApp.fetch exception: %s', e.message)
    }
  }
  if (CODE) {
    eval(CODE)
  } 
} // Class Freshdesk is ready for use now!


/**
*
* 4. Export Reload Contacts Function
*
*/
function reloadContacts() {
  return GasContact.reloadContacts()
}
