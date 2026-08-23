import React from 'react'
import { Link, withRouter } from 'react-router-dom'
import { Pane, Icon, Text, Button } from 'evergreen-ui'

import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { logout } from '../store/actions/auth.action'


class NavBar extends React.PureComponent {

  state = {
    active: 'container'
  }

  componentDidMount () {
    let path = this.props.location.pathname
    if( path === '/' ) path = 'containers'
    this.setState({
      active: path.replace('/', '')
    })
  }

  navButton (name, icon) {
    return <Text display='flex' alignItems='center'>
      <Icon size={14} color="muted" icon={ icon } marginRight={5}/> 
        { name }
    </Text>
  }

  render () {
    const { active, logout } = this.props
    return <Pane display="flex" justifyContent="center" alignItems="center" padding={2} background="#f9f9fc" margin={2}>
      <Button 
        height={22} 
        width={56} 
        justifyContent='center' 
        alignItems='center'
        fontSize={8} 
        paddingLeft={0}
        paddingRight={0}
        borderTopRightRadius={0} 
        appearance={active === 'containers' ? 'primary' : 'default'}
        borderBottomRightRadius={0}
        is={Link}
        to='/'
        onClick={() => this.setState({active: 'containers'})}>
          <Icon icon="layers" marginRight={3} size={8} /> Container
        </Button>
      <Button 
        height={22} 
        width={56} 
        justifyContent='center' 
        alignItems='center'
        fontSize={8} 
        paddingLeft={0}
        paddingRight={0}
        borderTopLeftRadius={0} 
        borderBottomLeftRadius={0} 
        borderTopRightRadius={0} 
        appearance={active === 'images' ? 'primary' : 'default'}
        borderBottomRightRadius={0} 
        is={Link}
        to='/images'
        onClick={() => this.setState({active: 'images'})}>
          <Icon icon="projects" marginRight={3} size={8} /> Image
        </Button>
      <Button 
        height={22} 
        width={56} 
        justifyContent='center' 
        alignItems='center'
        fontSize={8} 
        paddingLeft={0}
        paddingRight={0}
        borderTopLeftRadius={0} 
        appearance="default"
        borderBottomLeftRadius={0} 
        appearance={active === 'cleanup' ? 'primary' : 'default'}
        is={Link}
        to='/cleanup'
        onClick={() => this.setState({active: 'cleanup'})}>
          <Icon icon="shield" marginRight={3} size={8} /> Clean-up
        </Button>
      <Button 
        height={22} 
        width={56} 
        justifyContent='center' 
        alignItems='center'
        fontSize={8}
        paddingLeft={0}
        paddingRight={0}
        marginLeft={2}
        iconBefore='log-out' 
        appearance='default'
        onClick={logout}>
        Logout
      </Button>
    </Pane>
  }
}

const mapDispatchToProps = dispatch => bindActionCreators(
  {
    logout
  },
  dispatch
)

export default connect(null, mapDispatchToProps)( withRouter(NavBar) )