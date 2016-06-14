/**
 *
 * Mikey - Wechaty bot for Mike BO
 *
 */
const util = require('util')
const co  = require('co')
const EventEmitter = require('events')

const Commander = require('./commander')
const Mikey     = require('./mikey')
const Starter   = require('./starter')

const {Wechaty, log} = require('./requires')

const luis    = require('./luis')
const wechaty = require('./wechaty')

const textbot = require('./textbot')

console.log('\nMike@Wechat Loading...\n')






///////////////////////////////////////////////////////////////////////////////

// startTelnet(new Commander() , { port: 8082, name: 'Telnet Commander' })


Starter.wechaty.call(wechaty, {
  brain:     textbot
  , mouth:   wechaty
})

Starter.cli(textbot, {name: 'Cli'})
Starter.socket(new Commander() , { port: 8082, name: 'Socket Commander' })
Starter.socket(textbot         , { port: 8081, name: 'Socket Chatter' })

console.log('started')