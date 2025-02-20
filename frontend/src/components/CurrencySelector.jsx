import Select from "react-select";

const currencyToCountryCode = {
    USD: "us", AED: "ae", AFN: "af", ALL: "al", AMD: "am", ANG: "an", AOA: "ao", 
    ARS: "ar", AUD: "au", AWG: "aw", AZN: "az", BAM: "ba", BBD: "bb", BDT: "bd", 
    BGN: "bg", BHD: "bh", BIF: "bi", BMD: "bm", BND: "bn", BOB: "bo", BRL: "br", 
    BSD: "bs", BTN: "bt", BWP: "bw", BYN: "by", BZD: "bz", CAD: "ca", CDF: "cd", 
    CHF: "ch", CLP: "cl", CNY: "cn", COP: "co", CRC: "cr", CUP: "cu", CVE: "cv", 
    CZK: "cz", DJF: "dj", DKK: "dk", DOP: "do", DZD: "dz", EGP: "eg", ERN: "er", 
    ETB: "et", EUR: "eu", FJD: "fj", FKP: "fk", FOK: "fo", GBP: "gb", GEL: "ge", 
    GGP: "gg", GHS: "gh", GIP: "gi", GMD: "gm", GNF: "gn", GTQ: "gt", GYD: "gy", 
    HKD: "hk", HNL: "hn", HRK: "hr", HTG: "ht", HUF: "hu", IDR: "id", ILS: "il", 
    IMP: "im", INR: "in", IQD: "iq", IRR: "ir", ISK: "is", JEP: "je", JMD: "jm", 
    JOD: "jo", JPY: "jp", KES: "ke", KGS: "kg", KHR: "kh", KID: "ki", KMF: "km", 
    KRW: "kr", KWD: "kw", KYD: "ky", KZT: "kz", LAK: "la", LBP: "lb", LKR: "lk", 
    LRD: "lr", LSL: "ls", LYD: "ly", MAD: "ma", MDL: "md", MGA: "mg", MKD: "mk", 
    MMK: "mm", MNT: "mn", MOP: "mo", MRU: "mr", MUR: "mu", MVR: "mv", MWK: "mw", 
    MXN: "mx", MYR: "my", MZN: "mz", NAD: "na", NGN: "ng", NIO: "ni", NOK: "no", 
    NPR: "np", NZD: "nz", OMR: "om", PAB: "pa", PEN: "pe", PGK: "pg", PHP: "ph", 
    PKR: "pk", PLN: "pl", PYG: "py", QAR: "qa", RON: "ro", RSD: "rs", RUB: "ru", 
    RWF: "rw", SAR: "sa", SBD: "sb", SCR: "sc", SDG: "sd", SEK: "se", SGD: "sg", 
    SHP: "sh", SLL: "sl", SOS: "so", SRD: "sr", SSP: "ss", STN: "st", SYP: "sy", 
    SZL: "sz", THB: "th", TJS: "tj", TMT: "tm", TND: "tn", TOP: "to", TRY: "tr", 
    TTD: "tt", TVD: "tv", TWD: "tw", TZS: "tz", UAH: "ua", UGX: "ug",
    UYU: "uy", UZS: "uz", VES: "ve", VND: "vn", VUV: "vu", WST: "ws", XAF: "cm", 
    XCD: "ag", XOF: "sn", XPF: "pf", YER: "ye", ZAR: "za", ZMW: "zm", ZWL: "zw"
  };
  
  
  const currencyOptions = Object.entries(currencyToCountryCode).map(([currency, countryCode]) => ({
  value: currency,
  label: (
    <div className="flex items-center">
      <img
        src={`https://flagcdn.com/w40/${countryCode}.png`}
        alt={currency}
        className="w-6 h-4 mr-2"
      />
      {currency}
    </div>
  ),
}));

const CurrencySelector = ({ selectedCurrency, onChange }) => {
  return (
    <Select
      options={currencyOptions}
      value={currencyOptions.find((option) => option.value === selectedCurrency)}
      onChange={(selected) => onChange(selected.value)}
      className="w-40"
    />
  );
};

export default CurrencySelector;
