import { createContext, useState, useEffect } from 'react';
import { translations } from './translations';

export const I18nContext = createContext();

export const I18nProvider = ({ children }) => {
    const [lang, setLang] = useState(() => {
        const savedLang = localStorage.getItem('language');
        return savedLang || 'ar';
    });

    useEffect(() => {
        localStorage.setItem('language', lang);
        // Strict LTR requirement: Always force LTR regardless of language
        document.dir = 'ltr';
        document.documentElement.dir = 'ltr';
        document.documentElement.lang = lang;
    }, [lang]);

    const toggleLanguage = () => {
        setLang(prev => prev === 'ar' ? 'en' : 'ar');
    };

    const t = (key, params = {}) => {
        const keys = key.split('.');
        let value = translations[lang];

        for (const k of keys) {
            if (value && value[k]) {
                value = value[k];
            } else {
                return key;
            }
        }

        if (typeof value === 'string') {
            return value.replace(/\{(\w+)\}/g, (_, k) => params[k] !== undefined ? params[k] : `{${k}}`);
        }

        return value;
    };

    return (
        <I18nContext.Provider value={{ lang, toggleLanguage, t }}>
            {children}
        </I18nContext.Provider>
    );
};
