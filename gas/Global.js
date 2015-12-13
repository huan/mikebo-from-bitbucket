if ((typeof GasLog)==='undefined') { // GasL Initialization. (only if not initialized yet.)
  eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/zixia/gasl/master/src/gas-log-lib.js').getContentText())
} // Class GasLog is ready for use now!

var sheetPrinter = new GasLog.Printer.Spreadsheet({
  spreadsheet: SpreadsheetApp.getActiveSpreadsheet()
  , sheetName: 'Logs'
  , clear: false
  , scroll: 'UP'
})

var log = new GasLog({
  ident: 'MikeBo'
  , priority: 'INFO'
  , printer: sheetPrinter
})

//log(log.INFO, 'Hello, %s!', 'Spreadsheet')