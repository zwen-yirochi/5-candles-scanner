import { useAtomValue } from 'jotai';
import React from 'react';
import { wsConnectedAtom } from '../../../stores/atoms/dataAtoms';

export const ConnectionStatus: React.FC = () => {
  const isConnected = useAtomValue(wsConnectedAtom);

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <div
        className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${isConnected ? 'bg-gray-800' : 'bg-gray-300'}`}
        title={isConnected ? 'WebSocket 연결됨' : 'WebSocket 연결 안됨'}
      />
      <span className="text-[10px] sm:text-sm text-gray-400">{isConnected ? 'Live' : 'Offline'}</span>
    </div>
  );
};
