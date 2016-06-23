const util = require('util')
const exec = require('child_process').exec

// const EventEmitter = require('events')
const {Wechaty, log} = require('./requires')

/**
 *
 *
 */
class Commander {
  constructor(wechaty) {
    if (!wechaty) {
      log.warn('Commander', 'no wechaty')
    }

    this.wechaty = wechaty
    this.init()
  }

  completer(line) {
    var completions = Object.keys(this.commands).map(c =>　'.' + c)
    var hits = completions.filter((c) => { return c.indexOf(line) == 0 })
    // show all completions if none found
    return [hits.length ? hits : completions, line]
  }

  init() {
    // each command should be a function that return promise
    this.commands = {
      help:     function() {
        return Promise.resolve(`
Wechaty Commander(TAB for auto-complete)
commands start with a dot(.)
use tab to auto-complete commands
        `)
      }
      , set:      function(key, value) { return Promise.resolve(`${key} = ${value}`) }

      , ding:     function() {
        if (!this.wechaty) {
          return Promise.reject(new Error('no wechaty'))
        }
        return this.wechaty.ding()
      }
      , logout:   function() {
        if (!this.wechaty) {
          return Promise.reject(new Error('no wechaty'))
        }
        return this.wechaty.logout()
      }
      , login: function() {
        if (!this.wechaty) {
          return Promise.reject(new Error('no wechaty'))
        }
        return this.wechaty.init()
      }
      , exit:     function() { process.exit(0) }
      , restart:  function() {
        if (this.wechaty.puppet && this.wechaty.puppet.browser) {
          return Promise.resolve(this.wechaty.puppet.browser.dead('restart required by Commander'))
        } else {
          return Promise.reject(new Error('cant restart coz no browser'))
        }
      }

      , status:   status
      , dump:     dump
      , search:   search
      , send:     send
      , beval:    beval // Browser Eval
      , seval:    seval // Server Eval
      , t: test
    }
  }

  execute(cmd, args) {
    log.silly('Commander', 'execute(%s)', cmd, args.join(','))

    if (cmd in this.commands) {
      return this.commands[cmd].apply(this, args)
    } else {
      log.verbose('Commander', 'cmd[%s] not existing(yet)', cmd)
      return Promise.reject(new Error('Commander: unknown command: ' + cmd))
    }
  }

  valid(from, to, text, room) {
    // log.silly('Commander', 'valid(%s, %s, %s, %s)', from, to, text, room)

    const retObj = {
      cmd: false
      , args: null
    }

    if (to !== 'filehelper') {  // 1、必须发给 filehelper
      return retObj
    }

    if (text[0] !== '.') {         // 2、必须以 "." 开头；
      return retObj
    }

    let [cmd, ...args] = text.split(/\s+/)
    cmd = cmd.replace(/^\./, '') // strip the first '.' char for cmd

    retObj.cmd  = cmd
    retObj.args = args

    return retObj
  }
}


