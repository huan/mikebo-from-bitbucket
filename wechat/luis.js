const {BotBuilder, log} = require('./requires')
const IntentAction = require('./luis-intent-action')

///////////////////////////////////////////////////////////////////////////////
/**
 * Luis
 *
 * PreView mode not support(yet) 2016/6/2
 */
const model = 'https://api.projectoxford.ai/luis/v1/application?id=0beeb037-b92a-4142-9ead-d6fd952da39e&subscription-key=2bc35bd5cc7f42e0839dd8400aafcd08'
const luis = new BotBuilder.LuisDialog(model)
.onDefault(IntentAction.Default)
.on('None'              , IntentAction.None)
.on('BizPlan.New'       , IntentAction.BizPlanNew)
.on('BizPlan.Sent'      , IntentAction.BizPlanSent)
.on('Greeting.Chat'     , IntentAction.GreetingChat)
.on('Greeting.Holiday'  , IntentAction.GreetingHoliday)
.on('Thank'             , IntentAction.Thank)
.on('Bye'               , IntentAction.Bye)
.on('error'     , e => log.error('Luis', e))

module.exports = luis