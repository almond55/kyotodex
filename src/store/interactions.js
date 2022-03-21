import Web3 from 'web3'
//import WalletConnectProvider from "@maticnetwork/walletconnect-provider"
import WalletConnectProvider from '@walletconnect/web3-provider';
//import Matic from "maticjs"
import {
  web3Loaded,
  web3AccountLoaded,
  tokenLoaded,
  tokenSymbolLoaded,
  exchangeLoaded,
  cancelledOrdersLoaded,
  filledOrdersLoaded,
  allOrdersLoaded,
  orderCancelling,
  orderCancelled,
  orderFilling,
  orderFilled,
  etherBalanceLoaded,
  tokenBalanceLoaded,
  exchangeEtherBalanceLoaded,
  exchangeTokenBalanceLoaded,
  balancesLoaded,
  balancesLoading,
  buyOrderMaking,
  sellOrderMaking,
  orderMade,
  blockNumberLoaded,
  networkLoaded,     //new
  connectedLoaded,   //loading true/false
} from './actions'
import Token from '../abis/Token.json'
import Exchange from '../abis/Exchange.json'
import { ETHER_ADDRESS } from '../helpers'

export const connected = async (connect, dispatch) => {
  // this is only true or false
  console.log("connected:", connect)
  dispatch(connectedLoaded(connect))
  return connect
}
 
export const loadWeb3 = async (dispatch) => {
  if(typeof window.ethereum!=='undefined'){
    // need 3 different actions to push?
    window.ethereum.autoRefreshOnNetworkChange = false;
    const web3 = new Web3(window.ethereum) // we gonna re-use this
    dispatch(web3Loaded(web3))
    return web3
  } else {
    window.alert('Please connect using Wallet Connect or Metamask via the Connect button.')
  }
}

export const loadWeb3Matic = async (dispatch) => {
  const maticProvider = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        rpc: {
          137: "https://polygon-rpc.com/",
        },
        network: "Polygon Mainnet",
      },
    },
  };

  const web3 = new Web3(maticProvider)
  dispatch(web3Loaded(web3))
  return web3
}

export const loadNetwork = async (provider, dispatch) => {
  const network = await provider.eth.getChainId()
  dispatch(networkLoaded(network))
  return network
}

export const loadAccount = async (provider, dispatch) => {
  let accounts, account

  try {
    // if metamask
    accounts = await provider.eth.getAccounts()
  } catch(e) {
    // if wallet connect
    accounts = await provider.accounts
  }
  
  account = accounts[0]
  dispatch(web3AccountLoaded(account))
  return account
}

export const offAll = async(dispatch) => {
  dispatch(loadExchange(null))
  dispatch(loadToken(null))
  dispatch(loadAccount(null))
  dispatch(loadNetwork(null))
  dispatch(loadWeb3(null))
}

export const loadToken = async (web3, networkId, dispatch) => {
  try {
    const token = new web3.eth.Contract(Token.abi, Token.networks[networkId].address)
    dispatch(tokenLoaded(token))
    return token

  } catch (error) {
    console.log('Contract not deployed to the current network. Please select another network with Metamask.')
    return null
  }
}

export const loadTokenSymbol = async (token, dispatch) => {
  const tokenSymbol = await token.methods.symbol().call()
  const symbol = tokenSymbol.toString()
  dispatch(tokenSymbolLoaded(symbol))
  return symbol
}

export const loadExchange = async (web3, networkId, dispatch) => {
  try {
    const exchange = new web3.eth.Contract(Exchange.abi, Exchange.networks[networkId].address)
    dispatch(exchangeLoaded(exchange))
    return exchange
  } catch (error) {
    console.log('Contract not deployed to the current network. Please select another network with Metamask.')
    return null
  }
}

export const loadBlockNumber = async (web3, dispatch) => {
  console.log("web3:",web3)
  let blockNum = await web3.eth.getBlockNumber()
  console.log("original block:", blockNum)
  let block = parseInt(blockNum.toString()) - 3000
  dispatch(blockNumberLoaded(block))
  console.log("block:", block)
  return block
}

