# 🍳 요리 음성 도우미 (Cooking Voice Assistant)

> 손 안 쓰고 요리할 수 있게 도와주는 음성 기반 웹 요리 앱

---

## 목차

- [개요](#개요)
- [시작하기](#시작하기)
- [프로젝트 구조](#프로젝트-구조)
- [아키텍처 분석](#아키텍처-분석)
- [데이터 모델](#데이터-모델)
- [핵심 기능 분석](#핵심-기능-분석)
- [기술 스택](#기술-스택)
- [브라우저 지원](#브라우저-지원)
- [알려진 제한사항 및 개선 방향](#알려진-제한사항-및-개선-방향)

---

## 개요

요리 중 손이 지저분해도 화면을 터치하지 않고 요리를 진행할 수 있도록 설계된 **음성 제어 레시피 앱**입니다. 브라우저 내장 Web Speech API(TTS + 음성 인식)를 사용해 별도 서버 없이 동작합니다.

### 핵심 플로우

```
레시피 선택 → 요리 시작 → 단계 TTS 자동 읽기 → 음성 명령으로 다음 단계 진행
```

### 기본 계정

| 항목 | 값 |
|---|---|
| 아이디 | `chef` |
| 비밀번호 | `1234` |

---

## 시작하기

### 요구사항

- [Node.js](https://nodejs.org) 18 이상
- Chrome 또는 Edge (음성 인식 지원)

### 설치 및 실행

```bash
npm install
npm run dev
```

`http://localhost:5173` 에서 확인합니다.

### 빌드

```bash
npm run build     # dist/ 폴더에 빌드
npm run preview   # 빌드 결과 미리보기
```

---

## 프로젝트 구조

```
cooking/
├── index.html                    # Vite 진입점
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
│
└── src/
    ├── main.jsx                  # React 마운트, HashRouter 감싸기
    ├── App.jsx                   # 라우트 정의, 인증 가드
    ├── index.css                 # Tailwind + 커스텀 애니메이션
    │
    ├── data/                     # 초기 시드 데이터 (JSON)
    │   ├── recipes.json          # 기본 레시피 5개
    │   └── users.json            # 초기 사용자 1명
    │
    ├── constants/
    │   └── tags.js               # 태그 목록, 색상, 레이블 정의
    │
    ├── context/
    │   └── AuthContext.jsx       # 전역 인증 상태 (React Context)
    │
    ├── services/                 # 순수 함수 레이어 (UI 의존 없음)
    │   ├── auth.js               # 로그인·로그아웃·즐겨찾기 토글
    │   ├── recipeStore.js        # 레시피 CRUD (localStorage)
    │   ├── tts.js                # Web Speech Synthesis 래퍼
    │   └── speech.js             # Web Speech Recognition 래퍼
    │
    ├── components/               # 재사용 UI 컴포넌트
    │   ├── NavBar.jsx            # 상단 네비게이션
    │   ├── RecipeCard.jsx        # 레시피 카드 (즐겨찾기 버튼 포함)
    │   └── TagBadge.jsx          # 태그 배지
    │
    └── pages/                    # 라우트별 페이지 컴포넌트
        ├── LoginPage.jsx
        ├── HomePage.jsx          # 레시피 목록 + 검색 + 태그 필터
        ├── RecipeDetailPage.jsx  # 재료, 단계, 요리 시작 버튼
        ├── CookingModePage.jsx   # ★ 핵심: 음성 제어 요리 모드
        ├── CreateRecipePage.jsx  # 레시피 생성 / 수정
        ├── MyRecipesPage.jsx     # 내가 만든 레시피
        └── FavoritesPage.jsx     # 즐겨찾기 레시피
```

---

## 아키텍처 분석

### 레이어 구조

```
[ Pages / Components ]  ← React UI 레이어
        ↓ 호출
[    Services      ]    ← 순수 함수 레이어 (localStorage, Web API)
        ↓ 읽기/쓰기
[   localStorage   ]    ← 클라이언트 영구 저장소
        ↑ 초기 시드
[   data/*.json    ]    ← 정적 초기 데이터
```

서비스 레이어는 React에 의존하지 않는 순수 함수로 구성되어 있어, 나중에 API 서버로 교체할 때 페이지 컴포넌트를 수정하지 않아도 됩니다.

### 상태 관리 전략

| 상태 종류 | 관리 방법 | 이유 |
|---|---|---|
| 로그인 세션 | `AuthContext` (React Context) | 앱 전체에서 공유 |
| 레시피 목록 | 각 페이지의 `useState` + 서비스 직접 호출 | 글로벌 상태 불필요 |
| 요리 모드 진행 상태 | `useState` + `useRef` (혼합) | 비동기 콜백의 클로저 문제 해결 |

### 요리 모드의 비동기 상태 처리 (`CookingModePage`)

요리 모드는 TTS 콜백과 음성 인식 콜백이 비동기로 실행되기 때문에 React `state`만으로는 클로저 내부에서 최신 값을 참조할 수 없습니다. 이를 해결하기 위해 두 가지 패턴을 사용합니다.

**1. `useRef` 미러링 — TTS 콜백에서 최신 상태 읽기**

```jsx
const statusRef = useRef('idle');

function syncStatus(s) {
  statusRef.current = s;  // ref 즉시 반영
  setStatus(s);           // React 리렌더 예약
}

// TTS가 끝난 뒤 실행되는 콜백 내부
speak(instruction, () => {
  if (statusRef.current === 'speaking') {  // 최신 값을 ref로 읽음
    syncStatus('listening');
  }
});
```

**2. 커맨드 핸들러 ref — 음성 인식 콜백에서 항상 최신 함수 호출**

```jsx
const handleCommandRef = useRef(null);

// 매 렌더마다 최신 클로저로 교체
handleCommandRef.current = (cmd) => { /* 현재 state 참조 가능 */ };

// startListening에 전달하는 콜백은 항상 최신 핸들러를 역참조
startListening((cmd) => handleCommandRef.current(cmd), onError);
```

이 패턴을 통해 `useCallback` 의존성 배열 문제나 stale closure 버그 없이 실시간 음성 제어를 구현합니다.

### 라우팅

`HashRouter`를 사용합니다 (`#/`, `#/recipe/:id` 등). 빌드 후 별도 서버 설정 없이 정적 파일 서버(`python -m http.server`)에서도 동작하기 위함입니다.

---

## 데이터 모델

### Recipe

```json
{
  "id": "recipe-001",
  "title": "김치볶음밥",
  "description": "고소하고 매콤한 한국식 볶음밥",
  "ingredients": ["밥 1공기", "김치 1/2컵", "..."],
  "steps": [
    { "id": "s001-1", "order": 1, "instruction": "팬에 식용유를 두르고 중불로 가열하세요." }
  ],
  "tags": ["korean", "spicy", "quick"],
  "difficulty": "easy",
  "prepTime": 15,
  "createdBy": null,
  "isPublic": true,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

`createdBy: null` — 기본 제공 레시피. `createdBy: "user-001"` — 사용자가 만든 레시피.

### User

```json
{
  "id": "user-001",
  "username": "chef",
  "password": "1234",
  "displayName": "요리사",
  "email": "chef@cooking.app",
  "favorites": ["recipe-001", "recipe-003"],
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

즐겨찾기는 `User.favorites` 배열에 레시피 ID를 저장합니다. 레시피 자체를 복사하지 않아 레시피 수정 시 즐겨찾기에도 자동 반영됩니다.

### localStorage 키

| 키 | 내용 |
|---|---|
| `cooking_recipes` | 모든 레시피 배열 (기본 + 사용자 생성) |
| `cooking_users` | 사용자 배열 (즐겨찾기 포함) |
| `cooking_session` | 현재 로그인 세션 `{ id, username, displayName }` |

앱 첫 실행 시 `data/*.json`을 localStorage로 복사하여 초기화합니다. 이후에는 localStorage만 사용합니다.

### 태그 시스템

`src/constants/tags.js`에 13개 태그가 정의되어 있습니다.

| 값 | 레이블 | 색상 |
|---|---|---|
| `korean` | 한식 | 빨강 |
| `japanese` | 일식 | 핑크 |
| `italian` | 이탈리안 | 초록 |
| `chinese` | 중식 | 노랑 |
| `mexican` | 멕시칸 | 주황 |
| `indian` | 인도 | 앰버 |
| `american` | 미국식 | 파랑 |
| `thai` | 태국 | 라임 |
| `french` | 프랑스 | 인디고 |
| `vegetarian` | 채식 | 에메랄드 |
| `spicy` | 매운맛 | 진빨강 |
| `quick` | 간편식 | 보라 |
| `other` | 기타 | 회색 |

---

## 핵심 기능 분석

### 1. 요리 모드 상태 머신

```
         startCooking()
  IDLE ──────────────→ SPEAKING
                           │
               TTS 완료 후 ↓
                       LISTENING ←──────────────────┐
                           │                        │
              "next"/"back" │ "repeat"              │ (재시작)
                           ↓                        │
                       SPEAKING ────────────────────┘
                           │
                    "pause" │
                           ↓
                       PAUSED ──── "pause" ──→ SPEAKING (재개)
                           │
                     "done" │ 또는 마지막 단계에서 next
                           ↓
                       FINISHED
```

### 2. 음성 명령

| 명령어 | 한국어 동의어 | 동작 |
|---|---|---|
| `next` | 다음, 넥스트 | 다음 단계로 이동 |
| `back` | 이전, 뒤로 | 이전 단계로 이동 |
| `repeat` | 다시, 반복 | 현재 단계 재읽기 |
| `pause` | 멈춤, 정지, 일시정지 | 일시정지 / 재개 |
| `done` | 종료, 끝, 완료 | 요리 종료 |

음성 인식은 TTS가 읽는 동안 비활성화되어 자기 음성이 명령으로 인식되는 피드백 루프를 방지합니다.

### 3. 인증 흐름

```
앱 시작
  └→ AuthContext.initUsers()  // localStorage에 사용자 없으면 users.json으로 시드
  └→ getSession()             // 기존 로그인 세션 복원
       ├→ 세션 있음 → 홈으로
       └→ 세션 없음 → /login

로그인
  └→ auth.login(username, password)
       ├→ 일치 → session을 localStorage에 저장, AuthContext.user 갱신
       └→ 불일치 → 에러 메시지

로그아웃
  └→ localStorage에서 session 제거
  └→ AuthContext.user = null → /login 리다이렉트
```

---

## 기술 스택

| 역할 | 기술 | 버전 |
|---|---|---|
| UI 프레임워크 | React | 18.3 |
| 빌드 도구 | Vite | 5.4 |
| 라우팅 | React Router DOM (HashRouter) | 6.26 |
| 스타일링 | Tailwind CSS | 3.4 |
| TTS | Web Speech Synthesis API | 브라우저 내장 |
| 음성 인식 | Web Speech Recognition API | 브라우저 내장 |
| 데이터 저장 | localStorage | 브라우저 내장 |
| 초기 데이터 | JSON (Vite 기본 지원) | — |

외부 서버나 API 키가 **전혀 필요 없습니다.**

---

## 브라우저 지원

| 기능 | Chrome | Edge | Firefox | Safari |
|---|---|---|---|---|
| TTS (SpeechSynthesis) | ✅ | ✅ | ✅ | ✅ |
| 음성 인식 (SpeechRecognition) | ✅ | ✅ | ❌ | ❌ |
| 전체 앱 동작 | ✅ | ✅ | ⚠️ 버튼 폴백 | ⚠️ 버튼 폴백 |

음성 인식이 지원되지 않는 브라우저에서는 화면 버튼으로 모든 단계를 제어할 수 있습니다.

---

## 알려진 제한사항 및 개선 방향

### 현재 제한사항

| 항목 | 내용 |
|---|---|
| **보안** | 비밀번호가 localStorage에 평문 저장됨. 개인 기기 전용 MVP |
| **다중 사용자** | 현재 1명의 기본 사용자만 포함. 회원가입 기능 없음 |
| **데이터 동기화** | 기기 간 데이터 공유 불가 (localStorage 한계) |
| **TTS 음질** | 브라우저 기본 음성 사용. 음성 선택 불가 |
| **오프라인** | Service Worker 미적용. 첫 로드 시 인터넷 필요 |
| **이미지** | 레시피 이미지 없음 |

### Phase 2 개선 방향

- [ ] 타이머 기능 (단계별 시간 설정)
- [ ] 즐겨찾기 내 정렬·필터
- [ ] TTS 음성·속도 설정
- [ ] 레시피 이미지 업로드
- [ ] PWA (오프라인 지원, 홈 화면 추가)

### Phase 3 개선 방향

- [ ] Supabase / Firebase 연동 → 서버 저장 + 기기 간 동기화
- [ ] OAuth 로그인 (Google, Kakao)
- [ ] 레시피 공유 (공개/비공개)
- [ ] 커뮤니티 (댓글, 평점)
