import { RoomData, GameNode, PlayerData } from '../../types/game';
import { transitionNode, updateRoomState } from '../firebase/database';

export function resolveVoting(
  votes: Record<string, string>,
  options: string[]
): string {
  const tally: Record<string, number> = {};
  
  Object.values(votes).forEach((opt) => {
    if (options.includes(opt)) {
      tally[opt] = (tally[opt] || 0) + 1;
    }
  });
  
  if (Object.keys(tally).length === 0) return options[0];
  
  return Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
}

export function resolveDiceCheck(
  roll: number,
  difficulty: number,
  playerModifier: number = 0
): 'success' | 'fail' | 'critical_success' | 'critical_fail' {
  if (roll === 20) return 'critical_success';
  if (roll === 1) return 'critical_fail';
  if (roll + playerModifier >= difficulty) return 'success';
  return 'fail';
}

export function allPlayersVoted(
  votes: Record<string, string>,
  players: Record<string, PlayerData>
): boolean {
  const activePlayers = Object.keys(players).filter(
    (id) => players[id].status === 'active'
  );
  if (activePlayers.length === 0) return false;
  return activePlayers.every((id) => votes[id] !== undefined);
}

export function getAfkPlayers(
  actions: Record<string, any>,
  players: Record<string, PlayerData>
): string[] {
  const activePlayers = Object.keys(players).filter(
    (id) => players[id].status === 'active'
  );
  return activePlayers.filter((id) => actions[id] === undefined);
}

export function allPlayersRolled(
  dice: RoomData['dice'],
  players: Record<string, PlayerData>
): boolean {
  const activePlayers = Object.keys(players).filter(
    (id) => players[id].status === 'active'
  );
  if (activePlayers.length === 0) return false;
  return activePlayers.every((id) => dice[id] !== undefined);
}

export async function runResolverTick(
  room: RoomData,
  currentNode: GameNode
): Promise<void> {
  const { roomId, state, players, votes, dice } = room;

  // JANGAN proses jika sedang dalam transisi atau data tidak ada
  if (state.is_resolving || !currentNode) return;

  if (state.phase === 'voting') {
    const options = currentNode.options?.map((o) => o.id) ?? [];
    
    // Pastikan data votes ada dan pemain aktif sudah berpartisipasi
    if (!votes || Object.keys(votes).length === 0) return;
    
    const allVoted = allPlayersVoted(votes, players);
    if (!allVoted) return;

    await updateRoomState(roomId, { is_resolving: true });
    const winner = resolveVoting(votes, options);
    await transitionNode(roomId, winner);
  }

  if (state.phase === 'rolling') {
    // Pastikan data dadu ada
    if (!dice || Object.keys(dice).length === 0) return;
    
    if (!allPlayersRolled(dice, players)) return;

    await updateRoomState(roomId, { is_resolving: true });
    const rolls = Object.values(dice);
    const highestRoll = Math.max(...rolls.map((d) => d.value));
    const result = resolveDiceCheck(highestRoll, currentNode.difficulty ?? 15);

    const nextNode = (result === 'success' || result === 'critical_success')
      ? currentNode.on_success
      : currentNode.on_fail;

    if (nextNode) await transitionNode(roomId, nextNode);
  }
}
