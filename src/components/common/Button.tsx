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
    const baseStyles = 'font-medium transition-colors rounded';
    const variantStyles = {
        primary: 'text-white bg-blue-600 hover:bg-blue-700',
        secondary: 'text-gray-400 hover:text-white hover:bg-gray-800',
        ghost: active ? 'text-white bg-gray-700' : 'text-gray-400 hover:text-white hover:bg-gray-800',
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
