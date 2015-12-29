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
    })
    
    test('GasContact', function (t) {
      ///////////////////////////////////////////////////////////////
      var MY_CONTACT_EMAIL = 'zixia@zixia.net'
      var NOT_MY_CONTACT_EMAIL = 'fasdfaas.com.xx'
      var c = new GasContact()
      var isExist = c.isMyContact(MY_CONTACT_EMAIL)
      t.ok(isExist, 'isMyContact return exist')
      
      var isNotExist = (false===c.isMyContact(NOT_MY_CONTACT_EMAIL))
      t.ok(isNotExist, 'isMyContact return not exist')
      
      var FROM = '腾讯企业邮箱 <10000@qq.com>'
      var EXPECTED_EMAIL = '10000@qq.com'
      var email = GasContact.getEmailAddress(FROM)
      t.equal(email, EXPECTED_EMAIL, 'extract email address')
      
      ///////////////////////////////////////////////////////////////
    })
    
    test('GasContact', function (t) {
      var BEIJING_MOBILE = '13911833788'
      var UNKNOWN_MOBILE = '99999999999'
      
      var isBeijing = GasContact.isBeijingMobile(BEIJING_MOBILE)
      t.ok(isBeijing, 'beijing mobile')
      
      var isNotBeijing = !GasContact.isBeijingMobile(UNKNOWN_MOBILE)
      t.ok(isNotBeijing, 'unknown mobile')
    })
  }
}