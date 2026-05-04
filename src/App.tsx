import { useEffect, useState } from 'react';
import ModeSelector from './components/screens/ModeSelector';
import TVLobby from './components/screens/TVLobby';
import PlayerJoin from './components/screens/PlayerJoin';
import TVScreen from './components/game/tv/TVScreen';
import PlayerScreen from './components/game/player/PlayerScreen';
import { useGame } from './hooks/useGame';

type Mode = 'tv' | 'player' | null;

export default function App() {
  const [mode, setMode] = useState<Mode>(null);
  const store = useGame();

  useEffect(() => {
    const saved = localStorage.getItem('chrono_mode');
    if (saved === 'tv' || saved === 'player') setMode(saved);
  }, []);

  function selectMode(m: Mode) {
    setMode(m);
    if (m) localStorage.setItem('chrono_mode', m);
  }

  if (!mode) return <ModeSelector onSelect={selectMode as any} />;

  if (mode === 'tv') {
    if (!store.roomId) return <TVLobby />;
    if (store.status !== 'playing') return <TVLobby />;
    return <TVScreen />;
  }

  if (mode === 'player') {
    if (!store.roomId || !store.playerId) return <PlayerJoin />;
    return <PlayerScreen />;
  }

  return <ModeSelector onSelect={selectMode as any} />;
}
