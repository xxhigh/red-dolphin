# Red Dolphin for SKALA

SKALA 울산 교육생을 위한 Chrome 확장 프로그램입니다. Vue 3, TypeScript, Vite와 Chrome Manifest V3를 사용합니다.

## 주요 기능

- 저장된 사용자 이름과 반을 팝업에 표시합니다.
- `time-table.json`을 기준으로 오늘의 강의와 메인 교수님을 표시합니다.
- 메인 교수님 이름에 마우스를 올리거나 키보드 포커스를 이동하면 해당 반의 실습 교수님을 보여줍니다.
- 단위기간 종료일까지 남은 일수와 주말·휴일을 제외한 남은 출석일을 하단 진행 바로 표시합니다.
- 등록한 Zoom 미팅을 팝업에서 바로 엽니다.
- 교육생 포털을 새 탭으로 엽니다.
- 출석 페이지를 모바일 User-Agent로 열고 사용자 이름, 울산 캠퍼스와 반을 자동 선택합니다.

알림, 예약 실행과 알림음 기능은 포함하지 않습니다.

## 요구 사항

- Node.js 22.12 이상
- npm
- Chrome 또는 Chromium 기반 브라우저

## 설치 및 실행

의존성을 설치하고 개발 빌드를 시작합니다.

```bash
npm install
npm run dev
```

Chrome에서 다음 순서로 확장 프로그램을 불러옵니다.

1. `chrome://extensions`를 엽니다.
2. 우측 상단의 개발자 모드를 활성화합니다.
3. **압축해제된 확장 프로그램을 로드합니다**를 선택합니다.
4. 프로젝트의 `dist/` 디렉터리를 지정합니다.

소스가 다시 빌드되면 확장 프로그램 카드의 새로고침 버튼을 누릅니다. 서비스 워커나 `manifest.json`이 변경된 경우 반드시 확장 프로그램을 다시 로드해야 합니다.

## 명령어

```bash
npm run dev
npm run type-check
npm run build
```

- `npm run dev`: 개발 모드로 빌드하고 파일 변경을 감시합니다.
- `npm run type-check`: Vue와 TypeScript 타입을 검사합니다.
- `npm run build`: 타입 검사 후 배포 파일을 `dist/`에 생성합니다.

## 사용자 설정

팝업 우측 상단의 설정 버튼을 누르면 옵션 페이지가 열립니다.

### 사용자 정보

- 사용자 이름
- 사용자 반: 1반, 2반, 3반, 4반
- 사용자 고유번호

### Zoom 설정

- 별명과 미팅 코드를 등록합니다.
- 등록한 링크를 수정하거나 삭제할 수 있습니다.
- Zoom 링크 목록을 JSON 구조의 `.dolphin` 파일로 가져오거나 내보낼 수 있습니다. 내부 형식이 같다면 JSON 파일도 가져올 수 있습니다.
- 미팅 코드는 숫자만 저장되며 공백과 하이픈은 제거됩니다.

사용자 설정과 Zoom 링크는 `chrome.storage.sync`에 저장됩니다.

## 출석 자동화

팝업에서 **출석체크**를 누르면 다음 순서로 실행됩니다.

1. 새 탭을 생성합니다.
2. 해당 탭의 출석 관련 도메인 요청에 모바일 User-Agent를 적용합니다.
3. `https://auth.skala-ai.com`을 엽니다.
4. 페이지 로딩과 드롭다운 옵션 생성을 기다립니다.
5. 사용자 이름, 캠퍼스 코드 `US`, 반 값을 자동으로 입력합니다.

반은 출석 페이지의 드롭다운 값으로 다음과 같이 변환됩니다.

| 사용자 반 | 드롭다운 값 |
| --------- | ----------- |
| 1반       | `15`        |
| 2반       | `16`        |
| 3반       | `17`        |
| 4반       | `18`        |

출석 페이지의 DOM 구조가 변경되면 자동화 셀렉터도 수정해야 합니다.

## 시간표 데이터

- 원본: `time_table.pdf`
- 변환 데이터: `src/shared/time-table.json`
- 조회 로직: `src/shared/timetable.ts`
- 단위기간 계산: `src/shared/unitPeriods.ts`

시간표 JSON에는 날짜, 요일, 주차, 과목, 반별 교수님과 `isMainProfessor` 값이 포함됩니다. 일정에 교수 정보가 없는 특강이나 휴일에는 팝업에 대체 문구가 표시됩니다.

## 개발자 설정

개발자가 자주 변경할 고정 설정은 `src/shared/config.ts`의 `APP_CONFIG`에 정리되어 있습니다.

- 외부 서비스 URL
- 출석 자동화 셀렉터
- 반 드롭다운 매핑
- 모바일 User-Agent
- 자동화 타임아웃과 재시도 값
- 단위기간 정보

현재 `config.ts`는 설정값을 정리하기 위해 추가된 파일이며 기존 기능 코드에는 아직 연결되지 않았습니다. 값을 변경해 실제 동작에 반영하려면 관련 모듈을 `APP_CONFIG`를 사용하도록 리팩터링해야 합니다.

## 프로젝트 구조

```text
src/
├── background/       # MV3 서비스 워커와 출석 자동화
├── options/          # 사용자 및 Zoom 설정 화면
├── popup/            # 확장 프로그램 팝업
└── shared/           # 설정 타입, 시간표, 단위기간, 공통 상수
public/
├── icons/            # 확장 프로그램 아이콘
└── manifest.json     # Chrome MV3 매니페스트
```

`sample.js`는 초기 자동화 동작을 확인하기 위한 레거시 참고 파일입니다. 새로운 동작은 `src/` 아래의 TypeScript 모듈로 구현합니다.

## 권한

확장 프로그램은 다음 권한을 사용합니다.

- `storage`: 사용자 정보와 Zoom 설정 저장
- `scripting`: 출석 페이지 자동 입력
- `declarativeNetRequestWithHostAccess`: 출석 탭의 User-Agent 변경
- `https://auth.skala-ai.com/*`: 출석 인증 페이지 자동 입력과 모바일 User-Agent 적용
- `https://accounts.google.com/*`: Google 계정 인증 중 모바일 User-Agent 유지
- `https://att.skala-ai.com/*`: 출석 처리 페이지에서 모바일 User-Agent 유지
- `https://lms.skala-ai.com/*`: LMS 이동 과정에서 모바일 User-Agent 유지

호스트 권한은 출석체크로 생성된 탭의 User-Agent를 인증 과정 전체에서 유지하는 용도로만 사용합니다. 자동 입력 스크립트는 출석 페이지에만 삽입됩니다. 비밀번호, API 키, 세션 정보와 개인 설정값을 저장소에 커밋하지 마세요.

## 검증

변경 후 다음 명령을 실행합니다.

```bash
npm run type-check
npm run build
git diff --check
```

자동화된 테스트 러너는 아직 없습니다. `dist/`를 압축 해제 확장 프로그램으로 로드한 후 다음 항목을 수동으로 확인합니다.

- 팝업 렌더링과 오늘의 시간표
- 사용자 설정 저장 및 다시 불러오기
- Zoom 링크 추가, 수정, 삭제와 열기
- 출석 페이지 로딩, User-Agent 적용과 반 선택
- 서비스 워커 시작과 오류 로그
