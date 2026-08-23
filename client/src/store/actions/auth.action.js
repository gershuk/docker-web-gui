import { request } from '../../utilities/request'

export const authLoginStart = () => ({
  type: 'AUTH_LOGIN_START'
})

export const authLoginSuccess = payload => ({
  type: 'AUTH_LOGIN_SUCCESS',
  payload
})

export const authLoginFailure = payload => ({
  type: 'AUTH_LOGIN_FAILURE',
  payload
})

export const authLogout = () => ({
  type: 'AUTH_LOGOUT'
})

export const authCheckDone = payload => ({
  type: 'AUTH_CHECK_DONE',
  payload
})

export const login = (username, password) => dispatch => {
  dispatch(authLoginStart())
  request('post', 'auth/login', { username, password })
    .then(response => {
      dispatch(authLoginSuccess({ user: response.data.user }))
    })
    .catch(error => {
      const message =
        error.response && error.response.data && error.response.data.error
          ? error.response.data.error
          : 'Login failed. Please try again.'
      dispatch(authLoginFailure({ error: message }))
    })
}

export const logout = () => dispatch => {
  request('post', 'auth/logout')
    .then(() => dispatch(authLogout()))
    .catch(() => dispatch(authLogout()))
}

// Restores the session on every page load, so revisiting the page does not
// require logging in again.
export const fetchMe = () => dispatch => {
  request('get', 'auth/me')
    .then(response => {
      dispatch(authCheckDone({ authenticated: true, user: response.data.user }))
    })
    .catch(() => {
      dispatch(authCheckDone({ authenticated: false, user: null }))
    })
}
