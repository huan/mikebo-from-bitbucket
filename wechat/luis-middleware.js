
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