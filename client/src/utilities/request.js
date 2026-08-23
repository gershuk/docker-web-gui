import axios from 'axios'
import { store } from '../store'

export const restPath = '/api/'

// Send the session cookie on every request and mark requests with a custom
// header that the backend uses for CSRF protection.
axios.defaults.withCredentials = true
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'

// When any API call comes back with 401 (missing/expired/revoked session),
// drop the local auth state so the app returns to the login page.
axios.interceptors.response.use(
  response => response,
  error => {
    const { response } = error
    const url = (response && response.config && response.config.url) || ''
    if (
      response &&
      response.status === 401 &&
      url.indexOf('auth/me') === -1 &&
      url.indexOf('auth/login') === -1
    ) {
      store.dispatch({
        type: 'AUTH_CHECK_DONE',
        payload: { authenticated: false, user: null }
      })
    }
    return Promise.reject(error)
  }
)

export const request = ( method, path, data = {} ) => {
  const options = {
    method,
    data,
    url: restPath + path,
    timeout: 50000,
  }
  return axios(options)
}
