import React, { Component } from 'react'
import './App.css'
import Navbar from './Navbar'
import Content from './Content'
import { connect } from 'react-redux'
import {
  loadWeb3,
  loadWeb3Matic,
  loadAccount,
  loadToken,
  loadExchange,
  loadBlockNumber,
  loadTokenSymbol,
  loadNetwork,
  offAll,
  connected,
} from '../store/interactions'
import { contractsLoadedSelector } from '../store/selectors'

class App extends Component {
  componentWillMount() {
    connected(false, this.props.dispatch)
    this.loadBlockchainData(this.props.dispatch)
  }

  async loadBlockchainData(dispatch) {
    const web3 = await loadWeb3(dispatch)
    const networkId = await loadNetwork(web3, dispatch)
    await loadAccount(web3, dispatch)
    console.log(this.props.account)
    if(this.props.account!=='undefined'){
      connected(true, dispatch)
    }
    await loadBlockNumber(web3, dispatch)
    
    const exchange = await loadExchange(web3, networkId, dispatch)
    if(!exchange) {
      window.alert('Exchange smart contract not detected on the current network. Please select another network with Metamask.')
      return
    }
    const token = await loadToken(web3, networkId, dispatch)
    if(!token) {
      window.alert('Token smart contract not detected on the current network. Please select another network with Metamask.')
      return
    }

    const symbol = await loadTokenSymbol(token, dispatch)
    console.log(symbol)
  }

  async on(event) {
    event.preventDefault()

    const dispatch = this.props.dispatch
    const web3 = await loadWeb3Matic(dispatch)
    const networkId = await loadNetwork(web3, dispatch)
    await loadAccount(web3, dispatch)
    if(this.props.account!=='undefined'){
      connected(true, dispatch)
    }
    await loadBlockNumber(web3, dispatch)
    
    const exchange = await loadExchange(web3, networkId, dispatch)
    if(!exchange) {
      window.alert('Exchange smart contract not detected on the current network. Please select another network with Metamask.')
      return
    }
    const token = await loadToken(web3, networkId, dispatch)
    if(!token) {
      window.alert('Token smart contract not detected on the current network. Please select another network with Metamask.')
      return
    }

    await loadTokenSymbol(token, dispatch)
  }

  async off(event) {
    event.preventDefault()

    const dispatch = this.props.dispatch
    await offAll(dispatch)
    connected(false, dispatch)
  }

  render() {
    return (
      <div>
        <Navbar />
        { this.props.contractsLoaded ? <Content /> : <div className="content"></div> }
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    contractsLoaded: contractsLoadedSelector(state)
  }
}

export default connect(mapStateToProps)(App)