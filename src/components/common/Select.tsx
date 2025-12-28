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
            className={`px-3 py-2 font-bold text-white bg-transparent border-none cursor-pointer focus:outline-none ${className}`}
            {...props}
        >
            {options.map((option) => (
                <option key={option.value} value={option.value} className="text-black">
                    {option.label}
                </option>
            ))}
        </select>
    );
};
