export default (state = null, action) => {

  switch (action.type) {

    case 'AUTH_LOGIN_START':
      return {
        ...state,
        loginLoading: true,
        error: null
      }

    case 'AUTH_LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        status: 'authenticated',
        loginLoading: false,
        error: null
      }

    case 'AUTH_LOGIN_FAILURE':
      return {
        ...state,
        loginLoading: false,
        error: action.payload.error
      }

    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        status: 'guest',
        loginLoading: false,
        error: null
      }

    case 'AUTH_CHECK_DONE':
      return {
        ...state,
        status: action.payload.authenticated ? 'authenticated' : 'guest',
        user: action.payload.user || null
      }

    default:
      return state

  }
}
