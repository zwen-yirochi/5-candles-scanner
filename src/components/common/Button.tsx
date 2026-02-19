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
        sm: 'px-3 py-1 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
    };

    return (
        <button className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`} {...props}>
            {children}
        </button>
    );
};
