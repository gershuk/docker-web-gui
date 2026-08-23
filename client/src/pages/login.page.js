import React from 'react'
import { Pane, TextInput, Button, Text, Spinner, Alert, toaster } from 'evergreen-ui'

import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { login } from '../store/actions/auth.action'

class LoginPage extends React.PureComponent {

  state = {
    username: '',
    password: ''
  }

  handleSubmit = (event) => {
    event.preventDefault()
    const { username, password } = this.state
    if (!username || !password) {
      toaster.warning('Please enter both username and password.')
      return
    }
    this.props.login(username, password)
  }

  render () {
    const { loginLoading, error } = this.props
    const { username, password } = this.state

    return (
      <Pane
        display="flex"
        alignItems="center"
        justifyContent="center"
        flex="1"
        minHeight="calc(100vh / var(--ui-scale))"
        background="#f1f1f1"
      >
        <Pane
          width={380}
          background="white"
          padding={32}
          borderRadius={8}
          elevation={1}
        >
          <Text size={500} fontWeight={600} display="block" marginBottom={4}>
            Docker Web GUI
          </Text>
          <Text size={300} color="muted" display="block" marginBottom={20}>
            Sign in to manage your containers
          </Text>

          {error && <Alert intent="danger" title={error} marginBottom={16} />}

          <form onSubmit={this.handleSubmit}>
            <Text size={300} color="muted" marginBottom={4} display="block">
              Username
            </Text>
            <TextInput
              name="username"
              width="100%"
              marginBottom={16}
              value={username}
              onChange={e => this.setState({ username: e.target.value })}
              autoComplete="username"
              autoFocus
            />
            <Text size={300} color="muted" marginBottom={4} display="block">
              Password
            </Text>
            <TextInput
              name="password"
              type="password"
              width="100%"
              marginBottom={20}
              value={password}
              onChange={e => this.setState({ password: e.target.value })}
              autoComplete="current-password"
            />
            <Button
              type="submit"
              appearance="primary"
              width="100%"
              height={36}
              disabled={loginLoading}
            >
              {loginLoading ? <Spinner size={16} /> : 'Sign in'}
            </Button>
          </form>
        </Pane>
      </Pane>
    )
  }
}

const mapStateToProps = state => {
  return {
    loginLoading: state.auth.loginLoading,
    error: state.auth.error
  }
}

const mapDispatchToProps = dispatch => bindActionCreators(
  {
    login
  },
  dispatch
)

export default connect(mapStateToProps, mapDispatchToProps)(LoginPage)
