/**
*
* Logger for MikeBO - zixia 20151031
* This is a Google Apps Script
*
* Author: Zhuohuan LI <zixia@zixia.net>
*
*/

var [LOG_EMERG, LOG_ALERT, LOG_CRIT, LOG_ERR, LOG_WARNING, LOG_NOTICE, LOG_INFO, LOG_DEBUG] = [0,1,2,3,4,5,6,7]

var LOG_SHEET_NAME = 'Logs'

var LOG_LEVEL = LOG_INFO
//LOG_LEVEL = LOG_DEBUG

var logSheet

/**
*
* Log to SpreadSheet
*
* log(level, msg, params...)
* or just log(msg)
*
* Author: Zhuohuan LI <zixia@zixia.net>
*
*/
function log() {

  // make a shiftable array from arguments
  var args = Array.prototype.slice.call(arguments)

  /**
  *
  * determine LOG_LEVEL.
  * if the 1st param is a valid log level(a Integer), then use it as log_level
  * otherwise, set log_level to default(LOG_DEBUG)
  *
  */
  var level = (args[0] % 1 === 0) ? args.shift() : LOG_DEBUG
    
  // no log for lower priority messages then LOG_LEVEL
  if (level > LOG_LEVEL) return
    
  
  if (!logSheet) logSheet = getSheet(LOG_SHEET_NAME)
  
  /**
  *
  * build log string & log
  *
  */
  try {
    var message = Utilities.formatString.apply(null, args)
  } catch (e) {
    
//    logSheet.appendRow([new Date(), e])
    logSheet
    .insertRowBefore(2)
    .getRange(2, 1, 1, 2)
    .setValues([[new Date(), message]])
    
    message = args.join(" ||| ")
    
  }

  //logSheet.appendRow([new Date(), message])

  logSheet
  .insertRowBefore(2)
  .getRange(2, 1, 1, 2)
  .setValues([[new Date(), message]])
}


function clearLog() {
  s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LOG_SHEET_NAME)
 
  s.getRange(2, 1, s.getLastRow(), s.getLastColumn()).clearContent()
}

/**
*
* find a named sheet
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