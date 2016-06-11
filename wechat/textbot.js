const {BotBuilder, log} = require('./requires')
const Waterfall   = require('./luis-waterfall')
const Middleware  = require('./luis-middleware')
const luis = require('./luis')
///////////////////////////////////////////////////////////////////////////////
/**
 * Chatbot from M$
 */
const textBot = new BotBuilder.TextBot({minSendDelay: 0})
// .use(Middleware.firstRun)
.add('/', luis)
.add('/firstrun', Waterfall.firstRun)
.add('/getCity'  , Waterfall.getCity)
.add('/getMoney' , Waterfall.getMoney)
.add('/getNumber', Waterfall.getNumber)
.add('/askStartup', Waterfall.askStartup)
.on('error', e => log.error('TextBot', e))

module.exports = textBot