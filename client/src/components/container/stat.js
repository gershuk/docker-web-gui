import React from 'react'
import { Badge } from 'evergreen-ui'
import { connect } from 'react-redux'


class ContainerStat extends React.PureComponent {
  
  formatValue(raw) {
    if (!raw) return '0B'
    const [value] = String(raw).split('/')
    const match = value.trim().match(/^([\d.]+)\s*([a-zA-Z]*)$/)
    if (!match) return value.trim()
    const num = parseFloat(match[1])
    const unit = (match[2] || 'B').toUpperCase()
    const multipliers = {
      B: 1,
      KB: 1e3,
      MB: 1e6,
      GB: 1e9,
      TB: 1e12,
      KIB: 1024,
      MIB: 1024 ** 2,
      GIB: 1024 ** 3,
      TIB: 1024 ** 4
    }
    const bytes = num * (multipliers[unit] || 1)
    if (bytes >= 1e9) return (bytes / 1e9).toFixed(1) + ' GB'
    if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + ' MB'
    if (bytes >= 1e3) return (bytes / 1e3).toFixed(1) + ' kB'
    return bytes.toFixed(0) + ' B'
  }

  // {{.NetIO}} comes back as "input / output" (e.g. "78.6kB / 41kB").
  // Parse and format BOTH halves so outgoing traffic is not dropped.
  formatNetworkIo(raw) {
    if (!raw) return { input: '0B', output: '0B' }
    const [input, output] = String(raw).split('/')
    return {
      input: this.formatValue(input),
      output: this.formatValue(output)
    }
  }

  renderBadges () {
    const { stats, containerID } = this.props
    const data = stats
      .find(n => n.id === containerID)
    if (!data) return null
    const network = this.formatNetworkIo(data.network_io)
    return <>
      <Badge backgroundColor="#deebf7" fontWeight="bold" borderRadius={16} paddingLeft={10} fontSize={11} paddingRight={10} marginLeft={10} marginTop={3}>
        cpu {data.cpu_percentage}
      </Badge>
      <Badge backgroundColor="#ebe7f8" fontWeight="bold" borderRadius={16} paddingLeft={10} fontSize={11} paddingRight={10} marginLeft={10} marginTop={3}>
        ram {this.formatValue(data.memory_usage)}
      </Badge>
      <Badge backgroundColor="#ebe7f8" fontWeight="bold" borderRadius={16} paddingLeft={10} fontSize={11} paddingRight={10} marginLeft={10} marginTop={3}>
        net in {network.input} · out {network.output}
      </Badge>
    </>
  }

  render () {
    return this.renderBadges()
  }
}

const mapStateToProps = state => {
  return {
    stats: state.stats.containerStats
  }
}

export default connect(mapStateToProps, null)( ContainerStat )