export const loadAllOrders = async (blockNumber, exchange, dispatch) => {
  exchange.transactionConfirmationBlocks = 1
  console.log("block from all orders:",blockNumber)
  // Fetch cancelled orders with the "Cancel" event stream{ fromBlock: 'earliest', toBlock: 'latest' }
  const cancelStream = await exchange.getPastEvents('Cancel', {fromBlock: blockNumber, toBlock: 'latest'})
  // Format cancelled orders
  const cancelledOrders = cancelStream.map((event) => event.returnValues)
  // Add cancelled orders to the redux store
  dispatch(cancelledOrdersLoaded(cancelledOrders))

  // Fetch filled orders with the "Trade" event stream
  const tradeStream = await exchange.getPastEvents('Trade', {fromBlock: blockNumber, toBlock: 'latest'})
  // Format filled orders
  const filledOrders = tradeStream.map((event) => event.returnValues)
  // Add cancelled orders to the redux store
  dispatch(filledOrdersLoaded(filledOrders))

  // Load order stream
  const orderStream = await exchange.getPastEvents('Order', {fromBlock: blockNumber, toBlock: 'latest'})
  console.log("Order Stream: ", orderStream)
  // Format order stream
  const allOrders = orderStream.map((event) => event.returnValues)
  // Add open orders to the redux store
  dispatch(allOrdersLoaded(allOrders))
}

export const cancelOrder = (dispatch, exchange, order, account) => {
  exchange.transactionConfirmationBlocks = 1
  exchange.methods.cancelOrder(order.id).send({ from: account, gasPrice: 50000000000 })
  .on('transactionHash', (hash) => {
     dispatch(orderCancelling())
  })
  .on('receipt', (receipt) => {
    dispatch(orderCancelled(receipt.events.Cancel.returnValues))
  })
  .on('error', (error) => {
    console.log(error)
    window.alert('Please wait for a while and refresh the page.')
  })
}

export const fillOrder = (dispatch, exchange, order, account) => {
  exchange.transactionConfirmationBlocks = 1
  exchange.methods.fillOrder(order.id).send({ from: account, gasPrice: 50000000000 })
  .on('transactionHash', (hash) => {
     dispatch(orderFilling())
  })
  .on('receipt', (receipt) => {
    dispatch(orderFilled(receipt.events.Trade.returnValues))
  })
  .on('error', (error) => {
    console.log(error)
    window.alert('Please wait for a while and refresh the page.')
  })
}

export const loadBalances = async (dispatch, web3, exchange, token, account) => {
  if(typeof account !== 'undefined') {
      // Ether balance in wallet
      const etherBalance = await web3.eth.getBalance(account)
      dispatch(etherBalanceLoaded(etherBalance))

      // Token balance in wallet
      const tokenBalance = await token.methods.balanceOf(account).call({from: account})
      dispatch(tokenBalanceLoaded(tokenBalance))

      // Ether balance in exchange
      const exchangeEtherBalance = await exchange.methods.balanceOf(ETHER_ADDRESS, account).call({from: account})
      dispatch(exchangeEtherBalanceLoaded(exchangeEtherBalance))

      // Token balance in exchange
      const exchangeTokenBalance = await exchange.methods.balanceOf(token.options.address, account).call({from: account})
      dispatch(exchangeTokenBalanceLoaded(exchangeTokenBalance))

      // Trigger all balances loaded
      dispatch(balancesLoaded())
    } else {
      window.alert('Please login with MetaMask')
    }
}

export const depositEther = (dispatch, exchange, web3, amount, account) => {
  exchange.transactionConfirmationBlocks = 4
  exchange.methods.depositEther().send({ from: account,  value: web3.utils.toWei(amount, 'ether'), gasPrice: 50000000000 })
  .on('transactionHash', (hash) => {
    dispatch(balancesLoading())
  })
  .on('receipt', (receipt) => {
    dispatch(balancesLoaded(receipt.events.Deposit.returnValues))
  })
  .on('error',(error) => {
    console.error(error)
    window.alert(`Please wait for a while and refresh the page.`)
  })
}

export const withdrawEther = (dispatch, exchange, web3, amount, account) => {
  exchange.transactionConfirmationBlocks = 4
  exchange.methods.withdrawEther(web3.utils.toWei(amount, 'ether')).send({ from: account, gasPrice: 50000000000 })
  .on('transactionHash', (hash) => {
    dispatch(balancesLoading())
  })
  .on('receipt', (receipt) => {
    dispatch(balancesLoaded(receipt.events.Withdraw.returnValues))
  })
  .on('error',(error) => {
    console.error(error)
    window.alert(`Please wait for a while and refresh the page.`)
  })
}

