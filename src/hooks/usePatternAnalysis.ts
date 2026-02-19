import { useAtom } from 'jotai';
import { useCallback, useEffect, useState } from 'react';
import { TimeframeDataService } from '../services/timeframeDataService';
import { TimeFrame, timeframeDataAtom } from '../stores/atoms/patternAtoms';

export const usePatternAnalysis = (symbol: string) => {
  const [, setTimeframeData] = useAtom(timeframeDataAtom);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!symbol) return;

    setLoading(true);
    setError(null);

    try {
      const data = await TimeframeDataService.fetchAllTimeframes(symbol, 2400);
      setTimeframeData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      setError(errorMessage);
      console.error('패턴 분석 데이터 로딩 오류:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [symbol, setTimeframeData]);

  const reloadTimeframe = useCallback(
    async (timeframe: TimeFrame) => {
      if (!symbol) return;

      try {
        const data = await TimeframeDataService.fetchSingleTimeframe(symbol, timeframe, 2400);
        setTimeframeData((prev) => ({
          ...prev,
          [timeframe]: data,
        }));
      } catch (err) {
        console.error(`${timeframe} 재로딩 실패:`, err);
      }
    },
    [symbol, setTimeframeData]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { loading, error, reload: loadData, reloadTimeframe };
};
