# 🎲 Chrono-Dungeon VTT

**Chrono-Dungeon** adalah *virtual tabletop engine* untuk Dungeons & Dragons 5th Edition yang dioptimalkan untuk pengalaman **real-time hybrid**:
- 📺 **TV Display** (Server/Host) → Rendering engine (read-only)
- 📱 **Mobile Controller** (Players) → Input engine (write-controlled)

Sistem ini menggabungkan **deterministic narrative engine**, **real-time sync** via Firebase, dan **event-driven UI** untuk menciptakan pengalaman D&D yang immersive dan responsif.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm atau pnpm
- Firebase account (config di `.env`)

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/becoder_dnd.git
cd becoder_dnd

# Install dependencies
npm install

# Setup Firebase (copy .env.example ke .env dan isi config)
cp .env.example .env

# Run dev server
npm run dev
```

**URL Lokal:**
- TV Client: `http://localhost:5173/tv`
- Player Client: `http://localhost:5173/player`

---

## 📚 Documentation

Semua dokumentasi tersedia di folder `/docs`:

| File | Purpose |
| :--- | :--- |
| `PRD.md` | Product Requirements Document |
| `SDS.md` | System Design Specification |
| `API_CONTRACT.md` | Zustand Store + Firebase Bridge |
| `ASSETS_MANIFEST.md` | Asset strategy & naming conventions |
| `DND_RULES_ID.md` | D&D 5e Rules (Indonesian) |
| `FIREBASE_SETUP_GUIDE.md` | Firebase setup tutorial |
| `PROJECT_STRUCTURE.md` | Folder & file organization |
| `CHARACTER_TEMPLATES.json` | Character class data |
| `example_scenario.json` | Sample game scenario |

---

## 🎯 Project Goals

✅ **Production-Ready**: Deployment-siap untuk GitHub Pages  
✅ **Scalable**: Support hingga 100 concurrent rooms × 6 players  
✅ **Real-Time**: Latency < 200ms untuk semua interaksi  
✅ **Accessible**: Minimum 24px font, 48px buttons  
✅ **Testable**: Unit + Integration + E2E coverage  

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         Player Clients (Mobile)         │
│  ↓ (vote, dice roll)                    │
├─────────────────────────────────────────┤
│        Firebase Realtime Database       │
│  ↑ (state, events)                      │
├─────────────────────────────────────────┤
│      Game Resolver Engine (Logic)       │
│  ← (validate, transition)               │
├─────────────────────────────────────────┤
│           TV Client (Display)           │
│  (render narrative, animations)         │
└─────────────────────────────────────────┘
```

---

## 🎮 Game Flow

1. **Host** membuat room → Dapatkan PIN 4-digit
2. **Players** join room → Pilih karakter
3. **Game** dimulai → Load skenario dari JSON
4. **Loop Utama:**
   - **Narrative**: TV menampilkan cerita
   - **Voting**: Players vote untuk action
   - **Resolving**: Server resolve votes + tentukan node berikutnya
   - **Rolling**: Jika ada dice check, players roll
   - **Animation**: TV play animation hasil
   - Repeat sampai scenario end

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Backend**: Firebase Realtime Database + Cloud Functions (optional)
- **Validation**: Zod
- **Testing**: Vitest + React Testing Library + Playwright
- **Deployment**: GitHub Pages

---

## 📋 Project Structure

```
becoder_dnd/
├── docs/                     # Dokumentasi & spesifikasi
├── src/                      # Source code
│   ├── components/           # React components (TV + Player + Host UI)
│   ├── services/             # Business logic (engine, firebase, game)
│   ├── store/                # Zustand state management
│   ├── types/                # TypeScript types
│   └── utils/                # Helper functions
├── public/                   # Static assets (images, audio)
├── tests/                    # Unit, integration, E2E tests
└── package.json
```

Lihat `docs/PROJECT_STRUCTURE.md` untuk detail lengkap.

---

## 🚦 Development Roadmap

### Phase 1: Infrastructure (Week 1)
- [x] Setup React + Vite + Tailwind
- [x] Firebase configuration
- [ ] Zustand store boilerplate

### Phase 2: Core Engine (Week 2)
- [ ] FSM implementation
- [ ] Scenario JSON parser + validator
- [ ] Voting & dice resolver

### Phase 3: UI Implementation (Week 3)
- [ ] HomeScreen (create/join room)
- [ ] GameScreen TV display
- [ ] GameScreen Player controller
- [ ] Character selection

### Phase 4: Polish & Deploy (Week 4)
- [ ] Animations & visual effects
- [ ] Error handling & reconnection
- [ ] Performance optimization
- [ ] Deploy to GitHub Pages

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

---

## 🚀 Build & Deployment

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

---

## 📝 Game Scenario Format

Skenario game disimpan dalam format JSON. Contoh:

```json
{
  "scenario_id": "tutorial_01",
  "nodes": {
    "node_001": {
      "type": "narrative",
      "text": "You enter a dark cave...",
      "image": "cave.webp",
      "auto_advance": 5000,
      "next": "node_002"
    },
    "node_002": {
      "type": "voting",
      "text": "Which path do you take?",
      "options": [
        { "id": "opt_1", "text": "Left tunnel" },
        { "id": "opt_2", "text": "Right tunnel" }
      ],
      "timeout": 30000
    }
  },
  "start_node": "node_001"
}
```

---

## 🐛 Troubleshooting

### Firebase Connection Failed
- Cek `.env` file sudah di-setup
- Verify Realtime Database URL di Firebase Console

### Players tidak sync
- Check Firebase Rules di Console
- Pastikan authentication enabled (Anonymous sign-in)

### Dice roll error
- Validate `CHARACTER_TEMPLATES.json` format
- Check browser console untuk error messages

---

## 📞 Support & Feedback

- **Issues**: Report di [GitHub Issues](https://github.com/your-org/becoder_dnd/issues)
- **Documentation**: Lihat `/docs` folder
- **Contact**: [your-email]

---

## 📄 License

MIT License - lihat `LICENSE` file untuk detail

---

**Made with ❤️ for D&D enthusiasts**