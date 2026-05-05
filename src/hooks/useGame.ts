import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { signInAsAnonymous } from '../services/firebase/auth';
import { 
  createRoom, 
  getRoomData, 
  addPlayerToRoom, 
  subscribeToRoom 
} from '../services/firebase/database';
import { buildPlayerData } from '../services/game/character';
import { generatePlayerId } from '../utils/helpers';
import { CharacterId } from '../types/game';

export function useGame() {
  const store = useGameStore();
  const [sessionChecked, setSessionChecked] = useState(false);

  // On mount: check for existing session
  useEffect(() => {
    const raw = sessionStorage.getItem('player_session');
    if (raw) {
      try {
        const { roomId, playerId } = JSON.parse(raw);
        store.setRoomInfo(roomId, roomId, 'playing');
        store.setLocalPlayer(playerId, '', '');
      } catch {
        sessionStorage.removeItem('player_session');
      }
    }
    setSessionChecked(true);
  }, []);

  // Subscribe to room updates
  useEffect(() => {
    if (!store.roomId) return;

    store.setConnected(false);
    const unsub = subscribeToRoom(store.roomId, (data) => {
      store.updateFromFirebase(data);
      store.setConnected(true);
    });

    return unsub;
  }, [store.roomId]);

  const hostCreateRoom = useCallback(async (scenarioId: string = 'chapter_01_escape') => {
    store.setLoading(true);
    store.setError(null);
    try {
      await signInAsAnonymous();
      const roomId = await createRoom(scenarioId);
      store.setRoomInfo(roomId, roomId, 'waiting');
      store.setLocalPlayer('host', 'Host', 'host');
    } catch (e: any) {
      store.setError(e.message || 'Gagal membuat room');
    } finally {
      store.setLoading(false);
    }
  }, []);

  const playerJoinRoom = useCallback(async (
    pin: string,
    name: string,
    classId: CharacterId
  ) => {
    store.setLoading(true);
    store.setError(null);
    try {
      const user = await signInAsAnonymous();
      const roomData = await getRoomData(pin);
      if (!roomData) throw new Error('Room tidak ditemukan');
      if (roomData.meta.status === 'ended') throw new Error('Game sudah berakhir');

      const activePlayers = Object.keys(roomData.players || {});
      if (activePlayers.length >= 6) throw new Error('Room sudah penuh (maks 6 pemain)');

      const playerId = user.uid || generatePlayerId();
      const playerData = buildPlayerData(playerId, name, classId);

      await addPlayerToRoom(pin, playerId, playerData);
      store.setRoomInfo(pin, pin, roomData.meta.status);
      store.setLocalPlayer(playerId, name, classId);
    } catch (e: any) {
      store.setError(e.message || 'Gagal join room');
    } finally {
      store.setLoading(false);
    }
  }, []);

  return {
    ...store,
    sessionChecked,
    hostCreateRoom,
    playerJoinRoom
  };
}
