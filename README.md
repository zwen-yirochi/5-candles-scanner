# 5 Candles Scanner

> Binance 실시간 캔들스틱 차트 뷰어 & 멀티타임프레임 패턴 존 스캐너

**[Live Demo](https://zwen-yirochi.github.io/5-candles-scanner)**

<img width="1246" height="1435" alt="Personal Crypto Chart" src="https://github.com/user-attachments/assets/346e76f5-cffa-4f08-a2a1-7fddc38acd47" />


---

## Description

5개 이상의 연속 동일 방향 캔들을 감지하여 **Supply/Demand Zone** 을 자동 마킹하는 실시간 암호화폐 차트 애플리케이션입니다.

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| **실시간 WebSocket** | Binance WebSocket 스트림으로 틱 단위 캔들 업데이트. 지수 백오프 자동 재연결 |
| **멀티타임프레임 존 스캔** | 15m · 30m · 1h · 4h 데이터를 병렬 fetch 후, Pine Script 방식 알고리즘으로 수급 존 감지 |
| **Canvas 렌더링** | SVG 대신 Canvas 2D API로 캔들·그리드·존을 직접 렌더링. HiDPI 대응 + `desynchronized` 옵션으로 저지연 |
| **Pan & Zoom** | 드래그 패닝, 휠 줌, 축별 드래그 줌. `requestAnimationFrame` 스로틀링으로 60fps 유지 |
| **크로스헤어 & 툴팁** | 마우스 위치에 십자선 + 호버 시 OHLCV 상세 툴팁. 터치 디바이스 지원 |
| **미니멀 라이트 테마** | 크림 배경 + pill 형태 캔들. 의도적으로 빨강/초록을 배제한 모노크롬 팔레트 |

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | React 19, TypeScript |
| State | Jotai (파생 atom 기반 반응형 계산 그래프) |
| Rendering | Canvas 2D API (커스텀 구현) |
| Styling | Tailwind CSS |
| Data | Binance REST API + WebSocket |

---



## 사용법

1. 상단 바에서 **심볼** (BTC, ETH, BNB, SOL) 과 **인터벌** (1m ~ 1d) 선택
2. 차트 영역에서 **드래그**로 패닝, **스크롤**로 줌 인/아웃
3. 패턴 존 패널에서 **타임프레임별 토글** 및 **브레이크아웃 모드** (Cut / Delete) 설정
4. 캔들 위에 마우스를 올리면 **OHLCV 툴팁** 표시

---

## 프로젝트 구조

```
src/
├── components/
│   ├── Chart/
│   │   ├── CandlestickChart.tsx   # 차트 컨테이너
│   │   ├── ChartArea.tsx          # Canvas + 오버레이 조합
│   │   ├── ChartHeader/           # 심볼바, 인터벌바, 가격 정보
│   │   ├── Crosshair.tsx
│   │   ├── CurrentPriceLine.tsx
│   │   ├── HighLowLines.tsx
│   │   └── PatternControlPanel.tsx
│   └── common/                    # Button, Select, ErrorBoundary 등
├── hooks/
│   ├── useCandleCanvas.ts         # Canvas 렌더링 루프
│   ├── useChartPanZoom.ts         # 드래그·줌 인터랙션
│   ├── useBinanceWebSocket.ts     # WS 연결·재연결 관리
│   ├── usePatternAnalysis.ts      # 멀티TF 데이터 fetch + 분석 트리거
│   └── ...
├── stores/atoms/                  # Jotai atom (config, data, domain, action, pattern)
├── services/                      # Binance REST·WS 클라이언트
├── utils/
│   ├── patternAnalysis.ts         # 5-candle 존 감지 알고리즘
│   └── ...
└── pages/
    └── Dashboard.tsx              # 메인 페이지
```

---

## 라이선스

MIT
