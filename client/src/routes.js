import React from 'react'
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Pane, Spinner } from 'evergreen-ui'

import Navbar from './components/NavBar'

import ContainerPage from './pages/container.page'
import ImagePage from './pages/image.page'
import CleanupPage from './pages/cleanup.page'
import LoginPage from './pages/login.page'

import { fetchMe } from './store/actions/auth.action'

class Routes extends React.PureComponent {

  componentDidMount () {
    // Restore the session on every page load (persistent login).
    this.props.fetchMe()
  }

  render () {
    const { status } = this.props

    // Waiting for the server to confirm whether we have a valid session.
    if (status === 'checking') {
      return (
        <Pane display="flex" alignItems="center" justifyContent="center" minHeight="calc(100vh / var(--ui-scale))">
          <Spinner size={32} />
        </Pane>
      )
    }

    // Not logged in — show only the login page.
    if (status === 'guest') {
      return <LoginPage />
    }

    // Logged in — the app.
    return (
      <BrowserRouter>
        <Navbar />
        <Switch>
          <Route path="/login" exact>
            <Redirect to="/" />
          </Route>
          <Route path="/" exact component={ContainerPage} />
          <Route path="/containers" exact component={ContainerPage} />
          <Route path="/images" component={ImagePage} />
          <Route path="/cleanup" component={CleanupPage} />
        </Switch>
      </BrowserRouter>
    )
  }
}

const mapStateToProps = state => {
  return {
    status: state.auth.status
  }
}

const mapDispatchToProps = dispatch => bindActionCreators(
  {
    fetchMe
  },
  dispatch
)

export default connect(mapStateToProps, mapDispatchToProps)(Routes)
