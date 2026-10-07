import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  }, [theme]);

  const setThemeMode = useCallback((newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    toggleTheme,
    setTheme: setThemeMode,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  }), [theme, toggleTheme, setThemeMode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 