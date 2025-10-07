import React from 'react';
import { useLanguage } from '../hooks/useLanguage';

export const Header: React.FC = () => {
    const { language, switchLanguage, t } = useLanguage();

    const handleLanguageToggle = () => {
        const newLang = language === 'ar' ? 'en' : 'ar';
        switchLanguage(newLang);
    };

    return (
        <header className="bg-white dark:bg-gray-800 shadow-md">
            <div className="container mx-auto px-4 py-4 md:px-8 flex justify-between items-center">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 019 17v-1.586l-3.707-3.707A1 1 0 015 11V3zm2 2v5.586l3 3V7a1 1 0 012 0v4.586l3-3V5H5z" clipRule="evenodd" />
                    </svg>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('ganttGenAI')}</h1>
                </div>
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                     <p className="hidden md:block text-sm text-gray-500 dark:text-gray-400">{t('appDescription')}</p>
                     <button
                        onClick={handleLanguageToggle}
                        className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                        aria-label={`Switch to ${language === 'ar' ? 'English' : 'Arabic'}`}
                    >
                        {language === 'ar' ? t('switchToEnglish') : t('switchToArabic')}
                    </button>
                </div>
            </div>
        </header>
    );
};
