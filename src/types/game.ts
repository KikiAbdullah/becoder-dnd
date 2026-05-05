// Game types
export type Phase = 'idle' | 'voting' | 'rolling' | 'resolving' | 'animating';
export type NodeType = 'narrative' | 'voting' | 'dice_check' | 'effect';
export type CharacterId = 'warrior' | 'mage' | 'rogue' | 'cleric';
export type RoomStatus = 'waiting' | 'playing' | 'ended';

export interface PlayerData {
  playerId: string;
  name: string;
  class: CharacterId;
  hp: number;
  maxHp: number;
  status: 'active' | 'downed' | 'dead' | 'afk';
  lastRoll?: number;
  abilityScores: AbilityScores;
  modifiers: Modifiers;
  ac: number;
}

export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface Modifiers {
  str_mod: number;
  dex_mod: number;
  con_mod: number;
  int_mod: number;
  wis_mod: number;
  cha_mod: number;
}

export interface Option {
  id: string;
  text: string;
  icon?: string;
}

export interface GameNode {
  id: string;
  type: NodeType;
  text: string;
  image?: string;
  auto_advance?: number;
  next?: string;
  options?: Option[];
  timeout?: number;
  on_timeout?: string;
  on_success?: string;
  on_fail?: string;
  difficulty?: number;
  required_ability?: keyof AbilityScores;
}

export interface Scenario {
  scenario_id: string;
  nodes: Record<string, GameNode>;
  start_node: string;
}

export interface GameEvent {
  type: string;
  playerId?: string;
  payload?: Record<string, any>;
  timestamp: number;
}

export interface RoomData {
  roomId: string;
  meta: {
    created_at: number;
    status: RoomStatus;
    scenario_version: string;
  };
  state: {
    current_node: string;
    phase: Phase;
    is_resolving: boolean;
    animation_done: boolean;
  };
  players: Record<string, PlayerData>;
  votes: Record<string, string>;
  dice: Record<string, { value: number; nonce: string; timestamp: number }>;
}
