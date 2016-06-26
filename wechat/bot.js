/**
 *
 * Mikey - Wechaty bot for Mike BO
 *
 */
const util = require('util')
const co  = require('co')
const EventEmitter = require('events')

// const Commander = require('./commander')
const Mikey     = require('./mikey')
const Starter   = require('./starter')

const {Wechaty, log} = require('./requires')

const luis    = require('./luis')
const textbot = require('./textbot')
const {wechaty, commander} = require('./wechaty')

console.log('\nMike@Wechat Loading...\n')


// Starter.telnet(new Commander() , { port: 8082, name: 'Telnet Commander' })

Starter.wechaty(textbot)

// Starter.socket(textbot   , { port: 8081, name: 'Socket Chatter' })
Starter.socket(commander , { port: 8082, name: 'Socket Commander' })

Starter.cli(textbot, {name: 'Cli'})

console.log('started')