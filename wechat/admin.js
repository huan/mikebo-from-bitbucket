var net = require('net')

var sock = net.connect(8082)

process.stdin.pipe(sock)
sock.pipe(process.stdout)

sock.on('connect', function () {
  process.stdin.resume();
  process.stdin.setRawMode(true)
})

sock.on('close', function done () {
  process.stdin.isTTY && process.stdin.setRawMode(false)
  // process.stdin.pause()
  sock.removeListener('close', done)
})

process.stdin.on('end', function () {
  sock.end()
  console.log('stdin end')
})

process.stdin.on('data', function (b) {
  if (b.length === 1 && b[0] === 4) {
    process.stdin.emit('end')
  }
})

//////////////////////

// process.stdin.resume();//so the program will not close instantly
/*
function exitHandler(options, err) {
  console.log('exitHandler()')
  process.stdin.setRawMode(false)
  if (options.cleanup) console.log('clean');
  if (err) console.log(err.stack);
  console.log('exit')
  if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
*/
