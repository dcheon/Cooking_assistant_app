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
                                                  └→ "타이머 시작" 으로 단계별 타이머 가동
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
    │   ├── recipes.json          # 기본 레시피 16개 (한식·일식·중식·양식)
    │   └── users.json            # 초기 사용자 1명 (비밀번호 bcrypt 해시)
    │
    ├── constants/
    │   ├── storageKeys.js        # localStorage 키 상수 모음
    │   └── tags.js               # 태그 목록, 색상, 레이블 정의
    │
    ├── hooks/
    │   └── useCookingReducer.js  # 요리 모드 상태 머신 (useReducer)
    │
    ├── store/
    │   └── useRecipeStore.js     # 전역 레시피·즐겨찾기 상태 (Zustand)
    │
    ├── context/
    │   └── AuthContext.jsx       # 전역 인증 상태 (React Context)
    │
    ├── services/                 # 순수 함수 레이어 (UI 의존 없음)
    │   ├── storageAdapter.js     # localStorage 래퍼 (Supabase 교체 준비)
    │   ├── auth.js               # 로그인·로그아웃·즐겨찾기 토글 (bcrypt)
    │   ├── recipeStore.js        # 레시피 CRUD + 버전 마이그레이션
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
        ├── RecipeDetailPage.jsx  # 재료, 단계 (타이머 표시), 요리 시작 버튼
        ├── CookingModePage.jsx   # ★ 핵심: 음성 제어 + 단계별 타이머 요리 모드
        ├── CreateRecipePage.jsx  # 레시피 생성 / 수정 (단계별 타이머 설정)
        ├── MyRecipesPage.jsx     # 내가 만든 레시피
        └── FavoritesPage.jsx     # 즐겨찾기 레시피
```

---

## 아키텍처 분석

### 레이어 구조

```
[ Pages / Components ]  ← React UI 레이어
        ↓ 구독 / 디스패치
[  Zustand Store    ]   ← 전역 레시피·즐겨찾기 상태
[  AuthContext      ]   ← 전역 인증 상태
        ↓ 호출 → {data, error} 반환
[    Services       ]   ← 순수 함수 레이어 (storageAdapter, bcrypt)
        ↓ 읽기/쓰기
[ storageAdapter    ]   ← localStorage 추상화 계층
        ↓
[   localStorage    ]   ← 클라이언트 영구 저장소
        ↑ 초기 시드 + 버전 마이그레이션
