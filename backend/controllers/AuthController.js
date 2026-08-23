const bcrypt = require('bcrypt')
const rateLimit = require('express-rate-limit')
const { knex } = require('../utilities/db')

// Dummy hash used to keep the login timing identical when the username does
// not exist (prevents user enumeration through response time).
const DUMMY_HASH = bcrypt.hashSync('auth-timing-dummy-password', 10)

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' }
})

exports.loginLimiter = loginLimiter

exports.requireAuth = (req, res, next) => {
  if (req.session && req.session.isAuthenticated && req.session.user) {
    return next()
  }
  return res.status(401).json({ error: 'Unauthorized' })
}

// CSRF defense: all state-changing /api requests must come from our own
// client, which always sends this custom header. Together with the SameSite
// cookie attribute this blocks cross-site form/token attacks.
exports.csrfProtection = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
  if (req.headers['x-requested-with'] === 'XMLHttpRequest') return next()
  return res.status(403).json({ error: 'Forbidden' })
}

exports.login = async (req, res, next) => {
  const username =
    typeof req.body.username === 'string' ? req.body.username.trim() : ''
  const password =
    typeof req.body.password === 'string' ? req.body.password : ''

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: 'Username and password are required.' })
  }

  try {
    const user = await knex('users').where({ username }).first()
    // Always run a comparison to avoid timing-based user enumeration.
    const passwordMatches = await bcrypt.compare(
      password,
      user ? user.password_hash : DUMMY_HASH
    )

    if (!user || !passwordMatches) {
      return res.status(401).json({ error: 'Invalid username or password.' })
    }

    // Regenerate the session id on login to prevent session fixation.
    req.session.regenerate(err => {
      if (err) return next(err)
      req.session.isAuthenticated = true
      req.session.user = { id: user.id, username: user.username }
      res.json({ user: req.session.user })
    })
  } catch (err) {
    next(err)
  }
}

exports.logout = (req, res, next) => {
  req.session.destroy(err => {
    if (err) return next(err)
    res.clearCookie('connect.sid', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax'
    })
    res.json({ ok: true })
  })
}

exports.me = (req, res) => {
  if (req.session && req.session.isAuthenticated && req.session.user) {
    return res.json({ user: req.session.user })
  }
  return res.status(401).json({ error: 'Unauthorized' })
}
