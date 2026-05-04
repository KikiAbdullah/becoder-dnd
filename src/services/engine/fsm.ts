import { Phase } from '../../types/game';

const TRANSITIONS: Record<Phase, Phase[]> = {
  idle: ['voting', 'rolling'],
  voting: ['resolving'],
  rolling: ['resolving'],
  resolving: ['animating'],
  animating: ['idle']
};

export function canTransition(current: Phase, next: Phase): boolean {
  return TRANSITIONS[current]?.includes(next) ?? false;
}

export function validateTransition(current: Phase, next: Phase): void {
  if (!canTransition(current, next)) {
    throw new Error(`Invalid phase transition: ${current} → ${next}`);
  }
}
