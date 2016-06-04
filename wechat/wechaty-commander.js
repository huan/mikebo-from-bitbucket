const log = require('npmlog')
const util = require('util')
const exec = require('child_process').exec

const COMMAND_LIST = {
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
    return Promise.resolve(false)
  }
  , status: function() {
    const status = util.inspect(process.memoryUsage()) + '\n'

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
}

function commander(message) {
  log.silly('Commander', 'start')
  const from    = message.get('from')
  const to      = message.get('to')
  const content = message.get('content')

  if (!valid(from, to, content)) {
    log.silly('Commander', 'validate negetive cmd. skipped')
    return false
  }
  log.verbose('Commander', `CMD %s found. To Be Executed...`, content)

  let [cmd, ...args] = content.split(/\s+/)
  cmd = cmd.replace(/^\//, '') // strip the first '/' char for cmd
  log.verbose('Middleware', `CMD %s(%s)`, cmd, args.join(','))

  if (cmd in COMMAND_LIST) {
    COMMAND_LIST[cmd].apply(this, args)
    .then(reply => {
      session.send(reply)
    })
    .catch(e => {
      session.send(e)
    })
  } else {
    session.send('what?')
  }

  return

  /////////////////////////////////////////////////////

  function valid(from, to, text) {
    if (!/^\//.test(text)) { // 1、必须以 "/" 开头；
      return false
    } else if (!/^filehelper$/i.test(to)) { // 2、必须发给 filehelper
      return false
    }
    // 9、pass all validations
    return true
  }
}

module.exports = commander