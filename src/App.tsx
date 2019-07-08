import React from 'react';
import ApolloClient, { gql, InMemoryCache } from 'apollo-boost';
import { ApolloProvider, Query } from 'react-apollo'
import { fromWei } from 'web3x-es/utils';
import Typography from 'antd/es/typography';
import KyberConstants from './kyberConstants';
import Table from 'antd/es/table';
import logo from './logo.svg';
import './App.css';

if (!process.env.REACT_APP_GRAPHQL_ENDPOINT) {
  throw new Error('REACT_APP_GRAPHQL_ENDPOINT environment variable not defined')
}

const { Title } = Typography;

const client = new ApolloClient({
  uri: process.env.REACT_APP_GRAPHQL_ENDPOINT,
  cache: new InMemoryCache(),
})

interface TokenMap {
  [symbol: string]: string;
}

const TOKEN_MAP: TokenMap = {};

const TRADES_QUERY = gql`
  query trades {
    executeTrades(where: {
      src: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
      actualSrcAmount_gte: "100000000000000000000"
    }, 
      orderBy: actualSrcAmount,
      orderDirection: desc
    ) {
      id
      trader
      src
      dest
      actualSrcAmount
      actualDestAmount
    }
  }
`

interface ExecuteTrades {
  executeTrades: Array<{
    id: string,
    trader: string,
    src: string,
    dest: string,
    actualSrcAmount: string,
    actualDestAmount: string
  }>
}

class KyberTrades extends Query<ExecuteTrades>{}

const _iterateOverKyberTokens = (tokenContractAddress:string) => {
  for (let [key, value] of Object.entries(KyberConstants.tokens)) {
    if(tokenContractAddress === value.address) return key;
  }
  return 'UNKNOWN';
}

const getTokenSymbol = (tokenContractAddress:string) => {
  const tokenSymbol = TOKEN_MAP[tokenContractAddress] ?
    TOKEN_MAP[tokenContractAddress] :
    _iterateOverKyberTokens(tokenContractAddress)
  TOKEN_MAP[tokenContractAddress] = tokenSymbol;
  return tokenSymbol;
}

const columns = [
  {
    title: 'Transaction ID',
    dataIndex: 'id',
    key: 'id',
    render: (id:string) => {
      const cleanTx = id.split('-');
      return <a 
        href={`https://etherscan.io/tx/${cleanTx[0]}`}
        target="_blank"
      >
        <code>{`${id.substr(0,10)}...`}</code>
      </a>
    }
  },
  {
    title: 'Trader',
    dataIndex: 'trader',
    key: 'trader',
    render: (trader:string) => {
      return <a 
        href={`https://etherscan.io/address/${trader}`}
        target="_blank"
      >
        <code>{`${trader.substr(0,10)}...${trader.substr(trader.length - 6, trader.length)}`}</code>
      </a>
    }
  },
  {
    title: 'Amount in ETH',
    dataIndex: 'actualSrcAmount',
    key: 'actualSrcAmount',
    render: (amount:string) => {
      return <span>{ Number(fromWei(amount, 'ether')).toFixed(2) }</span>
    }
  },
  {
    title: 'Token Bought',
    dataIndex: 'dest',
    render: (tokenContract: string) => {
      return <a
        href={`https://etherscan.io/token/${tokenContract}`}
        target="_blank"
      >{getTokenSymbol(tokenContract)}</a>
    }
  },
  {
    title: 'Quantity Bought',
    dataIndex: 'actualDestAmount',
    render: (amount: string) => {
      return <span>{ Number(fromWei(amount, 'ether')).toFixed(2) }</span>
    }
  }
]

const ExecuteTradesComponent = () =>
  <KyberTrades query={TRADES_QUERY}>
  {
    ({ data, error, loading}) => {
      console.log('Data', data)
      return loading ?
        <p>Loading...</p>
      : error ?
        <p>Error.</p>
      : 
      data && <Table
        dataSource={data.executeTrades}
        columns={columns}
      />
    }
  }
  </KyberTrades>

const App: React.FC = () => {
  return (
    <ApolloProvider client={client}>
      <div className="App">
        <header className="App-header">
          <Title>The Kyber Whales</Title>
          <p>
            A list of all transactions done in <a href="https://kyberswap.com/swap/eth-knc" target="_blank">Kyber</a> for over 100 ETH.
          </p>
          <ExecuteTradesComponent />
        </header>
        <p>A project by&nbsp;
          <a 
            href="https://jjperezaguinaga.com/" 
            target="blank"
          >
          jjperezaguinaga
          </a> using&nbsp;
          <a
            href="https://thegraph.com/" 
            target="blank"
          >
            The Graph
          </a>
          </p>
      </div>
    </ApolloProvider>
  );
}

export default App;
