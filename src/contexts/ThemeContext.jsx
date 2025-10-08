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
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

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
    
    const root = document.documentElement;
    if (theme === 'dark') {
      root.style.setProperty('--bg-color', '#111827');
      root.style.setProperty('--text-color', '#f9fafb');
      root.style.setProperty('--text-secondary', '#374151');
      root.style.setProperty('--border-color', '#374151');
    } else {
      root.style.setProperty('--bg-color', '#ffffff');
      root.style.setProperty('--text-color', '#374151');
      root.style.setProperty('--text-secondary', '#6b7280');
      root.style.setProperty('--border-color', '#e5e7eb');
    }
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

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