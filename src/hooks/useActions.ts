import { useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { submitVote as fbSubmitVote } from '../services/firebase/database';
import { submitDiceRoll as fbSubmitDice } from '../services/firebase/database';
import { rollD20 } from '../utils/helpers';

export function useActions() {
  const store = useGameStore();

  const submitVote = useCallback(async (optionId: string) => {
    if (!store.roomId || !store.playerId) return;
    try {
      await fbSubmitVote(store.roomId, store.playerId, optionId);
    } catch (e: any) {
      store.setError(e.message);
    }
  }, [store.roomId, store.playerId]);

  const rollDice = useCallback(async () => {
    if (!store.roomId || !store.playerId) return;
    try {
      const value = rollD20();
      await fbSubmitDice(store.roomId, store.playerId, value);
      return value;
    } catch (e: any) {
      store.setError(e.message);
    }
  }, [store.roomId, store.playerId]);

  return { submitVote, rollDice };
}
