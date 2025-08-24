import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Theme {
  isDark: boolean;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    accent: string;
    success: string;
    error: string;
    warning: string;
  };
}

const lightTheme: Theme = {
  isDark: false,
  colors: {
    primary: '#1a434e',
    secondary: '#0f4c75',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    text: '#1a434e',
    textSecondary: '#666666',
    border: '#E5E5EA',
    accent: '#1a434e',
    success: '#34C759',
    error: '#FF3B30',
    warning: '#FF9500',
  },
};

const darkTheme: Theme = {
  isDark: true,
  colors: {
    primary: '#cdc2dc',
    secondary: '#b8a9c9',
    background: '#000000',
    surface: '#1a1a1a',
    text: '#cdc2dc',
    textSecondary: '#cdc2dc',
    border: '#cdc2dc',
    accent: '#cdc2dc',
    success: '#30D158',
    error: '#FF453A',
    warning: '#FF9F0A',
  },
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(lightTheme);

  useEffect(() => {
    // Load saved theme preference
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_preference');
      if (savedTheme) {
        const isDark = JSON.parse(savedTheme);
        setThemeState(isDark ? darkTheme : lightTheme);
      }
    } catch (error) {
      console.log('Error loading theme preference:', error);
    }
  };

  const saveThemePreference = async (isDark: boolean) => {
    try {
      await AsyncStorage.setItem('theme_preference', JSON.stringify(isDark));
    } catch (error) {
      console.log('Error saving theme preference:', error);
    }
  };

  const setTheme = (isDark: boolean) => {
    const newTheme = isDark ? darkTheme : lightTheme;
    setThemeState(newTheme);
    saveThemePreference(isDark);
  };

  const toggleTheme = () => {
    setTheme(!theme.isDark);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
