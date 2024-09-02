import './App.css';
import React, { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';

const App = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [balance, setBalance] = useState(null);
  const [activeTab, setActiveTab] = useState('balance');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [conversionRate, setConversionRate] = useState(0);
  const [solPrice, setSolPrice] = useState(0);
  const [solMarketCap, setSolMarketCap] = useState(0);
  const [semiWalletData, setSemiWalletData] = useState(null);
  const [password, setPassword] = useState('');
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [sendingStatus, setSendingStatus] = useState('');
  const [nftCollections, setNftCollections] = useState([]);
  const [airdropFromAddress, setAirdropFromAddress] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [airdropRecipients, setAirdropRecipients] = useState([{ to_address: '', amount: '' }]);
  const [priorityFee, setPriorityFee] = useState(100);
  const [airdropStatus, setAirdropStatus] = useState('');
  const [collectionAddress, setCollectionAddress] = useState('');
  const [collectionNFTs, setCollectionNFTs] = useState([]);
  const [collectionPage, setCollectionPage] = useState(1);
  const [collectionSize, setCollectionSize] = useState(10);
  const [fetchingCollectionNFTs, setFetchingCollectionNFTs] = useState(false);

  const SOLANA_RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=2b689bfd-7963-49d5-96ef-855f2f6545c7';
  const CURRENCY_API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';
  const COINMARKETCAP_API_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=SOL';

  const fetchSolanaPrice = async () => {
    try {
      const response = await fetch(COINMARKETCAP_API_URL, {
        headers: {
          'X-CMC_PRO_API_KEY': '2902d1b7-c2a7-4469-8f1f-70824014aeac', // Replace with your API key
          'Accept': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      const solData = data.data.SOL;
      setSolPrice(solData.quote.USD.price);
      setSolMarketCap(solData.quote.USD.market_cap);
    } catch (error) {
      console.error('Error fetching SOL price:', error);
      setError('Failed to fetch SOL price. Because Making HTTP requests on the client side with Javascript is currently prohibited');
    }
  };

  const fetchConversionRate = async () => {
    try {
      const response = await fetch(CURRENCY_API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setConversionRate(data.rates[selectedCurrency]);
    } catch (error) {
      console.error('Error fetching conversion rate:', error);
      setError('Failed to fetch conversion rate. Please try again later.');
    }
  };

  useEffect(() => {
    fetchSolanaPrice();
    if (selectedCurrency !== 'USD') {
      fetchConversionRate();
    }
  }, [selectedCurrency]);

  const fetchNFTCollections = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`https://api.shyft.to/sol/v1/wallet/collections?network=mainnet-beta&wallet_address=${walletAddress}`, {
        headers: {
          'accept': 'application/json',
          'x-api-key': 'hmA31OxXN07dwEG4'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setNftCollections(data.result);
    } catch (err) {
      setError('Failed to fetch NFT collections. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletData = async () => {
    setLoading(true);
    setError('');
    setTransactions([]);
    setBalance(null);

    try {
      const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
      const publicKey = new PublicKey(walletAddress);

      const walletBalance = await connection.getBalance(publicKey);
      setBalance(walletBalance / 1e9);

      const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 10 });

      const transactionDetails = await Promise.all(
        signatures.map(async (signature) => {
          const transaction = await connection.getTransaction(signature.signature, {
            commitment: 'confirmed',
          });
          return transaction;
        })
      );

      setTransactions(transactionDetails.filter((tx) => tx !== null));
      await fetchNFTCollections();
    } catch (err) {
      setError('Failed to fetch wallet data. Please check the wallet address and try again.');
    } finally {
      setLoading(false);
    }
  };

  const createSemiWallet = async () => {
    try {
      const response = await fetch('https://api.shyft.to/sol/v1/semi_wallet/create', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'x-api-key': 'hmA31OxXN07dwEG4', // API key
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: password, // Use user-provided password
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setSemiWalletData(data);
    } catch (error) {
      console.error('Error creating semi wallet:', error);
      setError('Failed to create semi wallet. Please try again later.');
    }
  };

  const formatJson = (json) => {
    return Object.entries(json).map(([key, value]) => (
      <div key={key} className="json-item">
        <span className="json-key">{key}:</span>
        <span className="json-value">{JSON.stringify(value)}</span>
      </div>
    ));
  };

  const sendSol = async () => {
    setSendingStatus('Sending...');
    try {
      const response = await fetch('https://api.shyft.to/sol/v1/wallet/send_sol', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'x-api-key': 'hmA31OxXN07dwEG4',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          network: 'mainnet-beta',
          from_address: fromAddress,
          to_address: toAddress,
          amount: parseFloat(amount)
        })
      });

      const data = await response.json();

      if (data.success) {
        setSendingStatus('Transaction successful!');
        // Optionally, you can update the balance or transaction list here
      } else {
        setSendingStatus(`Error: ${data.message || 'Transaction failed'}`);
      }
    } catch (error) {
      setSendingStatus(`Error: ${error.message}`);
    }
  };


  const handleRecipientChange = (index, field, value) => {
    const newRecipients = [...airdropRecipients];
    newRecipients[index][field] = value;
    setAirdropRecipients(newRecipients);
  };

  const addRecipient = () => {
    setAirdropRecipients([...airdropRecipients, { to_address: '', amount: '' }]);
  };

  const removeRecipient = (index) => {
    const newRecipients = airdropRecipients.filter((_, i) => i !== index);
    setAirdropRecipients(newRecipients);
  };

  const performAirdrop = async () => {
    setAirdropStatus('Airdropping...');
    try {
      const response = await fetch('https://api.shyft.to/sol/v1/token/airdrop', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'x-api-key': 'hmA31OxXN07dwEG4',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          network: 'mainnet-beta',
          from_address: airdropFromAddress,
          token_address: tokenAddress,
          transfer_info: airdropRecipients,
          priority_fee: priorityFee
        })
      });

      const data = await response.json();

      if (data.success) {
        setAirdropStatus('Airdrop successful!');
      } else {
        setAirdropStatus(`Error: ${data.message || 'Airdrop failed'}`);
      }
    } catch (error) {
      setAirdropStatus(`Error: ${error.message}`);
    }
  };

  const fetchCollectionNFTs = async () => {
    setFetchingCollectionNFTs(true);
    setError('');
    try {
      const response = await fetch(`https://api.shyft.to/sol/v1/collections/get_nfts?network=mainnet-beta&collection_address=${collectionAddress}&page=${collectionPage}&size=${collectionSize}`, {
        headers: {
          'accept': 'application/json',
          'x-api-key': 'hmA31OxXN07dwEG4'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setCollectionNFTs(data.result);
    } catch (err) {
      setError('Failed to fetch collection NFTs. Please try again.');
    } finally {
      setFetchingCollectionNFTs(false);
    }
  };

  return (
    <div className="app-container">
      <h1>Solana Wallet Tracker</h1>
      <div className="main-content">
        {error && <p className="error-message">{error}</p>}

        {/* Live Price and Market Cap */}
        <div className="top-info">
          <div className="card price-view">
            <h2>Live Price</h2>
            <p><strong>{solPrice.toFixed(2)} USD</strong></p>
          </div>
          <div className="card market-cap-view">
            <h2>Market Cap</h2>
            <p><strong>${(solMarketCap / 1e6).toFixed(2)}M</strong></p>
          </div>
        </div>

        {/* Wallet Address Input and Fetch Button */}
        <div className="input-container">
          <input
            type="text"
            placeholder="Enter wallet address"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="input-box"
          />
          <button onClick={fetchWalletData} disabled={loading || !walletAddress} className="fetch-button">
            {loading ? 'Loading...' : 'Fetch Data'}
          </button>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab-button ${activeTab === 'balance' ? 'active' : ''}`}
            onClick={() => setActiveTab('balance')}
          >
            Balance
          </button>
          <button
            className={`tab-button ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            Transactions
          </button>
          <button
            className={`tab-button ${activeTab === 'nfts' ? 'active' : ''}`}
            onClick={() => setActiveTab('nfts')}
          >
            NFTs
          </button>
        </div>



        <div className="content-area">
          {activeTab === 'balance' && balance !== null && (
            <div className="card balance-view">
              <h2>Wallet Balance</h2>
              <p>
                <strong>{balance.toFixed(4)} SOLANA</strong> ({(balance * solPrice * conversionRate).toFixed(2)} {selectedCurrency})
              </p>
              <div className="currency-dropdown">
                <label htmlFor="currency">Select Currency:</label>
                <select
                  id="currency"
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="dropdown-select"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                  <option value="JPY">JPY</option>
                  <option value="CHF">CHF</option>
                  <option value="CNY">CNY</option>
                  <option value="NZD">NZD</option>
                  <option value="SGD">SGD</option>
                  <option value="INR">INR</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && transactions.length > 0 && (
            <div className="transaction-cards-container">
              {transactions.map((tx, index) => (
                <div key={index} className="transaction-card">
                  <h3>Transaction {index + 1}</h3>
                  <p><strong>Signature:</strong> {tx.transaction.signatures[0]}</p>
                  <p><strong>Slot:</strong> {tx.slot}</p>
                  <p><strong>Block Time:</strong> {tx.blockTime ? new Date(tx.blockTime * 1000).toLocaleString() : 'N/A'}</p>
                  <p><strong>Fee (LAMPORTS):</strong> {tx.meta?.fee || 0}</p>
                </div>
              ))}
            </div>
          )}

        {activeTab === 'nfts' && (
            <div className="nft-collections-container">
              <h2>NFT Collections</h2>
              {loading ? (
                <p>Loading NFT collections...</p>
              ) : error ? (
                <p className="error-message">{error}</p>
              ) : nftCollections.length > 0 ? (
                <div className="nft-grid">
                  {nftCollections.map((collection, index) => (
                    <div key={index} className="nft-card">
                      <img src={collection.image} alt={collection.name} className="nft-image" />
                      <h3>{collection.name}</h3>
                      <p>Floor Price: {collection.floor_price} SOL</p>
                      <p>NFTs Owned: {collection.nfts_owned}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No NFT collections found for this wallet.</p>
              )}
            </div>
          )}




                  {/* Password Input and Create Wallet Button */}
        <div className="input-container">
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-box"
          />
          <button onClick={createSemiWallet} className="fetch-button">
            Create Semi Wallet
          </button>
        </div>

        


        {semiWalletData && (
            <div className="card semi-wallet-view">
            <h2>Semi Wallet Created</h2>
            <div className="semi-wallet-content">
              <div className="wallet-address">
                <span className="label">Wallet Address:</span>
                <span className="value">{semiWalletData.walletAddress}</span>
              </div>
              <div className="other-data">
                <h3>Other Data:</h3>
                <div className="json-display">
                  {formatJson(semiWalletData)}
                </div>
              </div>
            </div>
          </div>
          )}
        </div>

        <div className="card send-sol-view">
          <h2>Send SOL</h2>
          <div className="send-sol-form">
            <input
              type="text"
              placeholder="From Address"
              value={fromAddress}
              onChange={(e) => setFromAddress(e.target.value)}
              className="input-box"
            />
            <input
              type="text"
              placeholder="To Address"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              className="input-box"
            />
            <input
              type="number"
              placeholder="Amount (SOL)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-box"
            />
            <button onClick={sendSol} className="send-button">
              Send SOL
            </button>
          </div>
          {sendingStatus && <p className="sending-status">{sendingStatus}</p>}
        </div>
      </div>

      <div className="card airdrop-view">
          <h2>Airdrop Tokens</h2>
          <div className="airdrop-form">
            <input
              type="text"
              placeholder="From Address"
              value={airdropFromAddress}
              onChange={(e) => setAirdropFromAddress(e.target.value)}
              className="input-box"
            />
            <input
              type="text"
              placeholder="Token Address"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="input-box"
            />
            {airdropRecipients.map((recipient, index) => (
              <div key={index} className="recipient-input">
                <input
                  type="text"
                  placeholder="To Address"
                  value={recipient.to_address}
                  onChange={(e) => handleRecipientChange(index, 'to_address', e.target.value)}
                  className="input-box"
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={recipient.amount}
                  onChange={(e) => handleRecipientChange(index, 'amount', e.target.value)}
                  className="input-box"
                />
                <button onClick={() => removeRecipient(index)} className="remove-button">
                  Remove
                </button>
              </div>
            ))}
            <button onClick={addRecipient} className="add-button">
              Add Recipient
            </button>
            <input
              type="number"
              placeholder="Priority Fee"
              value={priorityFee}
              onChange={(e) => setPriorityFee(Number(e.target.value))}
              className="input-box"
            />
            <button onClick={performAirdrop} className="airdrop-button">
              Perform Airdrop
            </button>
          </div>
          {airdropStatus && <p className="airdrop-status">{airdropStatus}</p>}
        </div>
        <div className="card collection-nfts-view">
          <h2>View Collection NFTs</h2>
          <div className="collection-nfts-form">
            <input
              type="text"
              placeholder="Collection Address"
              value={collectionAddress}
              onChange={(e) => setCollectionAddress(e.target.value)}
              className="input-box"
            />
            <input
              type="number"
              placeholder="Page"
              value={collectionPage}
              onChange={(e) => setCollectionPage(Number(e.target.value))}
              className="input-box"
            />
            <input
              type="number"
              placeholder="Size"
              value={collectionSize}
              onChange={(e) => setCollectionSize(Number(e.target.value))}
              className="input-box"
            />
            <button onClick={fetchCollectionNFTs} className="fetch-button" disabled={fetchingCollectionNFTs}>
              {fetchingCollectionNFTs ? 'Fetching...' : 'Fetch Collection NFTs'}
            </button>
          </div>
      
          {fetchingCollectionNFTs.length > 0 && (
            <div className="nft-grid">
              {fetchingCollectionNFTs.map((nft, index) => (
                <div key={index} className="nft-card">
                  <img src={nft.image_uri} alt={nft.name} className="nft-image" />
                  <h3>{nft.name}</h3>
                  <p>Symbol: {nft.symbol}</p>
                  <p>Royalty: {nft.royalty}%</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
   
  );
};
export default App;
