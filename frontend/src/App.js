import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const App = () => {
  const [rates, setRates] = useState([]);
  const [filteredRates, setFilteredRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [activeTab, setActiveTab] = useState('rates'); // 'rates' or 'converter'

  // Fetch exchange rates data
  const fetchExchangeRates = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get('http://localhost:5000/api/rates');
      
      if (response.data.success) {
        setRates(response.data.data);
        setFilteredRates(response.data.data);
        setLastUpdate(new Date());
      } else {
        throw new Error(response.data.error || 'Failed to fetch data');
      }
    } catch (err) {
      console.error('API Error:', err);
      setError('Failed to fetch exchange rates. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Search filter
  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredRates(rates);
    } else {
      const filtered = rates.filter(rate =>
        rate.currency.toLowerCase().includes(term.toLowerCase()) ||
        getCurrencyName(rate.currency).toLowerCase().includes(term.toLowerCase())
      );
      setFilteredRates(filtered);
    }
  };

  useEffect(() => {
    fetchExchangeRates();
    const interval = setInterval(fetchExchangeRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app">
      <div className="container">
        <Header />
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        
        {activeTab === 'rates' ? (
          <>
            <Controls 
              searchTerm={searchTerm}
              onSearch={handleSearch}
              onRefresh={fetchExchangeRates}
              loading={loading}
            />
            
            {error && <Error message={error} />}
            
            {!error && (
              <>
                {loading && <Loading />}
                <RatesGrid rates={filteredRates} loading={loading} />
                {lastUpdate && <LastUpdate time={lastUpdate} />}
              </>
            )}
          </>
        ) : (
          <CurrencyConverter rates={rates} loading={loading} />
        )}
      </div>
    </div>
  );
};

const Header = () => (
  <div className="header">
    <h1>💱 Real-time Exchange Rates</h1>
    <p>Get the latest CNY exchange rate information and convert currencies</p>
  </div>
);

const TabNavigation = ({ activeTab, onTabChange }) => (
  <div className="tab-navigation">
    <button 
      className={`tab-button ${activeTab === 'rates' ? 'active' : ''}`}
      onClick={() => onTabChange('rates')}
    >
      📊 Exchange Rates
    </button>
    <button 
      className={`tab-button ${activeTab === 'converter' ? 'active' : ''}`}
      onClick={() => onTabChange('converter')}
    >
      🔄 Currency Converter
    </button>
  </div>
);

const CurrencyConverter = ({ rates, loading }) => {
  const [fromAmount, setFromAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState('CNY');
  const [toCurrency, setToCurrency] = useState('USD');
  const [result, setResult] = useState(null);

  // Get all available currencies (including CNY) in English
  const getAllCurrencies = () => {
    const currencies = [{ currency: 'CNY', currencyName: 'Chinese Yuan' }];
    rates.forEach(rate => {
      currencies.push({
        currency: rate.currency,
        currencyName: getCurrencyName(rate.currency)
      });
    });
    return currencies;
  };

  // Convert currency
  const convertCurrency = () => {
    if (!fromAmount || isNaN(fromAmount)) {
      setResult(null);
      return;
    }

    const amount = parseFloat(fromAmount);
    
    if (fromCurrency === toCurrency) {
      setResult(amount);
      return;
    }

    // Get conversion rate
    let conversionRate = 1;
    
    if (fromCurrency === 'CNY') {
      // Convert from CNY to other currency
      const targetRate = rates.find(r => r.currency === toCurrency);
      if (targetRate) {
        conversionRate = 1 / targetRate.rate;
      }
    } else if (toCurrency === 'CNY') {
      // Convert from other currency to CNY
      const sourceRate = rates.find(r => r.currency === fromCurrency);
      if (sourceRate) {
        conversionRate = sourceRate.rate;
      }
    } else {
      // Convert between two foreign currencies (via CNY)
      const sourceRate = rates.find(r => r.currency === fromCurrency);
      const targetRate = rates.find(r => r.currency === toCurrency);
      if (sourceRate && targetRate) {
        conversionRate = sourceRate.rate / targetRate.rate;
      }
    }
    
    setResult(amount * conversionRate);
  };

  // Swap currencies
  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  // Auto-convert when values change
  useEffect(() => {
    if (rates.length > 0) {
      convertCurrency();
    }
  }, [fromAmount, fromCurrency, toCurrency, rates]);

  const currencies = getAllCurrencies();
  const fromRate = rates.find(r => r.currency === fromCurrency);
  const toRate = rates.find(r => r.currency === toCurrency);

  return (
    <div className="currency-converter">
      <div className="converter-header">
        <h2>🔄 Currency Converter</h2>
        <p>Convert between different currencies using real-time exchange rates</p>
      </div>

      <div className="converter-content">
        <div className="converter-row">
          <div className="amount-input">
            <label>Amount</label>
            <input
              type="number"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              placeholder="Enter amount"
              min="0"
              step="0.01"
            />
          </div>
          
          <div className="currency-select">
            <label>From</label>
            <select 
              value={fromCurrency} 
              onChange={(e) => setFromCurrency(e.target.value)}
            >
              {currencies.map(curr => (
                <option key={curr.currency} value={curr.currency}>
                  {getCurrencyFlag(curr.currency)} {curr.currency} - {curr.currencyName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="converter-arrow">
          <button className="swap-button" onClick={swapCurrencies} title="Swap currencies">
            ⇅
          </button>
        </div>

        <div className="converter-row">
          <div className="result-display">
            <label>Converted Amount</label>
            <div className="result-value">
              {result !== null ? (
                `${getCurrencySymbol(toCurrency)}${result.toFixed(4)}`
              ) : (
                'Enter amount'
              )}
            </div>
          </div>
          
          <div className="currency-select">
            <label>To</label>
            <select 
              value={toCurrency} 
              onChange={(e) => setToCurrency(e.target.value)}
            >
              {currencies.map(curr => (
                <option key={curr.currency} value={curr.currency}>
                  {getCurrencyFlag(curr.currency)} {curr.currency} - {curr.currencyName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {result !== null && fromAmount && (
          <div className="conversion-info">
            <p><strong>Exchange Rate:</strong></p>
            <p>1 {fromCurrency} = {(result / parseFloat(fromAmount)).toFixed(6)} {toCurrency}</p>
            <p>1 {toCurrency} = {(parseFloat(fromAmount) / result).toFixed(6)} {fromCurrency}</p>
            
            {(fromRate || toRate) && (
              <p style={{marginTop: '10px', fontSize: '0.9em', color: '#888'}}>
                <em>Rates updated: {fromRate?.updateTime || toRate?.updateTime || 'Live'}</em>
              </p>
            )}
          </div>
        )}

        {loading && (
          <div className="converter-loading">
            <p>🔄 Updating exchange rates...</p>
          </div>
        )}
      </div>
    </div>
  );
};

const Controls = ({ searchTerm, onSearch, onRefresh, loading }) => (
  <div className="controls">
    <div className="search-box">
      <input
        type="text"
        className="search-input"
        placeholder="Search currency (e.g., USD, EUR, Japanese Yen)"
        value={searchTerm}
        onChange={(e) => onSearch(e.target.value)}
      />
      <button 
        className="refresh-btn" 
        onClick={onRefresh}
        disabled={loading}
      >
        🔄 {loading ? 'Loading...' : 'Refresh Data'}
      </button>
    </div>
  </div>
);

const Loading = () => (
  <div className="loading">
    <div className="spinner"></div>
    <p>Fetching latest exchange rates...</p>
  </div>
);

const Error = ({ message }) => (
  <div className="error">
    <h3>⚠️ Connection Error</h3>
    <p>{message}</p>
    <p>Make sure your backend server is running on port 5000</p>
  </div>
);

const RatesGrid = ({ rates, loading }) => {
  if (loading) return null;
  
  if (rates.length === 0) {
    return <div className="no-data">No matching currencies found</div>;
  }

  return (
    <div className="rates-grid">
      {rates.map((rate, index) => (
        <RateCard key={index} rate={rate} />
      ))}
    </div>
  );
};

const RateCard = ({ rate }) => {
  const spread = ((rate.sellRate - rate.buyRate) / rate.buyRate * 100).toFixed(2);
  
  return (
    <div className="rate-card">
      <div className="currency-header">
        <div className="currency-flag">{getCurrencyFlag(rate.currency)}</div>
        <div className="currency-info">
          <h3>{rate.currency}</h3>
          <p>{getCurrencyName(rate.currency)}</p>
          {rate.currencyName && (
            <p className="chinese-name">{rate.currencyName}</p>
          )}
        </div>
        <div className="spread">
          <span className="spread-label">Spread</span>
          <span className="spread-value">{spread}%</span>
        </div>
      </div>
      
      <div className="rate-details">
        <div className="rate-row main-rate">
          <span className="rate-label">Mid Rate</span>
          <span className="rate-value">¥{rate.rate.toFixed(4)}</span>
        </div>
        
        <div className="rate-comparison">
          <div className="rate-item buy">
            <span className="rate-type">Buy</span>
            <span className="rate-price">¥{rate.buyRate.toFixed(4)}</span>
          </div>
          <div className="rate-divider">|</div>
          <div className="rate-item sell">
            <span className="rate-type">Sell</span>
            <span className="rate-price">¥{rate.sellRate.toFixed(4)}</span>
          </div>
        </div>
        
        <div className="rate-trend">
          <span className="trend-indicator">🕐</span>
          <span className="trend-text">
            {rate.updateTime ? `Updated: ${rate.updateTime}` : 'Live rates'}
          </span>
        </div>
      </div>
    </div>
  );
};

const LastUpdate = ({ time }) => (
  <div className="last-update">
    <span className="update-icon">🕐</span>
    Last updated: {time.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })}
  </div>
);

// Helper functions
const getCurrencyFlag = (currency) => {
  const flags = {
    'CNY': '🇨🇳',
    'USD': '🇺🇸',
    'EUR': '🇪🇺', 
    'GBP': '🇬🇧',
    'JPY': '🇯🇵',
    'AUD': '🇦🇺',
    'CAD': '🇨🇦',
    'CHF': '🇨🇭',
    'HKD': '🇭🇰',
    'SGD': '🇸🇬',
    'NZD': '🇳🇿'
  };
  return flags[currency] || '💰';
};

const getCurrencySymbol = (currency) => {
  const symbols = {
    'CNY': '¥',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'AUD': 'A$',
    'CAD': 'C$',
    'CHF': 'CHF ',
    'HKD': 'HK$',
    'SGD': 'S$',
    'NZD': 'NZ$'
  };
  return symbols[currency] || '';
};

const getCurrencyName = (currency) => {
  const names = {
    'CNY': 'Chinese Yuan',
    'USD': 'US Dollar',
    'EUR': 'Euro',
    'GBP': 'British Pound Sterling',
    'JPY': 'Japanese Yen',
    'AUD': 'Australian Dollar',
    'CAD': 'Canadian Dollar',
    'CHF': 'Swiss Franc',
    'HKD': 'Hong Kong Dollar',
    'SGD': 'Singapore Dollar',
    'NZD': 'New Zealand Dollar'
  };
  return names[currency] || currency;
};

export default App;