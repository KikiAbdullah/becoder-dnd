import { create } from 'zustand';
import { 
  PlayerData, 
  Phase, 
  RoomStatus, 
  RoomData 
} from '../types/game';

interface GameState {
  // Room Info
  roomId: string | null;
  roomPin: string | null;
  status: RoomStatus;
  scenario_version: string | null;
  
  // Local Player
  playerId: string | null;
  playerName: string | null;
  playerClass: string | null;
  
  // Current Game State
  currentNode: string | null;
  phase: Phase;
  players: Record<string, PlayerData>;
  votes: Record<string, string>;
  diceResults: Record<string, { value: number; timestamp: number }>;
  
  // Status
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;

  // Actions
  setRoomInfo: (roomId: string, roomPin: string, status: RoomStatus) => void;
  setLocalPlayer: (playerId: string, name: string, className: string) => void;
  updateFromFirebase: (data: Partial<RoomData>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setConnected: (connected: boolean) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  roomId: null,
  roomPin: null,
  status: 'waiting',
  scenario_version: null,
  
  playerId: null,
  playerName: null,
  playerClass: null,
  
  currentNode: null,
  phase: 'idle',
  players: {},
  votes: {},
  diceResults: {},
  
  isLoading: false,
  error: null,
  isConnected: false,

  setRoomInfo: (roomId, roomPin, status) => set({ roomId, roomPin, status }),
  
  setLocalPlayer: (playerId, name, className) => set({ 
    playerId, 
    playerName: name, 
    playerClass: className 
  }),
  
  updateFromFirebase: (data) => set((state) => ({
    status: data.meta?.status ?? state.status,
    scenario_version: data.meta?.scenario_version ?? state.scenario_version,
    currentNode: data.state?.current_node ?? state.currentNode,
    phase: data.state?.phase ?? state.phase,
    players: data.players ?? state.players,
    votes: data.votes ?? state.votes,
    diceResults: data.dice ? Object.entries(data.dice).reduce((acc, [id, val]) => ({
      ...acc,
      [id]: { value: val.value, timestamp: val.timestamp }
    }), {}) : state.diceResults
  })),
  
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setConnected: (connected) => set({ isConnected: connected }),
  
  reset: () => set({
    roomId: null,
    roomPin: null,
    status: 'waiting',
    scenario_version: null,
    playerId: null,
    playerName: null,
    playerClass: null,
    currentNode: null,
    phase: 'idle',
    players: {},
    votes: {},
    diceResults: {},
    error: null
  })
}));
