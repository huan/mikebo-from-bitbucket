const log = require('npmlog')
const util = require('util')
const exec = require('child_process').exec

const Middleware = {
  firstRun: function(session, next) {
      if (!session.userData.firstRun) {
          session.userData.firstRun = true
          session.beginDialog('/firstrun')
      } else {
          next()
      }
  }
}

module.exports = Middleware