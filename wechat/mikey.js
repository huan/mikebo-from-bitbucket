const log = require('npmlog')

class Mikey {
  constructor(options) {
    this.brain  = options.brain // function (talker, listener, utterance, room)
    this.mouth  = options.mouth // function (talker, listener, utterance, room)

    if (typeof this.brain!=='function' || typeof this.mouth!=='function') {
      throw Error('brain & mouth need to be a function')
    }
  }

  hear(talker, listener, utterance, room) {
    if (!talker || !listener || !utterance) { throw Error('Mikey.hear() must contains talker/listener/utterance') }
    log.verbose('Mikey', 'hear %s -> %s : "%s" @ [%s]', talker, listener, utterance, room)

    return this.brain(talker, listener, utterance, room)
    .then(reply => {
      return this.mouth(listener, talker, reply, room)
    })
    .catch(e => {
      log.error('Mikey', e)
      throw e
    })
  }
}

module.exports = Mikey.default = Mikey.Mikey = Mikey