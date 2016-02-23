var Bizplan = (function () {
  'use strict'
  
  var VERSION = '0.1.0'

  var STATIC_METHODS = {
  }
  
  var Bizplan = function (message) {
    
    if (typeof this == 'undefined' || Object.keys(this).length) { // called instead of 'newed'
      throw Error('must use "new" keyword to Bizplan')
    }
    
    var BP = {
      subject: ''
      , description: ''
      
      , industry: ''
      , location: ''
      
      , pre_valuation: 0
      , funding: 0

      , founder: {
        name: ''
        , email: ''
        , mobile: ''
        , title: ''
        , percentage: 0
      }
      
      , attachments: []
    }
          
        
    var INSTANCE_METHODS = {
        setSubject: setSubject
      , getSubject: getSubject
      
      , setDescription: setDescription
      , getDescription: getDescription
      
      , setIndustry: setIndustry
      , getIndustry: getIndustry
      
      , setLocation: setLocation
      , getLocation: getLocation
      
      , setPreValuation: setPreValuation
      , getPreValuation: getPreValuation
      
      , setFunding: setFunding
      , getFunding: getFunding

      , setFounderName: setFounderName
      , getFounderName: getFounderName
      , setFounderEmail: setFounderEmail
      , getFounderEmail: getFounderEmail

      , addAttachment:  addAttachment
      , getAttachments: getAttachments
    }
    
    var from = message.getReplyTo() || message.getFrom()
    
    var name = GasContact.getEmailName(from)
    var email = GasContact.getEmailAddress(from)

    var attachments = message.getAttachments()    
    
    setSubject(message.getSubject())
    setDescription(message.getBody())
    setFounderName(name)
    setFounderEmail(email)
    
    attachments.forEach(function (a) { addAttachment(a) })
    
    this.zixia = true
    
    // export static method on Instance
    Object.keys(STATIC_METHODS)  .forEach(function (k) { this[k] = STATIC_METHODS[k]   }, this)
    // export instance methods on Instance
    Object.keys(INSTANCE_METHODS).forEach(function (k) { this[k] = INSTANCE_METHODS[k] }, this)
    
    return this
    
    ////////////////////////////////////////////////////
    // 
    // Instance methods
    //
    function setSubject(s) { BP.subject = s }
    function getSubject()  { return BP.subject }
      
    function setDescription(s) { BP.description = s }
    function getDescription()  { return BP.description }
      
    function setIndustry(s) { BP.industry = s }
    function getIndustry()  { return BP.industry }
      
    function setLocation(s) { BP.location = s }
    function getLocation()  { return BP.location }
      
    function setPreValuation(n) { BP.pre_valuation = n }
    function getPreValuation()  { return BP.pre_valuation }
      
    function setFunding(n) { BP.funding = n }
    function getFunding()  { return BP.funding }

    function setFounderName(s) { BP.founder.name = s }
    function getFounderName()  { return BP.founder.name }
    function setFounderEmail(s) { BP.founder.email = s }
    function getFounderEmail()  { return BP.founder.email }

    function addAttachment(a) { BP.attachments.push(a) }
    function getAttachments() { return BP.attachments }
    
    
  }
  
  // export static methods on Class
  Object.keys(STATIC_METHODS).forEach(function (k) { Bizplan[k] = STATIC_METHODS[k] })

  return Bizplan
  
  ////////////////////////////////////////////////////////////////////////////////
  //
  // Static methods
  //
    
  
}())

function testBizplan() {
}