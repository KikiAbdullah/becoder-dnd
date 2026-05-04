export function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

export function rollDice(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

export function generateRoomPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function generatePlayerId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getModifierLabel(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}
