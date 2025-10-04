import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import { addUserAlert } from './services/alertService';

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

// Component definitions
const Header = () => {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <div className="header">
      <div className="header-content">
        <div className="header-text">
          <h1>💱 Real-time Exchange Rates</h1>
          <p>Smart currency monitoring with instant alerts and seamless conversions</p>
        </div>

        {currentUser && (
          <div className="user-info">
            <div className="user-details">
              {currentUser.photoURL && (
                <img
                  src={currentUser.photoURL}
                  alt="Profile"
                  className="user-avatar"
                />
              )}
              <div className="user-text">
                <span className="user-name">
                  {currentUser.displayName || currentUser.email}
                </span>
                <span className="user-email">{currentUser.email}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

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
    <button
      className={`tab-button ${activeTab === 'alerts' ? 'active' : ''}`}
      onClick={() => onTabChange('alerts')}
    >
      🔔 Rate Alerts
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
        <p>Real-time rates, instant conversions</p>
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

const RateAlerts = ({ rates }) => {
  const { currentUser } = useAuth();
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('CNY');
  const [threshold, setThreshold] = useState('');
  const [conditionType, setConditionType] = useState('below'); // 'below' or 'above'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Add new alert
  const addAlert = async (e) => {
    e.preventDefault();
    if (!threshold) {
      setMessage('Please enter a threshold value');
      return;
    }

    if (!currentUser) {
      setMessage('You must be logged in to set alerts');
      return;
    }

    setLoading(true);
    try {
      await addUserAlert(currentUser.uid, currentUser.email, {
        fromCurrency,
        toCurrency,
        threshold: parseFloat(threshold),
        conditionType
      });

      setMessage(`🎉 Alert created! We'll notify you when ${fromCurrency}/${toCurrency} goes ${conditionType} ${threshold}.`);
      setThreshold('');
    } catch (error) {
      console.error('Error adding alert:', error);
      setMessage('❌ Failed to create alert. Please try again.');
    }
    setLoading(false);

    // Clear message after 4 seconds
    setTimeout(() => setMessage(''), 4000);
  };

  // Get available currencies (including CNY)
  const getAllCurrencies = () => {
    const currencies = [{ code: 'CNY', name: 'Chinese Yuan' }];
    rates.forEach(rate => {
      currencies.push({
        code: rate.currency,
        name: getCurrencyName(rate.currency)
      });
    });
    return currencies;
  };

  // Get current rate for the selected pair
  const getCurrentRate = () => {
    if (fromCurrency === 'CNY' && toCurrency === 'CNY') return 1;

    if (fromCurrency === 'CNY') {
      // CNY to other currency
      const targetRate = rates.find(r => r.currency === toCurrency);
      return targetRate ? (1 / targetRate.rate) : null;
    } else if (toCurrency === 'CNY') {
      // Other currency to CNY
      const sourceRate = rates.find(r => r.currency === fromCurrency);
      return sourceRate ? sourceRate.rate : null;
    } else {
      // Between two foreign currencies (via CNY)
      const sourceRate = rates.find(r => r.currency === fromCurrency);
      const targetRate = rates.find(r => r.currency === toCurrency);
      return (sourceRate && targetRate) ? (sourceRate.rate / targetRate.rate) : null;
    }
  };

  const currentRate = getCurrentRate();
  const allCurrencies = getAllCurrencies();

  // Swap currencies
  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <div className="rate-alerts-redesign">
      {/* Message Display */}
      {message && (
        <div className={`modern-alert ${message.includes('❌') ? 'error' : 'success'}`}>
          <div className="alert-content">
            <span className="alert-text">{message}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="alerts-main">
        <div className="alert-creator">
          <div className="creator-header">
            <h2>Create Currency Alert</h2>
            <p>Set up personalized notifications for any currency pair</p>
          </div>

          <form onSubmit={addAlert} className="modern-form">
            {/* Currency Pair Selection Card */}
            <div className="form-card">
              <div className="card-header">
                <div className="card-icon">💱</div>
                <div className="card-title">
                  <h3>Select Currency Pair</h3>
                  <p>Choose the currencies you want to monitor</p>
                </div>
              </div>

              <div className="currency-pair-container">
                <div className="currency-selector">
                  <label>From Currency</label>
                  <select
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value)}
                    className="currency-select"
                  >
                    {allCurrencies.map(currency => (
                      <option key={currency.code} value={currency.code}>
                        {getCurrencyFlag(currency.code)} {currency.code} - {currency.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="swap-container">
                  <button type="button" onClick={swapCurrencies} className="swap-btn">
                    ⇄
                  </button>
                </div>

                <div className="currency-selector">
                  <label>To Currency</label>
                  <select
                    value={toCurrency}
                    onChange={(e) => setToCurrency(e.target.value)}
                    className="currency-select"
                  >
                    {allCurrencies.map(currency => (
                      <option key={currency.code} value={currency.code}>
                        {getCurrencyFlag(currency.code)} {currency.code} - {currency.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {currentRate && (
                <div className="current-rate-display">
                  <span className="rate-label">Current Rate:</span>
                  <span className="rate-value">
                    1 {fromCurrency} = {currentRate.toFixed(6)} {toCurrency}
                  </span>
                </div>
              )}
            </div>

            {/* Alert Condition Card */}
            <div className="form-card">
              <div className="card-header">
                <div className="card-icon">🎯</div>
                <div className="card-title">
                  <h3>Set Alert Condition</h3>
                  <p>Define when you want to be notified</p>
                </div>
              </div>

              <div className="condition-container">
                <div className="condition-text">
                  Notify me when 1 {fromCurrency} is
                </div>

                <div className="condition-inputs">
                  <select
                    value={conditionType}
                    onChange={(e) => setConditionType(e.target.value)}
                    className="condition-select"
                  >
                    <option value="below">below</option>
                    <option value="above">above</option>
                  </select>

                  <input
                    type="number"
                    step="0.000001"
                    min="0"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    placeholder="Enter threshold..."
                    className="threshold-input"
                    required
                  />

                  <span className="currency-label">{toCurrency}</span>
                </div>

                {currentRate && threshold && (
                  <div className="condition-status">
                    {(conditionType === 'below' && parseFloat(threshold) >= currentRate) ||
                     (conditionType === 'above' && parseFloat(threshold) <= currentRate) ? (
                      <span className="status-badge immediate">
                        🚨 Will trigger immediately
                      </span>
                    ) : (
                      <span className="status-badge waiting">
                        ⏰ Waiting for condition to be met
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading} className="create-alert-btn">
              <span className="btn-icon">{loading ? '⏳' : '🚀'}</span>
              <span className="btn-text">
                {loading ? 'Creating Alert...' : 'Create Alert'}
              </span>
            </button>
          </form>

          {/* Info Section */}
          <div className="info-section">
            <div className="info-card">
              <div className="info-icon">📧</div>
              <div className="info-content">
                <h4>Email Notifications</h4>
                <p>Get instant email alerts sent to {currentUser?.email}</p>
              </div>
            </div>
            <div className="info-card">
              <div className="info-icon">⚡</div>
              <div className="info-content">
                <h4>Real-time Monitoring</h4>
                <p>We check rates every 5 minutes to ensure you never miss an opportunity</p>
              </div>
            </div>
            <div className="info-card">
              <div className="info-icon">🔒</div>
              <div className="info-content">
                <h4>Secure & Private</h4>
                <p>Your alerts are encrypted and stored securely in the cloud</p>
              </div>
            </div>
          </div>
        </div>
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
        <RateCard key={index} rate={rate} index={index} />
      ))}
    </div>
  );
};

const RateCard = ({ rate, index }) => {
  const spread = ((rate.sellRate - rate.buyRate) / rate.buyRate * 100).toFixed(2);

  return (
    <div
      className="rate-card"
      style={{
        animationDelay: `${index * 0.1}s`,
        '--card-index': index
      }}
    >
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

// Main Dashboard Component (protected)
const Dashboard = () => {
  const [rates, setRates] = useState([]);
  const [filteredRates, setFilteredRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [activeTab, setActiveTab] = useState('rates'); // 'rates', 'converter', or 'alerts'

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
        ) : activeTab === 'converter' ? (
          <CurrencyConverter rates={rates} loading={loading} />
        ) : (
          <RateAlerts rates={rates} />
        )}
      </div>
    </div>
  );
};

// Main App Component with Authentication
const AppContent = () => {
  const { currentUser } = useAuth();

  return currentUser ? <Dashboard /> : <Login />;
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;