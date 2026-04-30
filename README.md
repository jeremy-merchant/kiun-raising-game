# 이기운 키우기

이기운의 특징을 반영한 육성형 시뮬레이션 게임입니다. 차분함, 몰입, 커피, 독서, 코딩, 음악, 정돈된 공간감, 검정 계열 스타일을 핵심 키워드로 설계되었습니다.

## 기능

- **캐릭터 시스템**: 이기운의 성격, 취향, 특성을 반영한 프로필
- **스탯 시스템**: 집중력, 체력, 기분, 사회성, 코딩력, 유대감
- **행동 시스템**: 코딩, 독서, 커피, 운동, 식사, 휴식, 외출, 음악, 정리, 수면
- **이벤트 시스템**: 행동에 따른 랜덤/준랜덤 이벤트
- **인벤토리**: 아이템 수집 및 관리
- **업적 시스템**: 성장에 따른 업적 달성
- **갤러리**: 실사, 도트, 감정 시트, UI 컨셉 이미지
- **로그 시스템**: 행동과 이벤트 기록
- **저장/복원**: localStorage를 통한 상태 지속
- **반응형 UI**: 모바일 대응

## 기술 스택

- React 18
- TypeScript
- Vite
- CSS (Custom Properties, Grid, Flexbox)

## 설치

```bash
npm install
```

## 실행

```bash
npm run dev
```

## 빌드

```bash
npm run build
```

## 프리뷰

```bash
npm run preview
```

## 이미지 준비

`public/assets/kiun/` 디렉토리에 아래 이미지들을 넣어주세요:

- `real-1.jpg` - 대표 실사 프로필
- `real-2.jpg` - 공간 감성 컷
- `real-3.jpg` - 부드러운 표정 컷
- `real-4.jpg` - 일상적인 순간 컷
- `real-5.jpg` - 측면 컷
- `emotion-sheet.png` - 감정 시트 이미지
- `pixel-sprite.png` - 픽셀/도트 스프라이트 이미지
- `room-ui.png` - 메인 게임 UI 컨셉 이미지

## 프로젝트 구조

```
src/
├── components/       # UI 컴포넌트
│   ├── TopBar.tsx
│   ├── StatPanel.tsx
│   ├── CharacterStage.tsx
│   ├── ActionPanel.tsx
│   ├── InventoryPanel.tsx
│   ├── LogPanel.tsx
│   └── GalleryPanel.tsx
├── data/            # 게임 데이터
│   └── kiun.ts
├── hooks/           # React Hooks
│   └── useKiunGame.ts
├── types/           # TypeScript 타입
│   └── game.ts
├── utils/           # 유틸리티 함수
│   ├── game.ts
│   └── storage.ts
├── App.tsx          # 메인 앱 컴포넌트
├── main.tsx         # 엔트리 포인트
└── index.css        # 전역 스타일
```

## 캐릭터 설정

캐릭터 데이터는 `src/data/kiun.ts`에서 수정할 수 있습니다:

- `KIUN_PROFILE`: 캐릭터 프로필 (이름, 성격, 취향 등)
- `DEFAULT_STATS`: 초기 스탯 값
- `STARTER_INVENTORY`: 시작 인벤토리
- `GALLERY_IMAGES`: 갤러리 이미지 목록
- `ACTIVITIES`: 행동 정의

## 게임 로직

게임 로직은 `src/utils/game.ts`에 집중되어 있습니다:

- `createInitialGameState()`: 초기 상태 생성
- `runActivity()`: 행동 수행 및 상태 업데이트
- `rollEvent()`: 랜덤 이벤트 처리
- `buildAchievements()`: 업적 계산

## 저장 시스템

localStorage를 사용하여 게임 상태를 자동 저장합니다. 저장 키는 `kiun-raising-game-state`입니다.

## 라이선스

MIT
