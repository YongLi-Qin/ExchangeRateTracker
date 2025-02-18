import { useState } from "react";
import CurrencySelector from "../components/CurrencySelector";
import { FaExchangeAlt } from "react-icons/fa";

const exchangeRates = {
  USD: 1, AED: 3.6725, AUD: 1.5742, CAD: 1.4182, CNY: 7.2626, EUR: 0.9533, 
  GBP: 0.7948, JPY: 152.3479,
};

const CurrencyConverterPage = () => {
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("CAD");
  const [amount, setAmount] = useState("1,000");

  // 计算转换金额
  const convertCurrency = (inputAmount = amount, from = fromCurrency, to = toCurrency) => {
    const numericAmount = parseFloat(inputAmount.replace(/,/g, ""));
    if (!isNaN(numericAmount) && exchangeRates[from] && exchangeRates[to]) {
      return ((numericAmount * exchangeRates[to]) / exchangeRates[from]).toFixed(2);
    }
    return "0.00";
  };

  // 交换货币并重新计算
  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <div className="h-screen w-screen flex justify-center items-center bg-green-900 p-4">
      <div className="bg-white p-6 rounded-2xl shadow-lg max-w-4xl w-full">
        <div className="flex justify-between items-center mb-4">
          <div className="w-1/2">
            <label className="text-gray-600">Gold</label>
            <div className="relative flex items-center border rounded-lg px-4 py-2">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-2/3 text-2xl font-semibold outline-none border-none"
              />
              <CurrencySelector selectedCurrency={fromCurrency} onChange={setFromCurrency} />
            </div>
          </div>

          {/* 交换货币按钮 */}
          <button onClick={swapCurrencies} className="text-green-700 mx-4">
            <FaExchangeAlt size={24} />
          </button>

          {/* 目标货币输入框 */}
          <div className="w-1/2">
            <label className="text-gray-600">Transfer To</label>
            <div className="relative flex items-center border rounded-lg px-4 py-2">
              <input
                type="text"
                value={convertCurrency()}
                readOnly
                className="w-2/3 text-2xl font-semibold outline-none border-none bg-transparent"
              />
              <CurrencySelector selectedCurrency={toCurrency} onChange={setToCurrency} />
            </div>
          </div>
        </div>

        {/* 汇率信息 */}
        <p className="text-gray-700 text-lg font-semibold text-center">
          {amount} {fromCurrency} = <span className="text-green-700 font-bold">{convertCurrency()} {toCurrency}</span>
        </p>
        <p className="text-gray-500 text-sm mt-1 text-center">
          Real Time Currency Rate
        </p>

       
      </div>
    </div>
  );
};

export default CurrencyConverterPage;
