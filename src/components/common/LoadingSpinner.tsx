import React from 'react';

export interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', message }) => {
    const sizeStyles = {
        sm: 'w-6 h-6 border-2',
        md: 'w-12 h-12 border-4',
        lg: 'w-16 h-16 border-4',
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
            <div
                className={`${sizeStyles[size]} mb-4 border-blue-500 rounded-full border-t-transparent animate-spin`}
            />
            {message && <p className="text-gray-400">{message}</p>}
        </div>
    );
};
