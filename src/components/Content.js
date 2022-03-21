import React, { Component } from 'react'
import { connect } from 'react-redux'
import { exchangeSelector, blockNumberSelector, tokenSymbolSelector } from '../store/selectors'
import { loadAllOrders } from '../store/interactions'
import OrderBook from './OrderBook'
import Trades from './Trades'
import MyTransactions from './MyTransactions'
import PriceChart from './PriceChart'
import Balance from './Balance'
import NewOrder from './NewOrder'

class Content extends Component {
  componentDidMount() {
    this.loadBlockchainData(this.props)
  }

  async loadBlockchainData(props) {
    console.log("PROPS:",this.props)
    const { dispatch, exchange, blockNumber } = props
    await loadAllOrders(blockNumber, exchange, dispatch)
    console.log("content block number:",blockNumber)
  }

  render() {
    return (
      <div className="content">
        <div className="vertical-split">
          <Balance />
          <NewOrder />
        </div>
        <OrderBook />
        <div className="vertical-split">
          <PriceChart />
          <MyTransactions />
        </div>
        <Trades />
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    exchange: exchangeSelector(state),
    blockNumber: blockNumberSelector(state),
    symbol: tokenSymbolSelector(state),
  }
}

export default connect(mapStateToProps)(Content)
