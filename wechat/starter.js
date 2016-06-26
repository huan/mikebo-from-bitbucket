const co = require('co')

const Mikey       = require('./mikey')
const {log}       = require('./requires')
const {wechaty} = require('./wechaty')

const Db = require('./mongo')

const Starter = {
  wechaty: startWechaty
  , cli: startCli
  , socket: startSocket
  , telnet: startTelnet
}

function startWechaty(brain) {
  const mikey = new Mikey({
    brain:    brain
    , mouth:  wechaty
  })

  return co(function* () {
    const db = new Db()
    yield db.init()

    wechaty
    .on('message', message => {
      message = db.Message(message)
      // message.save()
      ;[message.from(), message.to(), message.room()].map(c => {
        if (c) {
          c = db.Contact(c)
          // c.save()
        }
      })

      return wechaty.onWechatyMessage({message, mikey, db})
    })
    .init()
    .catch(e => {
      log.error('Bot', 'init() fail:' + e)
      wechaty.quit()
      .then(_ => db.close())
      .then(_ => process.exit(-1))
      .catch(e => console.error('startWechaty() wechaty init exception: ' + e.message))
    })
  }).catch(e => {
    log.error('startWechaty', 'exception: %s', e.message)
    throw e
  })
}

function startCli(brain, options) {
  options = options || {}
  const mikey = new Mikey({
    brain: brain
    , mouth: 'cli'
  })

  const readline = require('readline')
  const rl = readline.createInterface(process.stdin, process.stdout)

  rl.setPrompt(brain.constructor.name + '> ')
  rl.prompt()

  rl.on('line', (line) => {
    const msg = line.trim()
    if (msg) {
      mikey.ear('cli', 'mikey', msg, 'c9')
    }
    rl.prompt()
  }).on('close', () => {
    console.log('Have a great day!')
    process.exit(0)
  })
}

function startSocket(brain, options) {

  const name = options.name || 'Socket Server'
  const port = options.port || 28788

  const net       = require('net')
  const readline  = require('readline')

  var server = net.createServer(function(socket) {
    log.verbose('Bot', `startSocket ${name} got new client`)

    socket
  	.on('error', e => { log.warn('Bot', 'socket client error: %s', e.message) })
  	.write(`${name}\r\n`)

    const rl = readline.createInterface({
      input: socket
      , output: socket
      , terminal: true
      , historySize: 100
      , completer: brain.completer ? brain.completer.bind(brain) : undefined
    })

    rl.setPrompt(name + '> ')
    rl.prompt()

    rl.on('line', (line) => {
      const msg = line.trim()
      if (msg==='.quit') {
        socket.end('Server Disconnected.\n')
        return
      }
      if (msg) {
        mikey.ear('cli', 'mikey', msg, 'c9')
        // .then(() => setTimeout(rl.prompt.bind(rl), 300))
        .then(() => rl.prompt())
      } else {
        rl.prompt()
      }
    }).on('close', () => {
      // socket.write('Have a great day!')
      log.verbose('Bot', `${name} close event received`)
    })

    const mikey = new Mikey({
      brain: brain
      , mouth: socket
    })

  })

  server.listen(port, '0.0.0.0', err => {
    if (err) {
      log.error('Bot', 'listen err: %s', err.message)
      return
    }
    log.info('Bot', `Socket ${name} listening on port %d`, port)
  })
}

function startTelnet(brain, options) {

  const name = options.name || 'Telnet Server'
  const port = options.port || 28788

  const readline  = require('readline')

  var telnet = require('wez-telnet');
  var s = new telnet.Server(function (client) {
    // I am the connection callback
    console.log("connected term=%s %dx%d",
      client.term, client.windowSize[0], client.windowSize[1]);
    log.verbose('Bot', `startTelnet ${name} got new client`)

    client
  // 	.on('error', e => { log.warn('Bot', 'socket client error: %s', e.message) })
  	.write(`Welcome ${name}\r\n`)

    client.on('interrupt', function () {
      console.log("INTR!");
      // disconnect on CTRL-C!
      client.end();
    });
    client.on('close', function () {
      console.log("END!");
    });

    const rl = readline.createInterface({
      input: client
      , output: client
      , terminal: true
      , historySize: 100
      , completer: brain.completer ? brain.completer.bind(brain) : undefined
    })

    rl.setPrompt(name + '> ')
    rl.prompt()

    rl.on('line', (line) => {
      const msg = line.trim()
      if (msg==='.quit') {
        client.end('Server Disconnected.\n')
        return
      }
      if (msg) {
        mikey.ear('cli', 'mikey', msg, 'c9')
        // .then(() => setTimeout(rl.prompt.bind(rl), 0))
        .then(() => rl.prompt())
      } else {
        rl.prompt()
      }
    }).on('close', () => {
      // socket.write('Have a great day!')
      log.verbose('Bot', `${name} close event received`)
      client.end()
    })

    const mikey = new Mikey({
      brain: brain
      , mouth: client
    })
  });
  s.listen(port, '127.0.0.1', err => {
    if (err) {
      log.error('Bot', 'listen err: %s', err.message)
      return
    }
    log.info('Bot', `Socket ${name} listening on port %d`, port)
  })
}

module.exports = Starter