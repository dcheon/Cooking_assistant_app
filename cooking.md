# Cooking Voice Assistant — Web MVP

## 1. 앱 정의
손 안 쓰고 요리할 수 있게 도와주는 **음성 기반 웹 요리 앱**

---

## 2. 핵심 사용자 흐름

- 레시피 선택
- 요리 시작
- 단계 TTS로 읽기
- "next" 말하면 다음 단계

👉 핵심: 요리 중 화면 안 봐도 됨

---

## 3. MVP 목표

- 레시피 생성 가능
- 단계 TTS로 읽기
- "next" 음성 인식
- 터치 없이 요리 진행

👉 이 4개만 되면 성공

---

## 4. MVP 기능

### 🏠 Home
- 레시피 리스트
- 새 레시피 만들기 버튼

예시:
- 김치볶음밥
- 계란말이
- 라면

### 📖 Recipe Detail
- 재료 목록
- 단계 목록
- 요리 시작 버튼

### 🔥 Cooking Mode (핵심)
- 현재 단계 표시
- TTS로 읽기
- 음성 명령 인식

사용 명령어:
- `next` → 다음 단계
- `repeat` → 다시 읽기
- `pause` → 멈춤
- `back` → 이전 단계
- `done` → 종료

### ✍️ Create Recipe
- 제목 입력
- 재료 입력
- 단계 입력

👉 최대한 단순하게

### 📚 My Recipes
- 내가 만든 레시피 목록
- 수정 / 삭제
- 다시 요리 가능

---

## 5. 데이터 구조

**Recipe**
- id
- title
- ingredients (리스트)
- steps (리스트)
- createdAt
- updatedAt
- isPublic

**Step**
- id
- order
- instruction

---

## 6. 기술 스택 (Web)

| 기능 | 기술 |
|---|---|
| TTS | Web Speech Synthesis API (`SpeechSynthesisUtterance`) |
| 음성 인식 | Web Speech Recognition API (`SpeechRecognition`) |
| UI | React (Vite) |
| 라우팅 | React Router v6 |
| 상태 관리 | Zustand 또는 React Context |
| 저장 | localStorage (MVP) → 추후 Supabase 또는 Firebase |
| 스타일 | Tailwind CSS |
| 배포 | Vercel 또는 Netlify |

> ⚠️ Web Speech API 브라우저 지원: Chrome / Edge 권장. Safari는 음성 인식 미지원.

---

## 7. 핵심 서비스

**SpeechService**
- 음성 인식 시작 / 종료
- 명령어 파싱 (`next`, `repeat`, `back`, `pause`, `done`)

**TTSService**
- 텍스트 읽기 (`SpeechSynthesisUtterance`)
- 멈춤 / 반복

**RecipeStore**
- localStorage 저장 / 불러오기 / 수정 / 삭제

---

## 8. 화면 구조

```
Home
├── Recipe Detail
│   └── Cooking Mode
├── Create Recipe
└── My Recipes
```

---

## 9. Cooking Logic

- 시작 → step 0 읽기
- "next" → 다음 step
- "repeat" → 다시 읽기
- "back" → 이전 step
- "pause" → 멈춤
- "done" → 종료

---

## 10. Edge Cases

- 마지막 step에서 next → 종료 안내
- 첫 step에서 back → 무시
- 음성 인식 실패 → "다시 말해 주세요"
- 브라우저가 Web Speech API 미지원 → 텍스트 버튼으로 폴백

---

## 11. UX 핵심

❌ 나쁜 예: 긴 문장  
✔️ 좋은 예: 짧은 단계

- 팬에 기름을 두르세요
- 김치를 넣고 볶으세요

👉 반드시 단계를 쪼개야 함

---

## 12. 음성 명령 (MVP)

- `next`
- `repeat`
- `pause`
- `back`
- `done`

👉 이것만 지원

---

## 13. 상태 관리

- `idle`
- `speaking`
- `listening`
- `paused`
- `finished`

---

## 14. 성능 핵심

- 음성 인식 응답 빠르게 (< 1초)
- TTS 끊김 없음
- 자연스러운 흐름

---

## 15. 테스트 기준

- 요리 중 한 손으로 사용 가능?
- 화면 안 보고 가능?
- 소음 환경에서도 작동?
- 모바일 Chrome에서 동작?

---

## 16. MVP에서 제외

- 평점
- 커뮤니티
- 재료 공유
- 로그인 / 회원가입
- 추천 시스템
- 이미지 업로드

👉 절대 넣지 말 것

---

## 17. 확장 계획

**Phase 2**
- 즐겨찾기
- 타이머
- 간단 평점

**Phase 3**
- 커뮤니티
- 재료 정보 공유
- 로그인 (OAuth)

---

## 18. 재료 공유 (추후)

- 위치
- 사진 필수
- 최근 확인 날짜
- 여러 유저 확인

👉 평점만으로는 안됨

---

## 19. 저작권 가이드

허용:
- 직접 작성 레시피

금지:
- 블로그 복붙
- 요리책 복사
- 영상 내용 그대로 사용

---

## 20. 성공 기준

- 2분 안에 레시피 생성
- 음성으로 요리 완료
- 터치 없이 진행 가능

---

## 21. 핵심 전략

👉 "손 안 쓰고 요리 가능" 하나에 집중

---

## 22. 개발 순서

1. 데이터 모델 (Recipe, Step 타입 정의)
2. RecipeStore (localStorage CRUD)
3. 레시피 입력 UI
4. TTSService (Web Speech Synthesis)
5. Cooking Mode UI
6. SpeechService — `next` 음성 인식
7. 나머지 명령어 추가 (`repeat`, `back`, `pause`, `done`)
