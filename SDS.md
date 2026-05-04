# 📄 SDS: Chrono-Dungeon VTT

**Version:** 3.0 (System Design Spec)
**Status:** Build-Ready (AI + Dev)

---

# 1. High-Level Architecture

## 1.0 Component Interfaces

```ts
interface IPlayerClient {
  submitVote(option: string): Promise<void>;
  rollDice(type: string): Promise<number>;
}

interface IResolver {
  validateTransition(current: string, next: string): boolean;
  processEvent(event: GameEvent): StateUpdate;
}

interface ITVClient {
  renderState(state: GameState): void;
  playAnimation(type: string): Promise<void>;
}

## 1.1 System Components

```text
[ Player Clients (Mobile) ]
        ↓ (write)
[ Firebase Realtime DB ]
        ↑↓ (read/write)
[ Resolver Engine (Authoritative Logic) ]
        ↓ (read)
[ TV Client (Renderer) ]
```

---

## 1.2 Responsibility Split

| Component       | Role               |
| --------------- | ------------------ |
| Player Client   | Input (vote, dice) |
| Firebase        | State store + sync |
| Resolver Engine | Decision maker     |
| TV Client       | Pure renderer      |

---

# 2. Core Concept: Game Loop Orchestrator

👉 Ini adalah “otak sistem”

---

## 2.1 Resolver Engine (MANDATORY)

```ts
interface GameResolver {
  tick(roomId: string): void

  resolveVoting(room): void
  resolveDice(room): void
  transitionNode(room, nextNodeId): void
}
```

---

## 2.2 Execution Strategy

### Option A (Fast Build)

* Resolver dijalankan di TV client (polling / listener)

### Option B (Production)

* Resolver dijalankan via Firebase Cloud Functions (onWrite trigger)

---

## 2.3 Tick Flow

```typescript
// Pseudo-implementation
export class GameResolver {
  private tick(roomId: string) {
    const room = await getRoom(roomId);
    
    switch (room.state.phase) {
      case 'voting':
        if (this.allVotesReceived(room)) {
          this.resolveVoting(room);
          this.transitionNode(room, room.state.nextNode);
        }
        break;
        
      case 'rolling':
        if (this.allDiceRolled(room)) {
          this.resolveDice(room);
          this.transitionNode(room, room.state.nextNode);
        }
        break;
        
      case 'resolving':
        if (room.state.animation_done) {
          this.setPhase(room, 'idle');
        }
        break;
    }
  }
}

---

# 3. Finite State Machine (STRICT)

---

## 3.1 Global State

```ts
type Phase =
  | "idle"
  | "voting"
  | "rolling"
  | "resolving"
  | "animating"
```

---

## 3.2 Transition Rules

```ts
const TRANSITIONS = {
  idle: ["voting", "rolling"],
  voting: ["resolving"],
  rolling: ["resolving"],
  resolving: ["animating"],
  animating: ["idle"]
}
```

---

## 3.3 Guard

```ts
if (!TRANSITIONS[current].includes(next)) {
  throw Error("Invalid transition")
}
```

---

# 4. Event System (CRITICAL)

👉 Semua perubahan harus berbasis event, bukan implicit state

---

## 4.1 Event Contract

```ts
type GameEvent =
  | { type: "PLAYER_JOINED"; playerId }
  | { type: "PLAYER_VOTED"; playerId; option }
  | { type: "ALL_VOTES_RECEIVED" }
  | { type: "DICE_ROLLED"; playerId; value }
  | { type: "NODE_RESOLVED"; nodeId }
  | { type: "NODE_CHANGED"; from; to }
```

---

## 4.2 Event Storage

```json
events: {
  event_id: {
    type,
    payload,
    timestamp
  }
}
```

---

## 4.3 Event Processing Rule

* Resolver membaca event
* Mengubah state
* Emit event baru

---

# 5. Concurrency Control

---

## 5.1 Locking Mechanism

```json
state: {
  is_resolving: true,
  lock_owner: "resolver",
  lock_timestamp: 123123
}
```

---

## 5.2 Rules

* Jika `is_resolving = true`
  → reject semua input

