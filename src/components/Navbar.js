import React, { Component } from 'react'
import { connect } from 'react-redux'
import { accountSelector, tokenSelector, tokenSymbolSelector } from '../store/selectors'
import { addToMetamask } from '../store/interactions'

class Navbar extends Component {
  render() {
    return (
      <nav className="navbar navbar-expand-lg bg-warning">
        <a className="navbar-brand text-dark" href="#/">{this.props.symbol} Token Exchange</a>
        <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <ul className="navbar-nav ml-auto">
          <li className="nav-item">
            <span 
              className="nav-link small"
              onClick={(e) => addToMetamask(this.props.token)}
            >
              <strong>Add {this.props.symbol} to Metamask</strong>
            </span>
          </li>
          <li className="nav-item">
            <a
              className="nav-link small text-dark"
              href={`https://polygonscan.com/address/${this.props.account}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {this.props.account}
            </a>
          </li>
        </ul>
      </nav>
    )
  }
}

function mapStateToProps(state) {
  return {
    account: accountSelector(state),
    token: tokenSelector(state),
    symbol: tokenSymbolSelector(state),
  }
}

export default connect(mapStateToProps)(Navbar)
//export default Navbar