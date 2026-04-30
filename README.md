# 이기운 키우기

GitHub Pages에서 돌아가는 정적 2D 육성 게임입니다.

코딩하고, 쉬고, 밥 먹고, 운동하고, 외출하면서 이기운을 성장시키는 미니 라이프 시뮬레이션입니다.

## 기능

- 상단 HUD
  - Lv
  - EXP
  - 하트
  - 에너지
  - 코인
  - 시간
- 좌측 능력치 패널
  - 집중력
  - 체력
  - 기분
  - 사회성
  - 코딩력
- 우측 소지품 패널
- 오늘의 한마디
- 하단 행동 버튼
  - 코딩하기
  - 운동하기
  - 밥먹기
  - 쉬기
  - 외출하기
  - 잠자기
- 이벤트 보상
- localStorage 자동 저장

## 기술 스택

- React 18
- TypeScript
- Vite
- CSS

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

## 배포

```bash
npm run deploy
```

## 이미지 준비

`public/assets/kiun/` 디렉토리에 아래 이미지들을 넣어주세요:

- `real-1.jpg` - 대표 실사 프로필
- `cover-art.png` - 메인 배경/커버 이미지
- `pixel-sprite.png` - 픽셀/도트 스프라이트 이미지
- `emotion-sheet.png` - 감정 시트 이미지

## 프로젝트 구조

```
src/
├── App.tsx
├── main.tsx
└── index.css
```
