import React, { createContext, useContext, useState, useEffect } from 'react';
import dictionary from '../translations/dictionary';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('agrisense_lang');
    if (savedLang) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (code) => {
    setLanguageState(code);
    localStorage.setItem('agrisense_lang', code);
  };

  const t = (key) => {
    const keys = key.split('.');
    let val = dictionary[language];
    for (const k of keys) {
      if (val === undefined) break;
      val = val[k];
    }
    
    // Fallback to English if translation is missing
    if (val === undefined) {
      val = dictionary['en'];
      for (const k of keys) {
        if (val === undefined) break;
        val = val[k];
      }
    }
    
    return val || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