/*


Object.keys(window._chatContent)
.filter(function (k) { return window._chatContent[k].length > 0 })
.map(function (k) { return window._chatContent[k].map(function (v) {return v.MMDigestTime}) })
*/
function search(keyword) {
  if (!this.wechaty.puppet || !this.wechaty.puppet.bridge) {
    return Promise.reject('this.wechaty not ready')
  }

  return this.wechaty.puppet.bridge.execute(bsFunc, keyword)
  .then(list => {
    return list.map(c => c.NickName + '(' + c.Alias + ')' + c.UserName)
    .reduce((v1, v2) => v1 + '\r\n' + v2, '')
  })

  function bsFunc(keyword) { // browser side function
    if (typeof Wechaty === 'undefined') {
      return 'Wechaty not ready, please retry later.'
    }
    Wechaty.log('bsFunc(' + keyword + ')')
    var allContacts = Wechaty.glue.contactFactory.getAllContacts()
    var regex = new RegExp(keyword, 'i')
    return Object.keys(allContacts).filter(function(UserName) {
      var contact = allContacts[UserName]
      var desc = Object.keys(contact)
      .map(function (k) { return contact[k] })
      .reduce(function (v1, v2) { return v1 + ' ' + v2 }, '')
      return regex.test(desc)
    })
    .map(function(UserName) {
      var c = allContacts[UserName]
      return {NickName: c.NickName, Alias: c.Alias, UserName: c.UserName}
    })
  }
}
function dump(nickOrAlias) {
  if (!this.wechaty.puppet || !this.wechaty.puppet.bridge) {
    return Promise.reject('this.wechaty not ready')
  }

  return this.wechaty.puppet.bridge.execute(bsFunc, nickOrAlias)
  .then(list => {
    if (list.length > 3) {
      list = list.slice(0,3)
    }
    return list.map(contact => Object.keys(contact).map(k => k + ':' + contact[k]).join('\r\n'))
    .reduce((v1, v2) => v1 + '\r\n\r\n##############\r\n\r\n' + v2, '')
  })

  function bsFunc(keyword) { // browser side function
    if (typeof Wechaty === 'undefined') {
      return 'Wechaty not ready, please retry later.'
    }
    Wechaty.log('bsFunc(' + keyword + ')')
    var allContacts = Wechaty.glue.contactFactory.getAllContacts()
    var regex = new RegExp(keyword, 'i')
    return Object.keys(allContacts).filter(function(UserName) {
      var contact = allContacts[UserName]
      var desc = contact.NickName + ' ' + contact.Alias + ' ' + contact.UserName
      return regex.test(desc)
    })
    .map(function(UserName) {
      var contact = allContacts[UserName]
      var c = {}
      Object.keys(contact).forEach(function (k) {
        if (typeof contact[k] === 'function') {
          return
        } else if (!contact[k]) {
          return
        } else {
          c[k] = contact[k]
        }
      })
      return c
    })
  }
}

function test(value) {
  if (!this.wechaty.puppet || !this.wechaty.puppet.bridge) {
    return Promise.reject('this.wechaty not ready')
  }

  return this.wechaty.puppet.bridge.execute(bsFunc, value)
  .then(list => {
    return list.map(contact => Object.keys(contact).map(k => k + ':' + contact[k]).join(', '))
    .reduce((v1, v2) => v1 + '\r\n' + v2, '')
  })

  function bsFunc(keyword) { // browser side function
    if (typeof Wechaty === 'undefined') {
      return 'Wechaty not ready, please retry later.'
    }
    Wechaty.log('bsFunc(' + keyword + ')')
    var allContacts = Wechaty.glue.contactFactory.getAllContacts()
    var regex = new RegExp(keyword, 'i')
    return Object.keys(allContacts).filter(function(UserName) {
      var contact = allContacts[UserName]
      var desc = Object.keys(contact)
      .map(function (k) { return contact[k] })
      .reduce(function (v1, v2) { return v1 + ' ' + v2 }, '')
      return regex.test(desc)
    })
    .map(function(UserName) {
      var c = allContacts[UserName]
      return {NickName: c.NickName, Alias: c.Alias}
    })
  }
}

function status() {
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

function send(to, msg) {

  return this.wechaty.puppet.bridge.send(to ,msg)
  .then(() => {
    return 'msg sent to ' + to
  })
}

function seval(... scripts) {
  const script = scripts.join(' ')
  log.verbose('Commander', 'server eval: "%s"', script)

  let result
  try {
    result = eval(script)
  } catch (e) {
    result = e.message
  }
  return Promise.resolve(result)
}

function beval(...scripts) {
  const script = 'return ' + scripts.join(' ') // add `return` for webdriver
  log.verbose('Commander', 'beval() browser eval: "%s"', script)

  if (!this.wechaty || !this.wechaty.puppet || !this.wechaty.puppet.bridge) {
    log.warn('Commander', 'beval() bridge not exist')
    return Promise.reject(new Error('bridge not exist'))
  }
  return this.wechaty.puppet.bridge.execute(script)
}
module.exports = Commander.default = Commander.Commander = Commander