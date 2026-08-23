const resolve = require('path').resolve
const crypto = require('crypto')
const bcrypt = require('bcrypt')
const knexLibrary = require('knex')
const write = require('write')
const fileExists = require('file-exists')

const db = module.exports

db.dbSource = resolve(__dirname + '/../data/data.db')

db.knex = knexLibrary({
  client: 'sqlite3',
  connection: {
    filename: db.dbSource
  },
  useNullAsDefault: true
})

// The service has no registration — a single admin account is seeded on the
// first start. Credentials are read from the environment.
const DEFAULT_ADMIN_USERNAME = process.env.AUTH_USERNAME || 'admin'
const DEFAULT_ADMIN_PASSWORD = process.env.AUTH_PASSWORD || 'admin'
const BCRYPT_ROUNDS = parseInt(process.env.AUTH_BCRYPT_ROUNDS || '10', 10)

const createTableIfMissing = async (tableName, buildTable) => {
  const exists = await db.knex.schema.hasTable(tableName)
  if (!exists) {
    await db.knex.schema.createTable(tableName, buildTable)
  }
}

const seedDefaultUser = async () => {
  const row = await db.knex('users').count('id as total').first()
  if (row && row.total > 0) return

  // The password is stored as a bcrypt hash, never in plain text.
  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, BCRYPT_ROUNDS)
  await db.knex('users').insert({
    username: DEFAULT_ADMIN_USERNAME,
    password_hash: passwordHash,
    created_at: db.knex.fn.now(),
    updated_at: db.knex.fn.now()
  })

  if (!process.env.AUTH_PASSWORD) {
    console.warn(
      '\n⚠️  Using the default admin credentials (admin/admin).\n' +
      '    Set AUTH_USERNAME and AUTH_PASSWORD environment variables\n' +
      '    before the first start to use your own credentials.\n'
    )
  }
}

// Ensures the single admin account exists and matches the credentials from
// the environment. Runs on every boot:
//  - first start: seeds the account (password stored as a bcrypt hash);
//  - if AUTH_PASSWORD differs from the stored hash: applies the new password
//    and revokes ALL sessions (every device has to log in again);
//  - if the password is the same: existing sessions are left untouched.
const syncAdminUser = async () => {
  let user = await db.knex('users').where({ username: DEFAULT_ADMIN_USERNAME }).first()

  if (!user) {
    const existing = await db.knex('users').orderBy('id').first()
    if (existing) {
      // The admin account exists under a different username — rename it so the
      // single-admin invariant is kept and no orphan account is left behind.
      await db.knex('users')
        .where({ id: existing.id })
        .update({ username: DEFAULT_ADMIN_USERNAME, updated_at: db.knex.fn.now() })
      user = existing
    } else {
      return seedDefaultUser()
    }
  }

  const passwordMatches = await bcrypt.compare(DEFAULT_ADMIN_PASSWORD, user.password_hash)
  if (!passwordMatches) {
    // The environment password changed — apply it and revoke all sessions.
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, BCRYPT_ROUNDS)
    await db.knex('users')
      .where({ id: user.id })
      .update({ password_hash: passwordHash, updated_at: db.knex.fn.now() })
    await db.knex('sessions').del()
    console.warn(
      '\n🔑  The admin password was changed in the environment.\n' +
      '    All existing sessions have been revoked; please log in again\n' +
      '    with the new password.\n'
    )
  }
}

db.boot = () => {
  return fileExists(db.dbSource)
    .then(async exists => {
      if (!exists) {
        // Create the file.
        await write(db.dbSource, '')
      }
      // Create tables.
      await createTableIfMissing('groups', function (table) {
        table.increments()
        table.string('name')
        table.text('containers_id')
        table.timestamps()
      })
      await createTableIfMissing('users', function (table) {
        table.increments()
        table.string('username').unique()
        table.string('password_hash')
        table.timestamps()
      })
      await createTableIfMissing('sessions', function (table) {
        table.string('sid').primary()
        table.text('sess')
        table.dateTime('expires')
      })
      await createTableIfMissing('settings', function (table) {
        table.string('key').primary()
        table.text('value')
      })
      // Ensure the single admin account matches the environment credentials.
      await syncAdminUser()
      // Purge sessions that already expired while the server was stopped.
      await db.knex('sessions').where('expires', '<', new Date()).del()
    })
    .catch(err => {
      console.error('Failed to boot the database:', err)
      throw err
    })
}

db.getSetting = async key => {
  const row = await db.knex('settings').where({ key }).first()
  return row ? row.value : null
}

db.setSetting = async (key, value) => {
  const existing = await db.knex('settings').where({ key }).first()
  if (existing) {
    await db.knex('settings').where({ key }).update({ value })
  } else {
    await db.knex('settings').insert({ key, value })
  }
}

// Secret used to sign the session cookies. Persisted in SQLite so that all
// existing sessions keep working after a server restart.
db.getOrCreateSessionSecret = async () => {
  const existing = await db.getSetting('session_secret')
  if (existing) return existing
  const secret = crypto.randomBytes(48).toString('hex')
  await db.setSetting('session_secret', secret)
  return secret
}

db.newGroup = ({ name, containers }) => {
  return db.knex('groups').insert({
    name,
    containers_id: JSON.stringify(containers),
    created_at: db.knex.fn.now(),
    updated_at: db.knex.fn.now()
  })
}

db.deleteGroup = id => {
  return db.knex('groups').where('id', id).del()
}

db.getGroups = () => {
  return db.knex('groups')
    .select()
    .orderBy('id', 'desc')
}

db.getGroupById = id => db.knex('groups')
  .select()
  .where('id', id)