const log = require('npmlog')

const Middleware = {
  commandController: function(session, next) {
    const userData = session.userData
    const text = session.message.text

    if (!/^\//.test(text)) {
      return next()
    }

    log.verbose('Middleware', `CMD ${text} found. To Be Executed...`)
    let [cmd, key, value] = text.split(/\s+/)
    log.verbose('Middleware', `${cmd} : ${key} -> ${value}`)

    switch (true) {
      case /\/set/i.test(cmd):
        if (!key) {
          session.send('need key')
          break
        }
        if (!value) {
          value = true
        }
        dialogMessage.from[key] = value
        session.send(`set msg from[${key}] to ${value}`)
        break
      default:
        session.send(`${cmd} not supported yet`)
        break
    }
  }
  , firstRun: function(session, next) {
      if (!session.userData.firstRun) {
          session.userData.firstRun = true
          session.beginDialog('/firstrun')
      } else {
          next()
      }
  }
}

module.exports = Middleware