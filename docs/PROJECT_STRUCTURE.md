# 📋 PROJECT STRUCTURE: Chrono-Dungeon VTT

```
becoder_dnd/
├── 📁 docs/                          # Dokumentasi & Spesifikasi
│   ├── PRD.md                        # Product Requirements Document
│   ├── SDS.md                        # System Design Specification
│   ├── DND_RULES_ID.md               # Aturan Main D&D dalam Bahasa Indonesia
│   ├── API_CONTRACT.md               # Zustand + Firebase Bridge
│   ├── ASSETS_MANIFEST.md            # Asset Strategy & Naming Convention
│   ├── FIREBASE_SETUP_GUIDE.md       # Tutorial Setup Firebase
│   ├── CHARACTER_TEMPLATES.json      # Template Data Karakter
│   └── example_scenario.json         # Contoh Skenario Game
│
├── 📁 src/                           # Source Code
│   ├── 📁 components/                # React Components
│   │   ├── 📁 common/                # Shared components
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   │
│   │   ├── 📁 screens/               # Page screens
│   │   │   ├── HomeScreen.tsx        # Halaman utama (create/join room)
│   │   │   ├── LobbyScreen.tsx       # Halaman tunggu pemain
│   │   │   ├── GameScreen.tsx        # Halaman main game
│   │   │   ├── CharacterSelectScreen.tsx
│   │   │   └── GameOverScreen.tsx
│   │   │
│   │   ├── 📁 game/                  # Game-specific components
│   │   │   ├── 📁 tv/                # Server (TV) display
│   │   │   │   ├── TVStage.tsx       # Main narrative display
│   │   │   │   ├── PlayerHUD.tsx     # Show player status
│   │   │   │   ├── AnimationLayer.tsx
│   │   │   │   └── EventPopup.tsx    # Damage, heal notifications
│   │   │   │
│   │   │   └── 📁 player/            # Player (Mobile) controller
│   │   │       ├── VotingPanel.tsx   # Vote buttons
│   │   │       ├── DiceRoller.tsx    # Dice roll UI
│   │   │       ├── CharacterSheet.tsx
│   │   │       └── ActionLog.tsx
│   │   │
│   │   └── 📁 host/                  # Host control (optional)
│   │       ├── HostPanel.tsx
│   │       ├── NodeDebugger.tsx
│   │       └── PlayerManager.tsx
│   │
│   ├── 📁 hooks/                     # Custom React Hooks
│   │   ├── useGameStore.ts           # Zustand store hook
│   │   ├── useFirebase.ts            # Firebase connection
│   │   ├── useAnimation.ts           # Animation helpers
│   │   └── useLocalStorage.ts        # Session persistence
│   │
│   ├── 📁 store/                     # State Management (Zustand)
│   │   ├── gameStore.ts              # Main game store
│   │   ├── uiStore.ts                # UI state (modal, loading, etc)
│   │   └── types.ts                  # Store type definitions
│   │
│   ├── 📁 services/                  # Business Logic
│   │   ├── 📁 firebase/
│   │   │   ├── config.ts             # Firebase initialization
│   │   │   ├── database.ts           # DB operations
│   │   │   ├── auth.ts               # Authentication
│   │   │   └── listeners.ts          # Real-time listeners
│   │   │
│   │   ├── 📁 engine/
│   │   │   ├── fsm.ts                # Finite State Machine
│   │   │   ├── resolver.ts           # Game Resolver Logic
│   │   │   ├── scenario.ts           # JSON scenario loader
│   │   │   └── validator.ts          # Schema validation (Zod)
│   │   │
│   │   ├── 📁 game/
│   │   │   ├── voting.ts             # Vote resolution
│   │   │   ├── dice.ts               # Dice mechanics
│   │   │   ├── character.ts          # Character templates
│   │   │   └── effects.ts            # Visual effects logic
│   │   │
│   │   └── analytics.ts              # Event tracking
│   │
│   ├── 📁 types/                     # TypeScript type definitions
│   │   ├── game.ts                   # Game types
│   │   ├── firebase.ts               # Firebase types
│   │   ├── events.ts                 # Event types
│   │   └── ui.ts                     # UI state types
│   │
│   ├── 📁 utils/                     # Utility functions
│   │   ├── formatters.ts             # String formatting
│   │   ├── validators.ts             # Input validation
│   │   ├── calculateModifier.ts      # D&D calculations
│   │   ├── generateRoomPin.ts        # Room code generation
│   │   └── logger.ts                 # Debug logging
│   │
│   ├── 📁 styles/                    # Global styles
│   │   ├── globals.css               # Tailwind + custom
│   │   ├── animations.css            # Keyframes
│   │   └── theme.css                 # Color variables
│   │
│   ├── App.tsx                       # Main app component
│   └── main.tsx                      # Entry point
│
├── 📁 public/                        # Static assets
│   ├── 📁 images/
│   │   ├── 📁 backgrounds/           # Scene backgrounds
│   │   ├── 📁 characters/            # Character art
│   │   ├── 📁 effects/               # Visual effects
│   │   └── 📁 ui/                    # UI elements
│   │
│   ├── 📁 audio/
│   │   ├── 📁 sfx/                   # Sound effects
│   │   └── 📁 music/                 # Ambient music
│   │
│   └── favicon.ico
│
├── 📁 tests/                         # Test files
│   ├── 📁 unit/
│   │   ├── engine.test.ts
│   │   ├── resolver.test.ts
│   │   ├── validator.test.ts
│   │   └── dice.test.ts
│   │
│   ├── 📁 integration/
│   │   ├── firebase.test.ts
│   │   ├── gameflow.test.ts
│   │   └── voting.test.ts
│   │
│   └── 📁 e2e/
│       ├── join-game.e2e.ts
│       ├── vote-resolve.e2e.ts
│       └── reconnect.e2e.ts
│
├── .env                              # Environment variables (Firebase config)
├── .env.example                      # Template for .env
├── .gitignore
├── tsconfig.json
├── vite.config.ts
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── README.md                         # Project overview
```

---

## 📂 File Organization Philosophy

### `/docs`
- Semua dokumentasi teknis, spesifikasi, dan tutorial.
- Single source of truth untuk design decisions.

### `/src`
- Terorganisir berdasarkan **feature** bukan **layer**.
- Mudah untuk scale & maintain.

### `/src/services`
- Pure business logic, tidak terikat React.
- Testable tanpa mock komponen.

### `/src/components`
- **Presentational** (common/) vs **Feature-specific** (game/).
- TV & Player UI terpisah jelas.

### `/tests`
- Unit, Integration, E2E terstruktur.
- Testing file naming: `{component}.test.ts`

---

## 🚀 Implementasi Prioritas

1. **Phase 1 - Infrastructure**
   - Setup React + Vite + Tailwind
   - Firebase connection
   - Zustand store structure

2. **Phase 2 - Core Engine**
   - FSM implementation
   - Scenario loader + validator
   - Voting/Dice resolver

3. **Phase 3 - UI Components**
   - HomeScreen (create/join)
   - GameScreen TV + Player
   - Character selection

4. **Phase 4 - Polish & Deploy**
   - Animations & effects
   - Error handling & reconnect
   - GitHub Pages deployment