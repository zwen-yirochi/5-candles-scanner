import { useAtom } from 'jotai';
import React from 'react';
import { enabledPatternsAtom, patternSettingsAtom, TimeFrame } from '../../stores/atoms/patternAtoms';
import { TIMEFRAME_LABELS } from '../../utils/timeframeColors';

const TF_ORDER: TimeFrame[] = ['15m', '30m', '1h', '4h'];

export const PatternControlPanel: React.FC = () => {
  const [enabledPatterns, setEnabledPatterns] = useAtom(enabledPatternsAtom);
  const [settings, setSettings] = useAtom(patternSettingsAtom);

  const toggleTimeframe = (tf: TimeFrame) => {
    setEnabledPatterns((prev) => ({ ...prev, [tf]: !prev[tf] }));
  };

  const toggleEnabled = () => {
    setSettings((prev) => ({ ...prev, enabled: !prev.enabled }));
  };

  const setBreakAction = (action: 'cut' | 'delete') => {
    setSettings((prev) => ({ ...prev, breakAction: action }));
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
      <button
        onClick={toggleEnabled}
        className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded transition-colors ${
          settings.enabled
            ? 'bg-neutral-700 text-neutral-100'
            : 'bg-neutral-200 text-neutral-400'
        }`}
      >
        Zone
      </button>
      {settings.enabled && (
        <>
          {TF_ORDER.map((tf) => (
            <button
              key={tf}
              onClick={() => toggleTimeframe(tf)}
              className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded transition-colors ${
                enabledPatterns[tf]
                  ? 'bg-neutral-600 text-neutral-100'
                  : 'bg-neutral-200 text-neutral-400'
              }`}
            >
              {TIMEFRAME_LABELS[tf]}
            </button>
          ))}
          <div className="w-px h-3 sm:h-4 bg-neutral-300" />
          <button
            onClick={() => setBreakAction(settings.breakAction === 'cut' ? 'delete' : 'cut')}
            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded transition-colors ${
              settings.breakAction === 'cut'
                ? 'bg-neutral-500 text-neutral-100'
                : 'bg-neutral-300 text-neutral-600'
            }`}
          >
            {settings.breakAction}
          </button>
        </>
      )}
    </div>
  );
};
