/**
*
* 1. Log for GAS
*
*/
if ((typeof GasLog)==='undefined') { // GasL Initialization. (only if not initialized yet.)
  eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/zixia/gasl/master/src/gas-log-lib.js').getContentText())
} // Class GasLog is ready for use now!

var log = new GasLog({
  ident: 'MikeBo'
//  , priority: 'INFO'
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
  eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/zixia/gas-freshdesk/master/src/gas-freshdesk-lib.js').getContentText())
} // Class Freshdesk is ready for use now!