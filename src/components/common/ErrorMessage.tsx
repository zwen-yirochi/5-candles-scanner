import React from 'react';

import { Button } from './Button';

export interface ErrorMessageProps {
    title?: string;

    message: string;

    onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
    title = '오류 발생',

    message,

    onRetry,
}) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
            <div className="p-4 mb-4 text-red-400 bg-red-900 border border-red-700 rounded-lg">
                <p className="font-bold">{title}</p>

                <p>{message}</p>
            </div>

            {onRetry && (
                <Button variant="primary" onClick={onRetry}>
                    다시 시도
                </Button>
            )}
        </div>
    );
};
