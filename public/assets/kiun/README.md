이 디렉토리에 아래 이미지들을 넣어주세요.

필수 파일명:

1. real-1.jpg
2. cover-art.png
3. pixel-sprite.png
4. emotion-sheet.png

권장 매핑:

- real-1.jpg : 대표 실사 프로필
- cover-art.png : 이기운 키우기 커버/방 배경 이미지
- pixel-sprite.png : 픽셀/도트 스프라이트 이미지
- emotion-sheet.png : 감정 시트 이미지

주의:
- 코드에서는 위 파일명을 그대로 참조합니다.
- 파일명이 다르면 src/App.tsx 의 ASSETS 경로를 수정하세요.
- GitHub Pages 배포를 위해 vite.config.ts 의 base는 "./"로 설정합니다.

추천:
- cover-art.png는 넓은 16:9 이미지가 가장 좋습니다.
- pixel-sprite.png는 "이기운 키우기 - Pixel Sprite Set" 이미지를 넣으면 됩니다.
- emotion-sheet.png는 추후 이벤트 팝업/감정 컷 확장용입니다.
