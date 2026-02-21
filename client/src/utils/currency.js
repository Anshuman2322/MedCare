// Currency configuration and exchange rates (Live data from XE.com - November 15, 2025)
const CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar', rate: 1.0 },
  EUR: { symbol: '€', name: 'Euro', rate: 0.86032 },
  GBP: { symbol: '£', name: 'British Pound', rate: 0.75962 },
  INR: { symbol: '₹', name: 'Indian Rupee', rate: 88.8058 },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', rate: 1.4029 },
  AUD: { symbol: 'A$', name: 'Australian Dollar', rate: 1.53019 },
  JPY: { symbol: '¥', name: 'Japanese Yen', rate: 154.48 }
};

// Get available currencies
export const getAvailableCurrencies = () => {
  return Object.keys(CURRENCIES).map(code => ({
    code,
    ...CURRENCIES[code]
  }));
};

// Format price with currency
export const formatPrice = (price, currencyCode = 'USD') => {
  const currency = CURRENCIES[currencyCode];
  if (!currency) return `$${Number(price).toFixed(2)}`;
  
  const convertedPrice = Number(price) * currency.rate;
  
  // Special formatting for different currencies
  if (currencyCode === 'JPY') {
    return `${currency.symbol}${Math.round(convertedPrice).toLocaleString()}`;
  }
  
  return `${currency.symbol}${convertedPrice.toFixed(2)}`;
};

// Get currency symbol
export const getCurrencySymbol = (currencyCode = 'USD') => {
  return CURRENCIES[currencyCode]?.symbol || '$';
};

// Convert price between currencies
export const convertPrice = (price, fromCurrency = 'USD', toCurrency = 'USD') => {
  const fromRate = CURRENCIES[fromCurrency]?.rate || 1;
  const toRate = CURRENCIES[toCurrency]?.rate || 1;
  
  // Convert to USD first, then to target currency
  const usdPrice = Number(price) / fromRate;
  return usdPrice * toRate;
};