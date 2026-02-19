import { atom } from 'jotai';
import { CandleData } from '../../types/candle.types';
import { DisplayZone, PatternSettings, PatternTimeFrame, PatternZone } from '../../types/pattern.types';
import { PatternAnalyzer } from '../../utils/patternAnalysis';
import { findIndexByTimestamp } from '../../utils/timestampMapping';
import { rawDataAtom } from './dataAtoms';

export type TimeFrame = PatternTimeFrame;

// ── 개별 타임프레임 데이터 atoms ──
export const timeframeData15mAtom = atom<CandleData[]>([]);
export const timeframeData30mAtom = atom<CandleData[]>([]);
export const timeframeData1hAtom = atom<CandleData[]>([]);
export const timeframeData4hAtom = atom<CandleData[]>([]);

const timeframeAtomMap: Record<TimeFrame, typeof timeframeData15mAtom> = {
  '15m': timeframeData15mAtom,
  '30m': timeframeData30mAtom,
  '1h': timeframeData1hAtom,
  '4h': timeframeData4hAtom,
};

// 합성 read-write atom (기존 인터페이스 호환)
type TimeframeDataRecord = Record<TimeFrame, CandleData[]>;
export const timeframeDataAtom = atom(
  (get): TimeframeDataRecord => ({
    '15m': get(timeframeData15mAtom),
    '30m': get(timeframeData30mAtom),
    '1h': get(timeframeData1hAtom),
    '4h': get(timeframeData4hAtom),
  }),
  (
    get,
    set,
    update: TimeframeDataRecord | ((prev: TimeframeDataRecord) => TimeframeDataRecord)
  ) => {
    const newValue =
      typeof update === 'function'
        ? update({
            '15m': get(timeframeData15mAtom),
            '30m': get(timeframeData30mAtom),
            '1h': get(timeframeData1hAtom),
            '4h': get(timeframeData4hAtom),
          })
        : update;
    (Object.keys(newValue) as TimeFrame[]).forEach((tf) => {
      set(timeframeAtomMap[tf], newValue[tf]);
    });
  }
);

// ── 패턴 설정 ──
export const patternSettingsAtom = atom<PatternSettings>({
  enabled: true,
  minLength: 5,
  breakAction: 'cut',
  maxZones: 200,
});

// ── TF별 on/off ──
export const enabledPatternsAtom = atom<Record<TimeFrame, boolean>>({
  '15m': true,
  '30m': true,
  '1h': true,
  '4h': true,
});

// ── 개별 타임프레임 패턴 zone atoms (해당 데이터 변경 시에만 재계산) ──
const patternZonesAtom15m = atom<PatternZone[]>((get) => {
  const data = get(timeframeData15mAtom);
  const settings = get(patternSettingsAtom);
  return data.length > 0
    ? PatternAnalyzer.analyzeZones(data, '15m', settings.minLength, settings.maxZones)
    : [];
});
const patternZonesAtom30m = atom<PatternZone[]>((get) => {
  const data = get(timeframeData30mAtom);
  const settings = get(patternSettingsAtom);
  return data.length > 0
    ? PatternAnalyzer.analyzeZones(data, '30m', settings.minLength, settings.maxZones)
    : [];
});
const patternZonesAtom1h = atom<PatternZone[]>((get) => {
  const data = get(timeframeData1hAtom);
  const settings = get(patternSettingsAtom);
  return data.length > 0
    ? PatternAnalyzer.analyzeZones(data, '1h', settings.minLength, settings.maxZones)
    : [];
});
const patternZonesAtom4h = atom<PatternZone[]>((get) => {
  const data = get(timeframeData4hAtom);
  const settings = get(patternSettingsAtom);
  return data.length > 0
    ? PatternAnalyzer.analyzeZones(data, '4h', settings.minLength, settings.maxZones)
    : [];
});

const patternZonesAtomMap: Record<TimeFrame, typeof patternZonesAtom15m> = {
  '15m': patternZonesAtom15m,
  '30m': patternZonesAtom30m,
  '1h': patternZonesAtom1h,
  '4h': patternZonesAtom4h,
};

// ── 합성 패턴 분석 atom (전체 읽기용) ──
export const patternAnalysisAtom = atom<Record<TimeFrame, PatternZone[]>>((get) => ({
  '15m': get(patternZonesAtom15m),
  '30m': get(patternZonesAtom30m),
  '1h': get(patternZonesAtom1h),
  '4h': get(patternZonesAtom4h),
}));

// ── displayZonesAtom: 4개 TF의 zone을 현재 차트 좌표로 매핑 ──
export const displayZonesAtom = atom<DisplayZone[]>((get) => {
  const enabled = get(enabledPatternsAtom);
  const settings = get(patternSettingsAtom);
  const chartData = get(rawDataAtom);

  if (!settings.enabled || chartData.length === 0) return [];

  const displayZones: DisplayZone[] = [];

  (Object.keys(enabled) as TimeFrame[]).forEach((tf) => {
    if (!enabled[tf]) return;

    // 조건부 구독: 비활성화된 TF는 get() 호출하지 않음
    const zones = get(patternZonesAtomMap[tf]);

    zones.forEach((zone) => {
      // breakAction이 delete이면 돌파된 zone 제외
      if (settings.breakAction === 'delete' && !zone.isActive) return;

      const chartStartIndex = findIndexByTimestamp(chartData, zone.startTimestamp);

      let chartEndIndex: number | null = null;
      if (!zone.isActive && zone.brokenAtTimestamp) {
        chartEndIndex = findIndexByTimestamp(chartData, zone.brokenAtTimestamp);
      }

      displayZones.push({ zone, chartStartIndex, chartEndIndex });
    });
  });

  return displayZones;
});
