import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CurrencyConverterPage from "./pages/CurrencyConverter";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CurrencyConverterPage />} />
      </Routes>
    </Router>
  );
}

export default App;