export const depositToken = (dispatch, exchange, web3, token, amount, account) => {
  amount = web3.utils.toWei(amount, 'ether')
  token.transactionConfirmationBlocks = 4
  token.methods.approve(exchange.options.address, amount).send({ from: account, gasPrice: 50000000000 })
  .on('receipt', (receipt) => {
    exchange.methods.depositToken(token.options.address, amount).send({ from: account, gasPrice: 50000000000 })
    .on('transactionHash', (hash) => {
      dispatch(balancesLoading())
    })
    .on('receipt', (receipt) => {
      dispatch(balancesLoaded(receipt.events.Deposit.returnValues))
    })
    .on('error',(error) => {
      console.error(error)
      window.alert(`Please wait for a while and refresh the page.`)
    })
  })
}

export const withdrawToken = (dispatch, exchange, web3, token, amount, account) => {
  exchange.transactionConfirmationBlocks = 4
  exchange.methods.withdrawToken(token.options.address, web3.utils.toWei(amount, 'ether')).send({ from: account, gasPrice: 50000000000 })
  .on('transactionHash', (hash) => {
    dispatch(balancesLoading())
  })
  .on('receipt', (receipt) => {
    dispatch(balancesLoaded(receipt.events.Withdraw.returnValues))
  })
  .on('error',(error) => {
    console.error(error)
    window.alert(`Please wait for a while and refresh the page.`)
  })
}

export const makeBuyOrder = async (dispatch, exchange, token, web3, order, account) => {
  const block = await web3.eth.getBlockNumber()
  const blockNumber = parseInt(block.toString()) - 100
  console.log("makeBuyOrder block:",blockNumber)
  const tokenGet = token.options.address
  const amountGet = web3.utils.toWei(order.amount, 'ether')
  const tokenGive = ETHER_ADDRESS
  const amountGive = web3.utils.toWei((order.amount * order.price).toString(), 'ether')
  exchange.transactionConfirmationBlocks = 1
  exchange.methods.makeOrder(tokenGet, amountGet, tokenGive, amountGive).send({ from: account, gasPrice: 50000000000 })
  .on('transactionHash', (hash) => {
    console.log("hash:", hash)
    dispatch(buyOrderMaking())
  })
  .on('receipt', (receipt) => {
    dispatch(orderMade(receipt.events.Order.returnValues))
  })
  .on('error',(error) => {
    console.error(error)
    window.alert(`Please wait for a while and refresh the page.`)
  })
}

export const makeSellOrder = (dispatch, exchange, token, web3, order, account) => {
  const tokenGet = ETHER_ADDRESS
  const amountGet = web3.utils.toWei((order.amount * order.price).toString(), 'ether')
  const tokenGive = token.options.address
  const amountGive = web3.utils.toWei(order.amount, 'ether')
  exchange.transactionConfirmationBlocks = 1
  exchange.methods.makeOrder(tokenGet, amountGet, tokenGive, amountGive).send({ from: account, gasPrice: 50000000000 })
  .on('transactionHash', (hash) => {
    dispatch(sellOrderMaking())
  })
  .on('receipt', (receipt) => {
    dispatch(orderMade(receipt.events.Order.returnValues))
  })
  .on('error',(error) => {
    console.error(error)
    window.alert(`Please wait for a while and refresh the page.`)
  })
}

export const addToMetamask = async (token) => {
  console.log(token)
  const tokenAddress = token._address
  const tokenSymbol = await token.methods.symbol().call() 
  const tokenDecimals = await token.methods.decimals().call() 
  
  try {
    const wasAdded = await window.ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20', // Initially only supports ERC20, but eventually more!
        options: {
          address: tokenAddress, // The address that the token is at.
          symbol: tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
          decimals: tokenDecimals, // The number of decimals in the token
        },
      },
    });
  
    if (wasAdded) {
      console.log('Thanks for your interest!');
    } else {
      console.log('Your loss!');
    }
  } catch (error) {
    console.log(error);
  }

}