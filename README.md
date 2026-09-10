# 🍳 Cooking Voice Assistant

> A voice-driven web recipe app that lets you cook without touching the screen

---

## Contents

- [Overview](#overview)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [Data model](#data-model)
- [How the core features work](#how-the-core-features-work)
- [Tech stack](#tech-stack)
- [Browser support](#browser-support)
- [Known limitations and roadmap](#known-limitations-and-roadmap)

---

## Overview

A **voice-controlled recipe app** built for the moment your hands are covered in flour and
touching the screen is not an option. It runs entirely in the browser on the built-in Web
Speech APIs (speech synthesis + recognition), with no server behind it.

### Core flow

```
Pick a recipe → Start cooking → Each step is read aloud → Move through steps by voice
```

### Demo account

| Field | Value |
|---|---|
| Username | `chef` |
| Password | `1234` |

This is a local demo account. The app has no server and no real accounts; the seed user lives
in `data/users.json` and is copied into your browser's localStorage on first run.

---

## Getting started

### Requirements

- [Node.js](https://nodejs.org) 18 or newer
- Chrome or Edge (speech recognition support)

### Install and run

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

### Build

```bash
npm run build     # builds into dist/
npm run preview   # preview the build
```

---

## Project structure

```
cooking/
├── index.html                    # Vite entry point
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
│
└── src/
    ├── main.jsx                  # React mount, wraps the app in HashRouter
    ├── App.jsx                   # Route definitions, auth guard
    ├── index.css                 # Tailwind + custom animations
    │
    ├── data/                     # Initial seed data (JSON)
    │   ├── recipes.json          # 5 starter recipes
    │   └── users.json            # 1 starter user
    │
    ├── constants/
    │   └── tags.js               # Tag list, colors, labels
    │
    ├── context/
    │   └── AuthContext.jsx       # Global auth state (React Context)
    │
    ├── services/                 # Pure-function layer (no UI dependencies)
    │   ├── auth.js               # Login, logout, favorite toggling
    │   ├── recipeStore.js        # Recipe CRUD against localStorage
    │   ├── tts.js                # Web Speech Synthesis wrapper
    │   └── speech.js             # Web Speech Recognition wrapper
    │
    ├── components/               # Reusable UI components
    │   ├── NavBar.jsx            # Top navigation
    │   ├── RecipeCard.jsx        # Recipe card, including the favorite button
    │   └── TagBadge.jsx          # Tag badge
    │
    └── pages/                    # One component per route
        ├── LoginPage.jsx
        ├── HomePage.jsx          # Recipe list + search + tag filter
        ├── RecipeDetailPage.jsx  # Ingredients, steps, start button
        ├── CookingModePage.jsx   # ★ The heart of it: voice-controlled cooking mode
        ├── CreateRecipePage.jsx  # Create / edit a recipe
        ├── MyRecipesPage.jsx     # Recipes I wrote
        └── FavoritesPage.jsx     # Favorited recipes
```

---

## Architecture

### Layers

```
[ Pages / Components ]  ← React UI layer
        ↓ calls
[      Services      ]  ← Pure functions (localStorage, Web APIs)
        ↓ reads/writes
[    localStorage    ]  ← Persistent client-side storage
        ↑ seeded from
[    data/*.json     ]  ← Static initial data
```

The service layer is written as pure functions with no React dependency, so swapping
localStorage for an API server later will not require touching the page components.

### State management

| Kind of state | How it is managed | Why |
|---|---|---|
| Login session | `AuthContext` (React Context) | Shared across the whole app |
| Recipe lists | Per-page `useState` calling services directly | No need for global state |
| Cooking-mode progress | `useState` + `useRef` together | Works around closures in async callbacks |

### Handling async state in cooking mode (`CookingModePage`)

Cooking mode runs on two asynchronous callbacks — one from speech synthesis and one from
speech recognition — and neither can read the latest React state from inside its closure.
Two patterns solve this.

**1. Mirroring into a `useRef` so the TTS callback reads the current status**

```jsx
const statusRef = useRef('idle');

function syncStatus(s) {
  statusRef.current = s;  // ref updates immediately
  setStatus(s);           // React re-render is scheduled
}

// Inside the callback that fires once TTS finishes
speak(instruction, () => {
  if (statusRef.current === 'speaking') {  // read the fresh value from the ref
    syncStatus('listening');
  }
});
```

**2. A command-handler ref, so recognition always calls the latest function**

```jsx
const handleCommandRef = useRef(null);

// Replaced on every render with a closure over current state
handleCommandRef.current = (cmd) => { /* can read current state */ };

// The callback handed to startListening always dereferences the newest handler
startListening((cmd) => handleCommandRef.current(cmd), onError);
```

Together these give real-time voice control without stale-closure bugs or `useCallback`
dependency-array gymnastics.

### Routing

The app uses `HashRouter` (`#/`, `#/recipe/:id`, and so on) so that a production build runs
from any static file server — `python -m http.server` included — with no rewrite rules.

---

## Data model

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

`createdBy: null` marks a built-in recipe; `createdBy: "user-001"` marks one a user wrote.

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

Favorites are stored as recipe IDs on `User.favorites` rather than as copies of the recipes,
so edits to a recipe show up in everyone's favorites automatically.

### localStorage keys

| Key | Contents |
|---|---|
| `cooking_recipes` | Every recipe (built-in and user-created) |
| `cooking_users` | Users, including their favorites |
| `cooking_session` | The active session, `{ id, username, displayName }` |

On first launch the app copies `data/*.json` into localStorage and reads only from
localStorage from then on.

### Tags

`src/constants/tags.js` defines 13 tags. The labels below are the Korean strings shown in
the UI.

| Value | Label | Color |
|---|---|---|
| `korean` | 한식 | red |
| `japanese` | 일식 | pink |
| `italian` | 이탈리안 | green |
| `chinese` | 중식 | yellow |
| `mexican` | 멕시칸 | orange |
| `indian` | 인도 | amber |
| `american` | 미국식 | blue |
| `thai` | 태국 | lime |
| `french` | 프랑스 | indigo |
| `vegetarian` | 채식 | emerald |
| `spicy` | 매운맛 | dark red |
| `quick` | 간편식 | purple |
| `other` | 기타 | gray |

---

## How the core features work

### 1. The cooking-mode state machine

```
         startCooking()
  IDLE ──────────────→ SPEAKING
                           │
              once TTS ends ↓
                       LISTENING ←──────────────────┐
                           │                        │
              "next"/"back" │ "repeat"              │ (restart)
                           ↓                        │
                       SPEAKING ────────────────────┘
                           │
                    "pause" │
                           ↓
                       PAUSED ──── "pause" ──→ SPEAKING (resume)
                           │
                     "done" │ or "next" on the last step
                           ↓
                       FINISHED
```

### 2. Voice commands

| Command | Korean synonyms | What it does |
|---|---|---|
| `next` | 다음, 넥스트 | Advance one step |
| `back` | 이전, 뒤로 | Go back one step |
| `repeat` | 다시, 반복 | Read the current step again |
| `pause` | 멈춤, 정지, 일시정지 | Pause / resume |
| `done` | 종료, 끝, 완료 | End the session |

Recognition is switched off while TTS is speaking, so the app never hears its own voice and
treats it as a command.

### 3. Auth flow

```
App starts
  └→ AuthContext.initUsers()  // seed from users.json if localStorage has no users
  └→ getSession()             // restore an existing session
       ├→ session found → home
       └→ no session   → /login

Login
  └→ auth.login(username, password)
       ├→ match    → save session to localStorage, update AuthContext.user
       └→ no match → error message

Logout
  └→ remove the session from localStorage
  └→ AuthContext.user = null → redirect to /login
```

---

## Tech stack

| Role | Technology | Version |
|---|---|---|
| UI framework | React | 18.3 |
| Build tool | Vite | 5.4 |
| Routing | React Router DOM (HashRouter) | 6.26 |
| Styling | Tailwind CSS | 3.4 |
| Text to speech | Web Speech Synthesis API | built into the browser |
| Speech recognition | Web Speech Recognition API | built into the browser |
| Storage | localStorage | built into the browser |
| Seed data | JSON (handled natively by Vite) | — |

**No external servers and no API keys are required.**

---

## Browser support

| Feature | Chrome | Edge | Firefox | Safari |
|---|---|---|---|---|
| TTS (SpeechSynthesis) | ✅ | ✅ | ✅ | ✅ |
| Speech recognition | ✅ | ✅ | ❌ | ❌ |
| App overall | ✅ | ✅ | ⚠️ button fallback | ⚠️ button fallback |

Where recognition is unavailable, every step can still be driven with on-screen buttons.

---

## Known limitations and roadmap

### Current limitations

| Area | Detail |
|---|---|
| **Security** | Passwords are stored in localStorage in plain text. This is a personal-device MVP with no server |
| **Multi-user** | Ships with a single seed user; there is no sign-up flow |
| **Sync** | No sharing across devices, by the nature of localStorage |
| **TTS quality** | Uses the browser's default voice, with no voice picker |
| **Offline** | No service worker yet, so the first load needs a connection |
| **Images** | Recipes have no images |

### Phase 2

- [ ] Timers, set per step
- [ ] Sorting and filtering inside favorites
- [ ] TTS voice and speed settings
- [ ] Recipe image upload
- [ ] PWA (offline support, add to home screen)

### Phase 3

- [ ] Supabase / Firebase integration for server storage and cross-device sync
- [ ] OAuth login (Google, Kakao)
- [ ] Recipe sharing (public / private)
- [ ] Community features (comments, ratings)
