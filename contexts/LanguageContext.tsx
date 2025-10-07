import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';

type Language = 'ar' | 'en';
type Translations = Record<string, string>;

interface LanguageContextType {
    language: Language;
    translations: Translations;
    t: (key: string, replacements?: Record<string, string | number>) => string;
    switchLanguage: (lang: Language) => void;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('ar');
    const [translations, setTranslations] = useState<Translations>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const html = document.documentElement;
        html.lang = language;
        html.dir = language === 'ar' ? 'rtl' : 'ltr';

        setIsLoading(true);
        // Fetch the translation file based on the selected language.
        // The path is relative to the public root directory where index.html is served.
        fetch(`./locales/${language}.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network response was not ok for ${language}.json`);
                }
                return response.json();
            })
            .then(data => {
                setTranslations(data);
            })
            .catch(error => {
                console.error("Failed to load translation file:", error);
                setTranslations({}); // Fallback to empty translations on error
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [language]);

    const switchLanguage = (lang: Language) => {
        setLanguage(lang);
    };

    const t = useCallback((key: string, replacements?: Record<string, string | number>): string => {
        let translation = translations[key] || key; // Fallback to the key if not found
        if (replacements) {
            Object.entries(replacements).forEach(([placeholder, value]) => {
                translation = translation.replace(`{${placeholder}}`, String(value));
            });
        }
        return translation;
    }, [translations]);
    

    const value = {
        language,
        translations,
        t,
        switchLanguage,
    };

    // Prevent rendering children until the initial translations are loaded to avoid a flash of untranslated text.
    if (isLoading && Object.keys(translations).length === 0) {
        return null; 
    }

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};