import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
    isDark: boolean;
    toggleTheme: () => void;
    currency: string;
    setCurrency: (c: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isDark, setIsDark] = useState(() => {
        try {
            if (typeof window !== 'undefined') {
                const saved = localStorage.getItem('emerald_theme');
                // Default to TRUE (Dark Mode) if no preference saved
                return saved ? JSON.parse(saved) : true;
            }
        } catch (e) { console.error("Theme Load Error", e); }
        return true; 
    });

    const [currency, setCurrency] = useState(() => {
        try {
            if (typeof window !== 'undefined') return localStorage.getItem('emerald_currency') || '₹';
        } catch (e) { console.error("Currency Load Error", e); }
        return '₹';
    });

    useEffect(() => { localStorage.setItem('emerald_theme', JSON.stringify(isDark)); }, [isDark]);
    useEffect(() => { localStorage.setItem('emerald_currency', currency); }, [currency]);

    const toggleTheme = () => setIsDark(!isDark);

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme, currency, setCurrency }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
};