import React, { useEffect, useState, createContext, useContext } from 'react';

// Simple dark mode store using localStorage + prefers-color-scheme fallback.
export function useDarkMode() {
	const [dark, setDark] = useState(() => {
		const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
		if (saved === 'dark') return true;
		if (saved === 'light') return false;
		// Fallback to OS preference
		return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
	});

	useEffect(() => {
		const root = document.documentElement;
		if (dark) {
			root.classList.add('dark');
			localStorage.setItem('theme', 'dark');
		} else {
			root.classList.remove('dark');
			localStorage.setItem('theme', 'light');
		}
	}, [dark]);

	return { dark, toggle: () => setDark((d) => !d), setDark };
}

// Currency Context for global state management
const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
	const [currency, setCurrency] = useState(() => {
		const saved = typeof window !== 'undefined' ? localStorage.getItem('preferred-currency') : null;
		return saved || 'USD';
	});

	useEffect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem('preferred-currency', currency);
		}
	}, [currency]);

	const value = React.useMemo(() => ({ currency, setCurrency }), [currency]);

	return (
		<CurrencyContext.Provider value={value}>
			{children}
		</CurrencyContext.Provider>
	);
}

// Currency hook that uses context
export function useCurrency() {
	const context = useContext(CurrencyContext);
	if (!context) {
		throw new Error('useCurrency must be used within a CurrencyProvider');
	}
	return context;
}

