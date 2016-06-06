/**
 *
 * Wechaty bot Mikey
 *
 * Mike Bo @ Wechat
 *
 * Enjoy!
 *
 * Wechaty - https://github.com/zixia/wechaty
 *
 */
const util = require('util')
const co  = require('co')
const log = require('npmlog')
log.level = 'verbose'
log.level = 'silly'

const EventEmitter2 = require('eventemitter2')

const IntentAction = require('./luis-intent-action')
const Middleware = require('./luis-middleware')
const Waterfall = require('./luis-waterfall')

const Commander = require('./commander')
const Mikey = require('./mikey')

const {Wechaty, BotBuilder} = require('./requires')

///////////////////////////////////////////////////////////////////////////////
/**
 *
 * Luis
 *
 *
 * PreView mode not support(yet) 2016/6/2
 * var model = 'https://api.projectoxford.ai/luis/v1/application/preview?id=a672fa00-adb4-4420-9f83-f6f674a1f438&subscription-key=2bc35bd5cc7f42e0839dd8400aafcd08' *
 *
 */
const model = 'https://api.projectoxford.ai/luis/v1/application?id=a672fa00-adb4-4420-9f83-f6f674a1f438&subscription-key=2bc35bd5cc7f42e0839dd8400aafcd08'
const luis = new BotBuilder.LuisDialog(model)
.onDefault(IntentAction.Default)
.on('None'      , IntentAction.None)
.on('BizPlan'   , IntentAction.BizPlan)
.on('Greeting'  , IntentAction.Greeting)
.on('error'     , e => log.error('Luis', e))

///////////////////////////////////////////////////////////////////////////////
/**
 *
 * Chatbot from M$
 *
 *
 */
const textBot = new BotBuilder.TextBot({minSendDelay: 0})
// .use(Middleware.firstRun)
.add('/', luis)
.add('/firstrun', Waterfall.firstRun)
.add('/getCity'  , Waterfall.getCity)
.add('/getMoney' , Waterfall.getMoney)
.add('/getNumber', Waterfall.getNumber)
.on('error', e => log.error('TextBot', e))

///////////////////////////////////////////////////////////////////////////////
/**
 *
 * Mikey & other staff
 *
 *
 */
function mikeyBrain(talker, listener, utterance, room) {
  return textBot.processMessage({
    text: utterance
    , from: {
      channelId: 'wechat'
      , address: talker
    }
  }) //, (err, reply) => wechatyCallback)
}

function mikeyMouth(talker, listener, utterance, room) {
  return new Wechaty.Message()
  .set('from'   , talker)
  .set('to'     , listener)
  .set('content', utterance)
  .set('room'   , room)
}

// /** Information needed to route a message. */
// export interface IChannelAccount {
//     /** Display friendly name of the user. */
//     name?: string;

//     /** Channel Id that the channelAccount is to be communicated with (Example: GroupMe.) */
//     channelId: string;

//     /** Channel Address for the channelAccount (Example: @thermous.) */
//     address: string;

//     /** Id - global intercom id. */
//     id?: string;

//     /** Is this account id an bot? */
//     isBot?: boolean;
// }

/** A communication message recieved from a User or sent out of band from a Bot. */
// export interface IMessage {
//     /** What kind of message is this. */
//     type?: string;

//     /** Bot.Connector Id for the message (always assigned by transport.) */
//     id?: string;

//     /** Bot.Connector ConverationId id for the conversation (always assigned by transport.) */
//     conversationId?: string;

//     /** Timestamp of when the message was created. */
//     created?: string;

//     /** (if translated) The OriginalText of the message. */
//     sourceText?: string;

//     /** (if translated) The language of the OriginalText of the message. */
//     sourceLanguage?: string;

//     /** The language that the Text is expressed in. */
//     language?: string;

//     /** The text of the message (this will be target language depending on flags and destination.)*/
//     text?: string;

//     /** Array of attachments that can be anything. */
//     attachments?: IAttachment[];

//     /** ChannelIdentity that sent the message. */
//     from?: IChannelAccount;

//     /** ChannelIdentity the message is sent to. */
//     to?: IChannelAccount;

//     /** Account to send replies to (for example, a group account that the message was part of.) */
//     replyTo?: IChannelAccount;

//     /** The message Id that this message is a reply to. */
//     replyToMessageId?: string;

//     /** List of ChannelAccounts in the conversation (NOTE: this is not for delivery means but for information.) */
//     participants?: IChannelAccount[];

//     /** Total participants in the conversation.  2 means 1:1 message. */
//     totalParticipants?: number;

//     /** Array of mentions from the channel context. */
//     mentions?: IMention[];

