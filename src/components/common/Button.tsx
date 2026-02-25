import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    active?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    active = false,
    className = '',
    ...props
}) => {
    const baseStyles = 'font-medium transition-colors rounded-full';
    const variantStyles = {
        primary: 'text-white bg-gray-800 hover:bg-gray-700',
        secondary: 'text-gray-500 hover:text-gray-800 hover:bg-gray-100',
        ghost: active ? 'text-white bg-gray-800' : 'text-gray-400 hover:text-gray-800 hover:bg-gray-100',
    };

    const sizeStyles = {
        sm: 'px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm min-h-[36px] sm:min-h-[44px] min-w-[36px] sm:min-w-[44px]',
        md: 'px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base min-h-[36px] sm:min-h-[44px] min-w-[36px] sm:min-w-[44px]',
        lg: 'px-4 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg min-h-[44px]',
    };

    return (
        <button className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`} {...props}>
            {children}
        </button>
    );
};
