
import React from 'react';

interface AlertProps {
    message: string;
    type: 'success' | 'error' | 'info';
}

export const Alert: React.FC<AlertProps> = ({ message, type }) => {
    const baseClasses = "p-4 rounded-md flex items-center";
    const typeClasses = {
        success: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
        error: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
        info: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
    };

    const icon = {
        error: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
        ),
        success: (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
        ),
         info: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
        )
    };

    return (
        <div className={`${baseClasses} ${typeClasses[type]}`}>
            {icon[type]}
            <p className="text-sm font-medium">{message}</p>
        </div>
    );
};
