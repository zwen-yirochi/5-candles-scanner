// components/chart/PatternControlPanel.tsx
import { useAtom } from 'jotai';
import React from 'react';
import { enabledPatternsAtom, TimeFrame } from '../../stores/atoms/patternAtoms';
import { TIMEFRAME_COLORS, TIMEFRAME_LABELS } from '../../utils/timeframeColors';

export const PatternControlPanel: React.FC = () => {
    const [enabledPatterns, setEnabledPatterns] = useAtom(enabledPatternsAtom);

    const toggleTimeframe = (timeframe: TimeFrame) => {
        setEnabledPatterns((prev) => ({
            ...prev,
            [timeframe]: !prev[timeframe],
        }));
    };

    return (
        <div className="flex items-center gap-3 p-3 bg-gray-800 border border-gray-700 rounded-lg">
            <span className="text-sm font-medium text-gray-400">패턴 표시:</span>

            {(Object.keys(TIMEFRAME_LABELS) as TimeFrame[]).map((timeframe) => {
                const isEnabled = enabledPatterns[timeframe];
                const colors = TIMEFRAME_COLORS[timeframe];
                const label = TIMEFRAME_LABELS[timeframe];

                return (
                    <button
                        key={timeframe}
                        onClick={() => toggleTimeframe(timeframe)}
                        className={`px-3 py-2 text-xs font-semibold rounded-md transition-all duration-200 border-2 ${
                            isEnabled
                                ? 'text-white shadow-md transform hover:scale-105'
                                : 'text-gray-500 bg-gray-900 border-gray-600 hover:bg-gray-800 hover:text-gray-300'
                        }`}
                        style={
                            isEnabled
                                ? {
                                      backgroundColor: colors.bullish,
                                      borderColor: colors.bullish,
                                      boxShadow: `0 2px 8px ${colors.bullish}40`,
                                  }
                                : {}
                        }
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );
};
