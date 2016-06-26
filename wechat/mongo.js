const MongoClient = require('mongodb').MongoClient
      , co        = require('co')
      , {Wechaty, log}     = require('./requires')

class Db {
  constructor() {
    this.dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wechaty'
  }

  init() {
    return co.call(this, function*() {
      this.db = yield MongoClient.connect(this.dbUri)
      this.message = this.db.collection('message')
      this.contact = this.db.collection('contact')
      return this
    }).catch(e => {
      log.error('Db', 'init() exception: %s', e.message)
      throw e
    })
  }

  close() {
    log.verbose('Db', 'close()')
    if (this.db) {
      const ret = this.db.close()
      this.db = null
      return ret
    } else {
      log.error('Db', 'close() without a db')
      return Promise.solve()
    }
  }

  Message(message) {
    if (!(message instanceof Wechaty.Message)) {
      log.error('Db', 'Contact() only work on Contact')
      return null
    } else if (message.save) {
      log.verbose('Db', 'Message() already save-able')
      return message
    }
    log.verbose('Db', 'Message(%s)', message.toStringDigest())

    message.rawObj._id = message.rawObj.MsgId

    const collection = this.message
    const save = function() { // http://stackoverflow.com/a/20472728/1123955
      log.info('Db', 'Message.save(%s)', this.toStringDigest())
      // console.log(this.rawObj)
      this.rawObj.ts = Date.now()
      return collection.save(this.rawObj)
    }
    Object.assign(message, {
      save
    })
    message.save()
    return message
  }

  Contact(contact) {
    if (!(contact instanceof Wechaty.Contact)
        && !(contact instanceof Wechaty.Room)
    ) {
      log.error('Db', 'Contact() only work on Contact')
      return null
    } else if (contact.save) {
      log.verbose('Db', 'Contact(%s) already save-able', contact.name())
      return contact
    }
    log.verbose('Db', 'Contact(%s)', contact.name())

    contact.rawObj._id = contact.rawObj.UserName

    const collection = this.contact
    const save = function() { // http://stackoverflow.com/a/20472728/1123955
      log.verbose('Db', 'Contact.save(%s)', this.name())
      // console.log(this.rawObj)
      this.rawObj.ts = Date.now()
      return collection.save(this.rawObj)
    }
    Object.assign(contact, {
      save
    })
    contact.save()
    return contact
  }

  storeMessage(message) {
    log.verbose('Db', 'storeMessage()')
    if (!message || !message.rawObj) {
      throw new Error('storeMessage() need a Message Instance')
    }

    return this.message.insertOne(message.rawObj)
    .catch(e => {
      log.error('Db', 'storeMessage() exception: %s', e.message)
      throw e
    })
  }

  storeContact(contact) {
    log.verbose('Db', 'storeContact()')
    if (!contact || !contact.rawObj) {
      throw new Error('storeContact() need a Contact Instance')
    }

    return this.contact.insertOne(contact.rawObj)
    .catch(e => {
      log.error('Db', 'storeContact() exception: %s', e.message)
      throw e
    })
  }

  findMessage(q) {
    // Get first two documents that match the query
    return co.call(this, function* () {
      const re = new RegExp(q, 'i')
      var docs = yield this.message.find({MMDigest: re}).limit(20).toArray()
      // console.log(docs)
      return docs
    }).catch(e => {
      log.error('Db', 'findMessage() exception: %s', e.message)
      throw e
    })
  }

  findContact(q) {
    return co.call(this, function* () {
      const re = new RegExp(q, 'i')
      var docs = yield this.contact.find({'**': re}).limit(20).toArray()
      // console.log(docs)
      return docs
    }).catch(e => {
      log.error('Db', 'findContact() exception: %s', e.message)
      throw e
    })
  }
}

module.exports = Db.default = Db.Db = Db