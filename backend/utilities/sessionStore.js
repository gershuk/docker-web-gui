const session = require('express-session')
const { knex } = require('./db')

// Sessions without an explicit cookie expiry are kept for a very long time.
const fallbackExpiry = () =>
  new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10)

const expiryOf = sess => {
  if (sess && sess.cookie && sess.cookie.expires) {
    return new Date(sess.cookie.expires)
  }
  return fallbackExpiry()
}

// Persists express-session data in SQLite (via the existing knex instance),
// so sessions survive server restarts and independent sessions can coexist
// for every browser/device that logs in.
class KnexSessionStore extends session.Store {
  get(sid, cb) {
    knex('sessions')
      .where({ sid })
      .first()
      .then(row => {
        if (!row) return cb(null, null)
        // Lazily purge expired sessions.
        if (row.expires && new Date(row.expires).getTime() <= Date.now()) {
          return knex('sessions')
            .where({ sid })
            .del()
            .then(() => cb(null, null))
        }
        let sess
        try {
          sess = JSON.parse(row.sess)
        } catch (e) {
          return cb(null, null)
        }
        cb(null, sess)
      })
      .catch(err => cb(err))
  }

  set(sid, sess, cb) {
    const data = { sess: JSON.stringify(sess), expires: expiryOf(sess) }
    knex('sessions')
      .where({ sid })
      .first()
      .then(existing => {
        if (existing) {
          return knex('sessions').where({ sid }).update(data)
        }
        return knex('sessions').insert({ sid, ...data })
      })
      .then(() => cb && cb(null))
      .catch(err => cb && cb(err))
  }

  destroy(sid, cb) {
    knex('sessions')
      .where({ sid })
      .del()
      .then(() => cb && cb(null))
      .catch(err => cb && cb(err))
  }

  touch(sid, sess, cb) {
    knex('sessions')
      .where({ sid })
      .update({ expires: expiryOf(sess) })
      .then(() => cb && cb(null))
      .catch(err => cb && cb(err))
  }
}

module.exports = KnexSessionStore
