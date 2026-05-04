import { 
  ref, 
  set, 
  get, 
  push, 
  update, 
  remove,
  onValue,
  DataSnapshot
} from 'firebase/database';
import { db } from './config';
import { RoomData, PlayerData } from '../../types/game';

// Room Operations
export async function createRoom(scenario_id: string): Promise<string> {
  const roomsRef = ref(db, 'rooms');
  const newRoomRef = push(roomsRef);
  
  const roomData: RoomData = {
    roomId: newRoomRef.key || '',
    meta: {
      created_at: Date.now(),
      status: 'waiting',
      scenario_version: scenario_id
    },
    state: {
      current_node: 'node_001',
      phase: 'idle',
      is_resolving: false,
      animation_done: false
    },
    players: {},
    votes: {},
    dice: {}
  };
  
  await set(newRoomRef, roomData);
  return newRoomRef.key || '';
}

export async function getRoomData(roomId: string): Promise<RoomData | null> {
  const roomRef = ref(db, `rooms/${roomId}`);
  const snapshot = await get(roomRef);
  return snapshot.exists() ? snapshot.val() : null;
}

export function subscribeToRoom(
  roomId: string, 
  callback: (data: RoomData) => void
): () => void {
  const roomRef = ref(db, `rooms/${roomId}`);
  
  const unsubscribe = onValue(roomRef, (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    }
  });
  
  return unsubscribe;
}

// Player Operations
export async function addPlayerToRoom(
  roomId: string,
  playerId: string,
  playerData: PlayerData
): Promise<void> {
  const playerRef = ref(db, `rooms/${roomId}/players/${playerId}`);
  await set(playerRef, playerData);
  
  // Save to session storage for reconnection
  sessionStorage.setItem('player_session', JSON.stringify({
    roomId,
    playerId
  }));
}

export async function removePlayerFromRoom(
  roomId: string,
  playerId: string
): Promise<void> {
  const playerRef = ref(db, `rooms/${roomId}/players/${playerId}`);
  await remove(playerRef);
  sessionStorage.removeItem('player_session');
}

// Vote Operations
export async function submitVote(
  roomId: string,
  playerId: string,
  optionId: string
): Promise<void> {
  const voteRef = ref(db, `rooms/${roomId}/votes/${playerId}`);
  await set(voteRef, optionId);
}

export async function getRoomVotes(roomId: string): Promise<Record<string, string>> {
  const votesRef = ref(db, `rooms/${roomId}/votes`);
  const snapshot = await get(votesRef);
  return snapshot.exists() ? snapshot.val() : {};
}

// Dice Operations
export async function submitDiceRoll(
  roomId: string,
  playerId: string,
  value: number
): Promise<void> {
  const nonce = `${Date.now()}-${Math.random()}`;
  const diceRef = ref(db, `rooms/${roomId}/dice/${playerId}`);
  
  await set(diceRef, {
    value,
    nonce,
    timestamp: Date.now()
  });
}

// State Operations
export async function updateRoomState(
  roomId: string,
  updates: Record<string, any>
): Promise<void> {
  const stateRef = ref(db, `rooms/${roomId}/state`);
  await update(stateRef, updates);
}

export async function transitionNode(
  roomId: string,
  nextNodeId: string
): Promise<void> {
  await updateRoomState(roomId, {
    current_node: nextNodeId,
    phase: 'idle'
  });
  
  // Clear votes and dice for new phase
  const votesRef = ref(db, `rooms/${roomId}/votes`);
  const diceRef = ref(db, `rooms/${roomId}/dice`);
  
  await set(votesRef, {});
  await set(diceRef, {});
}

export async function setPhase(
  roomId: string,
  phase: string
): Promise<void> {
  await updateRoomState(roomId, { phase });
}

export async function closeRoom(roomId: string): Promise<void> {
  const roomRef = ref(db, `rooms/${roomId}`);
  await remove(roomRef);
}
