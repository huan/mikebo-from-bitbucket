const util = require('util')
const exec = require('child_process').exec

const {log} = require('./requires')

/**
 *
 *
 */
class Commander {
  constructor(options) {
    options = options = {}
    this.wechaty = options.wechaty
    this.init()
  }

  init() {
    // each command should be a function that return promise
    this.commands = {
      help:     function() {
        return Promise.resolve(`
          help - this message
          ding - expect to got dong
          status - get wechaty current status
          set -
        `)
      }
      , ding:     function() {
        return Promise.resolve('dong')
      }
      , set:    function(key, value) {
        return Promise.resolve(`${key} = ${value}`)
      }
      , status: function() {
        let status = util.inspect(process.memoryUsage()) + '\n'

        return new Promise((resolve, reject) => {
          exec("ps -eo rss,args | grep phantomjs | grep -v grep | awk '{print $1}'", (error, stdout, stderr) => {
            if (error) {
              return reject(error)
            }
            status += 'phantomjs memory size: ' + Math.floor(stdout/1024) + 'MB'
            resolve(status)
          })
        })
      }
      , logout: function() {
        return this.wechaty.logout()
      }
      , quit: function() {
        return this.wechaty.quit()
      }
      , exit: function() {
        process.exit(-1)
      }
    }
  }

  order(from, to, text, room) {
    log.silly('Commander', 'start')
    if (!this.valid(from, to, text)) {
      return Promise.reject('Commander is not on duty for "' + text + '"')
    }

    log.verbose('Commander', `CMD %s found. To Be Executed...`, text)
    let [cmd, ...args] = text.split(/\s+/)
    cmd = cmd.replace(/^\//, '') // strip the first '/' char for cmd
    log.verbose('Commander', `CMD %s(%s)`, cmd, args.join(','))

    if (cmd in this.commands) {
      return this.commands[cmd].apply(this, args)
    }
    return Promise.reject('Commander: unknown command: ' + cmd)
  }

  valid(from, to, text, room) {
    log.verbose('Commander', 'valid(%s, %s, %s, %s)', from, to, text, room)

    if (!/^\//.test(text)) { // 1、必须以 "/" 开头；
      return false
    } else if (!/^filehelper$/i.test(to)) { // 2、必须发给 filehelper
      return false
    }
    return true
  }
}

module.exports = Commander.default = Commander.Commander = Commander