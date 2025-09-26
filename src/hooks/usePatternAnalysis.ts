// hooks/usePatternAnalysis.ts
import { useAtom, useAtomValue } from 'jotai';
import { useCallback, useEffect, useState } from 'react';
import { TimeframeDataService } from '../services/timeframeDataService';
import { patternAnalysisAtom, TimeFrame, timeframeDataAtom } from '../stores/atoms/patternAtoms';

export const usePatternAnalysis = (symbol: string) => {
    const [timeframeData, setTimeframeData] = useAtom(timeframeDataAtom);
    const patterns = useAtomValue(patternAnalysisAtom); // 패턴을 읽어서 콘솔 출력 트리거
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        if (!symbol) return;

        setLoading(true);
        setError(null);
        console.log(`시작: ${symbol} 패턴 분석용 데이터 로딩`);

        try {
            const data = await TimeframeDataService.fetchAllTimeframes(symbol, 100);
            setTimeframeData(data);
            console.log('데이터 atom 업데이트 완료 - 패턴 분석 시작');
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
                console.log(`${timeframe} 데이터 재로딩 시작`);
                const data = await TimeframeDataService.fetchSingleTimeframe(symbol, timeframe, 100);
                setTimeframeData((prev) => ({
                    ...prev,
                    [timeframe]: data,
                }));
                console.log(`${timeframe} 데이터 재로딩 완료`);
            } catch (err) {
                console.error(`${timeframe} 재로딩 실패:`, err);
            }
        },
        [symbol, setTimeframeData]
    );

    useEffect(() => {
        loadData();
    }, [loadData]);

    return {
        timeframeData,
        patterns,
        loading,
        error,
        reload: loadData,
        reloadTimeframe,
    };
};
