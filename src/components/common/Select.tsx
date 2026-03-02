import React from 'react';

export interface SelectOption {
    value: string;

    label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
    options: readonly SelectOption[];

    value: string;

    onChange: (value: string) => void;
}

export const Select: React.FC<SelectProps> = ({ options, value, onChange, className = '', ...props }) => {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`px-1.5 sm:px-3 py-1 sm:py-3 text-xs sm:text-base font-bold text-gray-800 bg-transparent border-none cursor-pointer focus:outline-none min-h-[28px] sm:min-h-[44px] ${className}`}
            {...props}
        >
            {options.map((option) => (
                <option key={option.value} value={option.value} className="text-gray-800 bg-white">
                    {option.label}
                </option>
            ))}
        </select>
    );
};
