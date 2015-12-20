function mikeTestRunner() {
  
  if ((typeof GasTap)==='undefined') { // GasT Initialization. (only if not initialized yet.)
    eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/zixia/gast/master/src/gas-tap-lib.js').getContentText())
  } // Class GasTap is ready for use now!

  var test = new GasTap()
  
  
  testGasContact()
  
  
  return
  
  
  ///////////////////////////////////////////////
  
  function testGasContact() {
    test('GasContact', function (t) {
      var LIST = [ 0,1,2,3,4,5,6,7,8,9 ]
      var EXIST_VALUE = 7
      var EXPECTED_EXIST_INDEX = 7
      
      var index = GasContact.binary(LIST, EXIST_VALUE)
      t.equal(index, EXPECTED_EXIST_INDEX, 'binary search for exist value')
      
      var NOEXIST_VALUE=99
      var EXPECTED_NOEXIST_INDEX = -1
      index = GasContact.binary(LIST, NOEXIST_VALUE)
      t.equal(index, EXPECTED_NOEXIST_INDEX, 'binary search for no exist value')
      
      var EXIST_EMAIL = 'zixia@zixia.net'
      var c = new GasContact()
      var ret = c.isMyContact(EXIST_EMAIL)
      t.ok(ret, 'isMyContact success')
    })
  }
}