const util = require('util')
const exec = require('child_process').exec

// const EventEmitter = require('events')
const {Wechaty, log} = require('./requires')
const wechaty = require('./wechaty')

/**
 *
 *
 */
class Commander {
  constructor(options) {
    options = options = {}
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
          help - this message
          ding - expect to got dong
          status - get wechaty current status
          set -
        `)
      }
      , set:      function(key, value) { return Promise.resolve(`${key} = ${value}`) }

      , ding:     function() { return wechaty.ding() }
      , logout:   function() { return wechaty.logout() }
      , quit:     function() { return this.emit('quit') }
      , exit:     function() { process.exit(0) }
      , restart:  function() { return Promise.resolve(wechaty.puppet.browser.dead('restart required by Commander')) }
      , status:   status
      , dump:     dump
      , search:   search
      , send:     send
      , beval:    beval // Browser Eval
      , seval:    seval // Server Eval
      , t: test
    }
  }

  order(from, to, text, room) {
    log.silly('Commander', 'start')
    if (!this.valid(from, to, text)) {
      return Promise.reject('Commander is not on duty for "' + text + '"')
    }

    log.verbose('Commander', `CMD %s found. To Be Executed...`, text)
    let [cmd, ...args] = text.split(/\s+/)
    cmd = cmd.replace(/^\./, '') // strip the first '.' char for cmd
    log.verbose('Commander', `CMD %s(%s)`, cmd, args.join(','))

    if (cmd in this.commands) {
      log.verbose('Commander', 'cmd[%s] existing', cmd)
      return this.commands[cmd].apply(this, args)
    } else {
      log.verbose('Commander', 'cmd[%s] not existing(yet)', cmd)
      return Promise.reject(new Error('Commander: unknown command: ' + cmd))
    }
  }

  valid(from, to, text, room) {
    log.silly('Commander', 'valid(%s, %s, %s, %s)', from, to, text, room)

    if (text[0]=='.') {       // 1、必须以 "." 开头；
      if (to=='filehelper') { // 2、必须发给 filehelper
        return true
      }
    }
    return false
  }
}


/*


Object.keys(window._chatContent)
.filter(function (k) { return window._chatContent[k].length > 0 })
.map(function (k) { return window._chatContent[k].map(function (v) {return v.MMDigestTime}) })
*/
function search(keyword) {
  if (!wechaty.puppet || !wechaty.puppet.bridge) {
    return Promise.reject('wechaty not ready')
  }

  return wechaty.puppet.bridge.execute(bsFunc, keyword)
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
  if (!wechaty.puppet || !wechaty.puppet.bridge) {
    return Promise.reject('wechaty not ready')
  }

  return wechaty.puppet.bridge.execute(bsFunc, nickOrAlias)
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
  if (!wechaty.puppet || !wechaty.puppet.bridge) {
    return Promise.reject('wechaty not ready')
  }

  return wechaty.puppet.bridge.execute(bsFunc, value)
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

  return wechaty.puppet.bridge.send(to ,msg)
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

  if (!wechaty || !wechaty.puppet || !wechaty.puppet.bridge) {
    log.warn('Commander', 'beval() bridge not exist')
    return Promise.reject(new Error('bridge not exist'))
  }
  return wechaty.puppet.bridge.execute(script)
}
module.exports = Commander.default = Commander.Commander = Commander