'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import enTranslations from '../locales/en.json';
import zhTranslations from '../locales/zh.json';

const translations = {
  en: enTranslations,
  zh: zhTranslations
};

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export function LanguageProvider({ children }) {
  // 默认语言为英文，如果浏览器本地存储有语言设置则使用存储的设置
  const [locale, setLocale] = useState('en');
  const [messages, setMessages] = useState(translations.en);

  // 在组件挂载时从localStorage加载语言设置
  useEffect(() => {
    const savedLocale = localStorage.getItem('language') || 'en';
    setLocale(savedLocale);
    setMessages(translations[savedLocale] || translations.en);
  }, []);

  // 更改语言设置并保存到localStorage
  const changeLocale = (newLocale) => {
    if (translations[newLocale]) {
      setLocale(newLocale);
      setMessages(translations[newLocale]);
      localStorage.setItem('language', newLocale);
    }
  };

  // 翻译函数，接受一个键路径（如 "youtube.title"）并返回翻译
  const t = (key) => {
    const keys = key.split('.');
    let result = messages;

    for (const k of keys) {
      if (result && result[k]) {
        result = result[k];
      } else {
        // 如果找不到翻译，返回键本身
        return key;
      }
    }

    return result;
  };

  return (
    <LanguageContext.Provider value={{ locale, changeLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