---

## 5.3 Deadlock Prevention

* Auto unlock jika:

  * > 5 detik tidak selesai

---

# 6. Idempotency System

---

## 6.1 Vote Structure

```json
votes: {
  player_id: {
    option: "A",
    submitted_at: timestamp
  }
}
```

---

## 6.2 Rule

* Update overwrite
* Tidak boleh increment

---

## 6.3 Dice Idempotency

```json
dice: {
  player_id: {
    value,
    nonce
  }
}
```

* nonce unik per roll

---

# 7. Room Lifecycle State Machine

---

## 7.1 Lifecycle

```text
CREATED →
WAITING →
READY →
PLAYING →
PAUSED →
ENDED →
CLEANED
```

---

## 7.2 Transitions

| From    | To      |
| ------- | ------- |
| WAITING | READY   |
| READY   | PLAYING |
| PLAYING | PAUSED  |
| PLAYING | ENDED   |

---

# 8. Join & Role Validation

---

## 8.1 Join Rules

| Condition       | Result   |
| --------------- | -------- |
| Room full       | reject   |
| Character taken | reject   |
| Game started    | spectate |

---

## 8.2 Roles

| Role      | Permission |
| --------- | ---------- |
| player    | vote, roll |
| spectator | read only  |
| host      | override   |

---

# 9. Persistence & Recovery

---

## 9.1 Snapshot System

```json
snapshot: {
  node,
  players,
  state,
  timestamp
}
```

---

## 9.2 Recovery Flow

```text
LOAD SNAPSHOT →
RESTORE STATE →
RESUME LOOP
```

---

# 10. Animation Synchronization

---

## 10.1 Animation State

```json
state: {
  animation: "dice_roll",
  animation_done: false
}
```

---

## 10.2 Rule

* Resolver tidak boleh lanjut
* sampai `animation_done = true`

---

# 11. Rate Limiting

---

## 11.1 Client

* debounce: 300ms

---

## 11.2 Server

* max 1 action / player / second

---

# 12. Firebase Rules (STRICT)

---

## 12.1 Write Rules

```javascript
// Firebase Rules
{
  "rules": {
    "rooms": {
      "$roomId": {
        "votes": {
          "$playerId": {
            ".write": "auth != null && auth.uid == $playerId",
            ".validate": "newData.isString() && 
                          newData.val() in ['A','B','C']"
          }
        },
        "dice": {
          "$playerId": {
            ".write": "auth != null && auth.uid == $playerId",
            ".validate": "newData.child('value').isNumber() &&
                          newData.child('nonce').isString()"
          }
        }
      }
    }
  }
}
```

---

## 12.2 Forbidden

* write state
* write players
* write current_node

---

# 13. Scenario System (MODULAR)

---

## 13.1 Structure

```text
/scenarios
  /chapter1.json
  /chapter2.json
```

---

## 13.2 Loader

```ts
loadScenario(chapterId)
mergeNodes()
```

---

# 14. Deployment Strategy

---

## 14.1 Environment

```env
VITE_FIREBASE_API_KEY=
VITE_ENV=production
```

---

## 14.2 Build

```bash
npm run build
npm run deploy (gh-pages)
```

---

# 15. Observability

---

## 15.1 Logging

```json
log: {
  type: "ERROR",
  message,
  context
}
```

---

## 15.2 Metrics

* node time spent
* vote latency
* error rate

---

# 16. Dev Tooling

---

## Debug Panel

* current_node
* state
* players
* events stream

---

# 17. AI Build Execution Plan

---

## Step-by-step (IMPORTANT)

---

### Step 1 — Core Engine

* FSM implementation
* Resolver engine

---

### Step 2 — Firebase Adapter

* subscribe
* write wrapper
* validation

---

### Step 3 — Event System

* event emit
* event listener

---

### Step 4 — Player UI

* voting
* dice

---

### Step 5 — TV UI

* renderer
* animation

---

# 18. Critical Guarantees

System HARUS menjamin:

1. Tidak ada double vote
2. Tidak ada invalid node transition
3. Tidak ada race condition
4. Semua state reproducible
5. Semua event traceable