[   data/*.json     ]   ← 정적 초기 데이터
```

모든 서비스 함수는 `{ data, error }` 형태를 반환합니다(Supabase 응답 형식과 동일). 나중에 API 서버로 교체할 때 서비스 레이어만 교체하면 됩니다.

`storageAdapter`가 localStorage를 단일 진입점으로 감싸고 있어, Supabase 연동 시 이 파일만 교체하면 됩니다.

### 상태 관리 전략

| 상태 종류 | 관리 방법 | 이유 |
|---|---|---|
| 로그인 세션 | `AuthContext` (React Context) | 앱 전체에서 공유 |
| 레시피 목록 | `useRecipeStore` (Zustand) | 생성·삭제 시 모든 페이지 자동 갱신 |
| 즐겨찾기 | `useRecipeStore.favoriteIds` (Zustand) | RecipeCard 단독 갱신, tick 패턴 불필요 |
| 요리 모드 진행 상태 | `useCookingReducer` (useReducer) | 상태 전이 로직을 선언적으로 분리 |
| 단계별 타이머 | `useState` + `useRef` (interval) | 요리 모드 내 독립 카운트다운 |

### 인증 흐름 (`AuthContext`)

`setUser`는 Zustand `init()`을 동기적으로 먼저 호출한 뒤 React state를 갱신합니다. 로그인/로그아웃 직후 즐겨찾기가 반영되지 않는 플래시 현상을 방지합니다.

```js
// AuthContext.jsx
const setUser = useCallback((session) => {
  useRecipeStore.getState().init(session?.id ?? null); // 즐겨찾기 즉시 동기화
  setUserState(session);
}, []);

useEffect(() => {
  (async () => {
    await initUsers();   // 평문 비밀번호 자동 마이그레이션 (bcrypt)
    initRecipes();       // 시드 버전 확인 + 마이그레이션
    const { data: session } = getSession();
    setUser(session);
    setReady(true);
  })();
}, []);
```

### 요리 모드 상태 머신 (`useCookingReducer`)

`src/hooks/useCookingReducer.js`에 순수 reducer로 분리되어 있습니다. `speakKey`가 증가할 때마다 TTS effect가 트리거됩니다.

```js
// 상태: { status, stepIdx, speakKey }
// 액션 타입
'START'    → status: SPEAKING, stepIdx: 0, speakKey++
'NEXT'     → status: SPEAKING, stepIdx+1, speakKey++  (마지막이면 FINISHED)
'BACK'     → status: SPEAKING, stepIdx-1, speakKey++
'REPEAT'   → status: SPEAKING, speakKey++
'PAUSE'    → status: PAUSED
'RESUME'   → status: SPEAKING, speakKey++
'FINISH'   → status: FINISHED
'TTS_DONE' → status: LISTENING  (SPEAKING 상태일 때만)
```

### 요리 모드 Effect 구조 (`CookingModePage`)

TTS·청취·일시정지·완료를 각각 독립된 `useEffect`로 분리합니다.

```jsx
// Effect 1: speakKey가 바뀔 때마다 TTS 재생 (status === 'speaking' 보장)
useEffect(() => {
  if (state.status !== STATUS.SPEAKING) return;
  speak(steps[state.stepIdx].instruction, () => dispatch({ type: 'TTS_DONE' }));
  return () => ttsStop();
}, [state.speakKey]);

// Effect 2: status가 'listening'이 되면 음성 인식 시작
useEffect(() => {
  if (state.status !== STATUS.LISTENING) return;
  startListening((cmd) => handleCommandRef.current(cmd), () => {});
  return () => stopListening();
}, [state.status]);

// Effect 3: 일시정지 시 TTS·청취 즉시 중단
useEffect(() => {
  if (state.status !== STATUS.PAUSED) return;
  ttsStop(); stopListening();
}, [state.status]);

// Effect 4: 완료 시 안내 TTS 재생
useEffect(() => {
  if (state.status !== STATUS.FINISHED) return;
  ttsStop(); stopListening();
  speak('요리가 완료되었습니다! 맛있게 드세요.');
}, [state.status]);
```

커맨드 핸들러는 `handleCommandRef.current`에 매 렌더마다 최신 클로저를 할당하고, 음성 인식 콜백은 항상 이를 역참조합니다.

### 시드 데이터 버전 마이그레이션

`recipeStore.js`는 `RECIPE_VERSION` 상수로 기본 레시피 데이터를 버전 관리합니다.

```js
// initRecipes() 호출 시
if (!stored || storedVersion < RECIPE_VERSION) {
  storageAdapter.set(KEYS.RECIPES_BACKUP, existing); // 백업 저장
  try {
    // 사용자 레시피는 보존 (createdBy !== null && id.startsWith('recipe-'))
    const userRecipes = existing.filter(_isUserRecipe);
    storageAdapter.set(KEYS.RECIPES, [...INITIAL_RECIPES, ...userRecipes]);
    storageAdapter.set(KEYS.RECIPES_VER, RECIPE_VERSION);
    // 마이그레이션 감사 로그 기록
    log.push({ date, fromVersion, toVersion, preserved: userRecipes.length });
  } catch (e) {
    storageAdapter.set(KEYS.RECIPES, existing); // 실패 시 롤백
  }
}
```

`recipes.json`을 수정할 때 `RECIPE_VERSION`을 올리면, 앱 다음 실행 시 기본 레시피가 자동 갱신됩니다. 사용자가 직접 만든 레시피는 항상 보존됩니다.

### 라우팅

`HashRouter`를 사용합니다 (`#/`, `#/recipe/:id` 등). 빌드 후 별도 서버 설정 없이 정적 파일 서버에서도 동작합니다.

---

## 데이터 모델

### Recipe

```json
{
  "id": "recipe-001",
  "title": "김치볶음밥",
  "category": "한식",
  "description": "고소하고 매콤한 한국식 볶음밥",
  "ingredients": ["밥 1공기", "김치 1/2컵", "..."],
  "steps": [
    {
      "id": "s001-1",
      "order": 1,
      "instruction": "팬에 식용유를 두르고 중불로 가열하세요.",
      "timerSeconds": null
    },
    {
      "id": "s001-2",
      "order": 2,
      "instruction": "김치를 넣고 2분간 볶아주세요.",
      "timerSeconds": 120
    }
  ],
  "tags": ["korean", "spicy", "quick"],
  "difficulty": "easy",
  "prepTime": 5,
  "cookTime": 10,
  "servings": 1,
  "createdBy": null,
  "isPublic": true,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

`createdBy: null` — 기본 제공 레시피. `createdBy: "user-001"` — 사용자가 만든 레시피.

`step.timerSeconds` — 해당 단계에서 타이머가 필요한 초 수. `null`이면 타이머 없음.

### User

```json
{
  "id": "user-001",
  "username": "chef",
  "password": "$2b$10$...",
  "displayName": "요리사",
  "email": "chef@cooking.app",
  "favorites": ["recipe-001", "recipe-003"],
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

비밀번호는 **bcrypt 해시**로 저장됩니다(`bcryptjs`, cost factor 10). `users.json`의 초기값도 해시 상태입니다. 앱 시작 시 `initUsers()`가 localStorage의 평문 비밀번호를 자동으로 감지해 해시로 마이그레이션합니다.

즐겨찾기는 `User.favorites` 배열에 레시피 ID를 저장합니다. 레시피 자체를 복사하지 않아 레시피 수정 시 즐겨찾기에도 자동 반영됩니다.

### localStorage 키

`src/constants/storageKeys.js`의 `KEYS` 객체로 한 곳에서 관리합니다.

| 키 | 내용 |
|---|---|
| `cooking_recipes` | 모든 레시피 배열 (기본 + 사용자 생성) |
| `cooking_recipes_v` | 기본 레시피 시드 버전 번호 (마이그레이션용) |
| `cooking_recipes_backup` | 마이그레이션 직전 레시피 스냅샷 (롤백용) |
| `cooking_recipes_migrations` | 마이그레이션 감사 로그 배열 |
| `cooking_users` | 사용자 배열 (bcrypt 해시 비밀번호 + 즐겨찾기 포함) |
| `cooking_session` | 현재 로그인 세션 `{ id, username, displayName }` |

### 서비스 함수 반환 형식

모든 서비스 함수는 `{ data, error }` 형태를 반환합니다.

```js
// 성공
{ data: session, error: null }
// 실패
{ data: null, error: '아이디 또는 비밀번호가 올바르지 않습니다.' }
```

이 형식은 Supabase SDK의 응답과 동일하므로, 추후 백엔드 연동 시 서비스 레이어만 교체하면 됩니다.

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
         START 액션
  IDLE ──────────────→ SPEAKING
                           │
               TTS_DONE 후 ↓
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
| `timer` | 타이머 시작, 타이머 | 현재 단계의 타이머 시작 |

음성 인식은 TTS가 읽는 동안 비활성화되어 자기 음성이 명령으로 인식되는 피드백 루프를 방지합니다.

### 3. 단계별 타이머

`step.timerSeconds`가 설정된 단계에서는 요리 모드에 **타이머 버튼**이 나타납니다.

- 버튼 클릭 또는 **"타이머 시작"** 음성 명령으로 카운트다운 시작
- 카운트다운 중 실시간으로 남은 시간 표시 (분:초 형식)
- 종료 시 TTS로 "타이머가 종료되었습니다!" 안내
- 타이머는 음성 내비게이션 일시정지와 무관하게 독립 동작

레시피 생성·수정 화면에서 각 단계에 타이머 초 수를 직접 입력할 수 있습니다.

### 4. 인증 흐름

```
앱 시작
  └→ AuthContext (async)
       ├→ await initUsers()   // 평문 비밀번호 감지 시 bcrypt 해시로 자동 마이그레이션
       ├→ initRecipes()       // 버전 확인 후 필요 시 seed 마이그레이션
       └→ getSession()        // 기존 로그인 세션 복원
            ├→ 세션 있음 → 홈으로 (Zustand store 즉시 초기화)
            └→ 세션 없음 → /login

로그인
  └→ await auth.login(username, password)
       ├→ bcrypt.compare() 검증
       ├→ 성공 → { data: session } → AuthContext.setUser() → Zustand store 즉시 초기화
       └→ 실패 → { error: '...' } → 에러 메시지 표시

로그아웃
  └→ localStorage에서 session 제거
  └→ AuthContext.user = null → /login 리다이렉트
  └→ Zustand store 즐겨찾기 초기화
```

---

## 기술 스택

| 역할 | 기술 | 버전 |
|---|---|---|
| UI 프레임워크 | React | 18.3 |
| 빌드 도구 | Vite | 5.4 |
| 라우팅 | React Router DOM (HashRouter) | 6.26 |
| 스타일링 | Tailwind CSS | 3.4 |
| 전역 상태 | Zustand | 5.x |
| 비밀번호 해싱 | bcryptjs | 2.x |
| TTS | Web Speech Synthesis API | 브라우저 내장 |
| 음성 인식 | Web Speech Recognition API | 브라우저 내장 |
| 데이터 저장 | localStorage (storageAdapter 래퍼) | 브라우저 내장 |
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
| **다중 사용자** | 현재 1명의 기본 사용자만 포함. 회원가입 기능 없음 |
| **데이터 동기화** | 기기 간 데이터 공유 불가 (localStorage 한계) |
| **TTS 음질** | 브라우저 기본 음성 사용. 음성·속도 선택 불가 |
| **오프라인** | Service Worker 미적용. 첫 로드 시 인터넷 필요 |
| **이미지** | 레시피 이미지 없음 |

### Phase 2 개선 방향

- [ ] TTS 음성·속도 설정
- [ ] 레시피 이미지 업로드
- [ ] 즐겨찾기 내 정렬·필터
- [ ] difficulty 필터 (easy / medium / hard)
- [ ] 인분 수 조절 (servings 기반 재료 자동 계산)
- [ ] PWA (오프라인 지원, 홈 화면 추가)

### Phase 3 개선 방향

- [ ] Supabase / Firebase 연동 → storageAdapter만 교체하면 됩니다
- [ ] OAuth 로그인 (Google, Kakao)
- [ ] 레시피 공유 (공개/비공개)
- [ ] 커뮤니티 (댓글, 평점)
