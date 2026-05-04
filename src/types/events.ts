// Event types
export type GameEventType =
  | 'PLAYER_JOINED'
  | 'PLAYER_VOTED'
  | 'ALL_VOTES_RECEIVED'
  | 'DICE_ROLLED'
  | 'NODE_RESOLVED'
  | 'NODE_CHANGED'
  | 'PHASE_CHANGED'
  | 'PLAYER_LEFT'
  | 'ROOM_CLOSED';

export interface GameEventPayload {
  PLAYER_JOINED: { playerId: string; name: string; class: string };
  PLAYER_VOTED: { playerId: string; option: string };
  ALL_VOTES_RECEIVED: Record<string, never>;
  DICE_ROLLED: { playerId: string; value: number };
  NODE_RESOLVED: { nodeId: string };
  NODE_CHANGED: { from: string; to: string };
  PHASE_CHANGED: { from: string; to: string };
  PLAYER_LEFT: { playerId: string };
  ROOM_CLOSED: Record<string, never>;
}
