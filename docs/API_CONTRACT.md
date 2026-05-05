# 🔌 API Contract: Zustand Store + Firebase Bridge

## 1. Global Game Store (Zustand)

```typescript
interface GameState {
  // Room State
  roomId: string | null;
  roomPin: string | null;
  
  // Player State
  playerId: string | null;
  playerClass: string | null;
  playerName: string | null;
  
  // Game State
  currentNode: string | null;
  phase: 'idle' | 'voting' | 'rolling' | 'resolving' | 'animating';
  players: Record<string, PlayerData>;
  
  // Interaction State
  votes: Record<string, string>;
  diceResult: number | null;
  selectedOption: string | null;
  
  // UI State
  loading: boolean;
  error: string | null;
  isConnected: boolean;
}

interface PlayerData {
  playerId: string;
  name: string;
  class: string;
  hp: number;
  maxHp: number;
  status: 'active' | 'downed' | 'dead';
  lastRoll?: number;
}
```

---

## 2. Firebase Firestore/Realtime DB Mapping

### Struktur Data Firebase:

```
/rooms/{roomId}
  ├─ meta
  │  ├─ created_at: timestamp
  │  ├─ status: "waiting" | "playing" | "ended"
  │  └─ scenario_id: "chapter_01_escape"
  ├─ state
  │  ├─ current_node: "node_002"
  │  ├─ phase: "voting"
  │  ├─ is_resolving: false
  │  └─ animation_done: false
  ├─ players
  │  └─ {playerId}: PlayerData
  ├─ votes
  │  └─ {playerId}: "option_a"
  └─ dice
     └─ {playerId}: { value, nonce, timestamp }
```

---

## 3. Action Creators (Zustand)

### A. Room Actions

```typescript
// Join room
joinRoom(roomPin: string, playerName: string, playerClass: string): Promise<void>
  → Firebase write: /rooms/{roomId}/players/{newId}
  → Update store.playerId, store.roomId

// Leave room
leaveRoom(): Promise<void>
  → Firebase delete: /rooms/{roomId}/players/{playerId}
  → Reset store

// Load room state
loadRoomState(roomId: string): Promise<void>
  → Firebase read: /rooms/{roomId}
  → Update all store state
```

### B. Game Actions

```typescript
// Submit vote
submitVote(optionId: string): Promise<void>
  → Firebase write: /rooms/{roomId}/votes/{playerId} = optionId
  → Update store.votes[playerId]
  → Emit event: PLAYER_VOTED

// Roll dice
rollDice(diceType: string): Promise<number>
  → Generate: Math.floor(Math.random() * 20) + 1
  → Firebase write: /rooms/{roomId}/dice/{playerId}
  → Update store.diceResult
  → Emit event: DICE_ROLLED

// Transition node
transitionNode(nextNodeId: string): Promise<void>
  → Firebase write: /rooms/{roomId}/state/current_node
  → Update store.currentNode
```

### C. UI Actions

```typescript
// Set phase
setPhase(phase: Phase): void
  → Update store.phase

// Set loading
setLoading(loading: boolean): void
  → Update store.loading

// Set error
setError(error: string | null): void
  → Update store.error
```

---

## 4. Firebase Listener (Subscribe Pattern)

```typescript
// Setup listeners
setupFirebaseListeners(roomId: string): () => void
  → on(/rooms/{roomId}/state) → update store.phase, current_node
  → on(/rooms/{roomId}/players) → update store.players
  → on(/rooms/{roomId}/votes) → update store.votes
  → on(/rooms/{roomId}/dice) → update store.diceResult
  → Return unsubscribe function

// Cleanup
useEffect(() => {
  const unsubscribe = setupFirebaseListeners(roomId);
  return unsubscribe;
}, [roomId]);
```

---

## 5. Error Handling

### Standard Error Codes:

```typescript
enum ErrorCode {
  ROOM_NOT_FOUND = 'ERR_ROOM_NOT_FOUND',
  ROOM_FULL = 'ERR_ROOM_FULL',
  GAME_STARTED = 'ERR_GAME_STARTED',
  INVALID_VOTE = 'ERR_INVALID_VOTE',
  NOT_YOUR_TURN = 'ERR_NOT_YOUR_TURN',
  AUTH_FAILED = 'ERR_AUTH_FAILED',
  FIREBASE_OFFLINE = 'ERR_FIREBASE_OFFLINE',
  INVALID_NODE = 'ERR_INVALID_NODE'
}

// Handling:
if (error.code === ErrorCode.ROOM_FULL) {
  store.setError('Ruangan penuh! Maksimal 6 pemain.');
}
```

---

## 6. Loading States

```typescript
interface LoadingState {
  isJoining: boolean;
  isVoting: boolean;
  isRolling: boolean;
  isTransitioning: boolean;
  isReconnecting: boolean;
}
```

**Usage:**
- Show spinner saat `isJoining = true`
- Disable vote button saat `isResolving = true`
- Show retry dialog saat `isReconnecting = true` dan `isConnected = false`

---

## 7. Event Emitter Pattern

```typescript
// Event types
type GameEvent = 
  | { type: 'PLAYER_JOINED'; playerId: string; name: string }
  | { type: 'PLAYER_VOTED'; playerId: string; option: string }
  | { type: 'ALL_VOTES_RECEIVED' }
  | { type: 'DICE_ROLLED'; playerId: string; value: number }
  | { type: 'NODE_CHANGED'; from: string; to: string }
  | { type: 'PHASE_CHANGED'; from: Phase; to: Phase }

// Subscribe
store.subscribe((state) => {
  // React to changes
});
```

---

## 8. Performance Optimization

### Debouncing:
```typescript
// Debounce Firebase writes (300ms)
const debouncedSubmitVote = debounce(submitVote, 300);
```

### Selective Updates:
```typescript
// Only update affected parts
if (newState.votes !== oldState.votes) {
  updateVoteUI();
}
```

---

## 9. Testing Contract

### Unit Tests:
```typescript
test('submitVote should update store and Firebase', async () => {
  const { result } = renderHook(() => useGameStore());
  await result.current.submitVote('option_a');
  expect(result.current.votes[playerId]).toBe('option_a');
});
```

### Integration Tests:
```typescript
test('joinRoom should sync with Firebase', async () => {
  // Mock Firebase
  // Call joinRoom
  // Assert store state matches Firebase
});
```

---

## 10. Type Definitions (TypeScript)

```typescript
// Character
type CharacterId = 'warrior' | 'mage' | 'rogue' | 'cleric';

// Phases
type Phase = 'idle' | 'voting' | 'rolling' | 'resolving' | 'animating';

// Node Types
type NodeType = 'narrative' | 'voting' | 'dice_check' | 'effect';

// Options
type Option = {
  id: string;
  text: string;
  icon?: string;
};
```