//     /** Place in user readable format: For example: "Starbucks, 140th Ave NE, Bellevue, WA" */
//     place?: string;

//     /** Channel Message Id. */
//     channelMessageId?: string;

//     /** Channel Conversation Id. */
//     channelConversationId?: string;

//     /** Channel specific properties.  For example: Email channel may pass the Subject field as a property. */
//     channelData?: any;

//     /** Location information (see https://dev.onedrive.com/facets/location_facet.htm) */
//     location?: ILocation;

//     /** Hashtags for the message. */
//     hashtags?: string[];

//     /** Required to modify messages when manually reading from a store. */
//     eTag?: string;
// }

textBot.on('reply', function (reply) {
  const from = reply.from.address
  const to = reply.to.address
  const text = reply.text

  log.info('Luis', `textBot.on(reply), to ${to}:"${text}"`)
  mikeyMouth(from, to, text, null)
})

const mikey = new Mikey({
  brain: mikeyBrain
  , mouth: mikeyMouth
})

const commander = new Commander()

console.log(`
Mike@Wechat Loading...
`)

const wechaty = new Wechaty({head: false})
.on('scan', ({url, code}) => {
  console.log(`Scan QRCode from WeChat to login: ${code}\n${url}`)
})
.on('login'  , user => {
  user.ready()
  .then(u => log.info('Bot', `bot login: ${user.name()}`))
})
.on('logout' , user => log.info('Bot', `bot logout: ${user.name()}`))

wechaty.on('message', onWechatyMessage)

function onWechatyMessage(m) {
  const from = m.get('from')
  const to = m.get('to')
  const room = m.get('room')
  const content = m.get('content')

  if (commander.valid(from, to, content)) {
    commander.do(content)
    .then(reply => {
      wechaty.send(m.reply(reply))
    })
    .catch(e => {
      log.error('onWechatyMessage', e)
      wechaty.send(m.reply(e))
    })
    return
  }

  if (needMikey(m)) {
    mikey.hear(from, content, room)
  }
}

wechaty.init()
.catch(e => {
  log.error('Bot', 'init() fail:' + e)
  wechaty.quit()
  process.exit(-1)
})


function needMikey(message) {
  log.silly('needMikey', 'start')
  if (message.self()) {
    log.silly('needMikey', 'mikey do not process self message(should not to)')
    return false
  }

  const room = message.get('room')
  const from = message.get('from')
  if (room) {  // message in room
    const roomName = Wechaty.Room
    .load(room)
    .get('name')
    // log.silly('Mikey', 'group name %s', r.name())
    if (/Wechaty/i.test(roomName)) {
      return true
    }
  } else {          // not group message
    const isStranger = Wechaty.Contact
    .load(from)
    .get('stranger')

    if (isStranger) {
      // return true
    }
  }
  return false
}

function wechatyCallback(err, reply) {
  if (err) {
    log.error('Luis', 'wechatyCallback err: %s', err)
    return
  }
  log.verbose('Luis', 'wechatyCallback()')
  const message = textBotReply2WechatyMessage(reply)
  return wechaty.send(message)
}



function simpleCli(textBot) {
  const bot = textBot

  const readline = require('readline');
  const rl = readline.createInterface(process.stdin, process.stdout);

  const dialogMessage = {
    text: ''
    , language: 'zh-CHS'
    , from: {
      channelId: 'wechat'
      , address: 'unknown address'
    }
  }


  // bot.processMessage({ text: 'hello', from: { channelId: 'test', address: 'zixia' } }, function (err, reply) {
  //   if (err) {
  //     return console.log('err:' + err)
  //   }
  //   console.log(reply)
  //   return console.log(reply.text)
  // })



  rl.setPrompt('Wechaty> ')
  rl.prompt()


  rl.on('line', (line) => {
    line = line.trim()

    switch(true) {
      case /hello/i.test(line):
      case /world/i.test(line):
        bot.processMessage({
          text: line.trim()
          , language: 'zh-CHS'
          , from: {
            channelId: 'msn'
            , address: 'lizhuohuan'
          }
        })
        break

      default:
        dialogMessage.text = line.trim()

        if (dialogMessage.text) {
          BotBuilder.LuisDialog.recognize('test', luis.serviceUri, (err, intents, entities) => {
            if (err) {
              log.error('Luis', 'recognize error: %s', err)
              return
            }
            log.verbose('Luis', 'recognize intents: %s', util.inspect(intents))
            log.verbose('Luis', 'recognize entities: %s', util.inspect(entities))
          })
          bot.processMessage(dialogMessage)
        }
        break
    }
    rl.prompt();
  }).on('close', () => { // XXX: no session here...
    console.log('Have a great day!')
    process.exit(0)
  })

}
