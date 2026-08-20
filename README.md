# Red Dolphin for SKALA

Vue 3, TypeScript, Vite, Chrome Manifest V3 기반 확장 프로그램입니다.

## 시작하기

```bash
npm install
npm run dev
```

Chrome의 `chrome://extensions`에서 개발자 모드를 켠 뒤 **압축해제된 확장 프로그램을 로드합니다**를 선택하고 `dist/`를 지정합니다. 다시 빌드되면 확장 프로그램 카드도 새로고침하세요.

## 명령어

- `npm run dev`: 개발 빌드 후 파일 변경을 감시합니다.
- `npm run build`: 타입 검사 후 배포 파일을 `dist/`에 생성합니다.
- `npm run type-check`: Vue와 TypeScript 타입을 검사합니다.

`sample.js`는 초기 동작 참고용 레거시 파일입니다. 기능은 `src/` 아래의 타입 모듈로 옮겨 구현합니다.
