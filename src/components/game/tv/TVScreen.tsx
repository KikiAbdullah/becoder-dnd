import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Timer, ChevronRight, RotateCcw, FastForward } from 'lucide-react';
import { useGame } from '../../../hooks/useGame';
import { loadScenario, getNode } from '../../../services/engine/scenario';
import { runResolverTick } from '../../../services/engine/resolver';
import { Scenario, GameNode } from '../../../types/game';
import { transitionNode, setPhase, updatePlayerStatus, updateRoomState } from '../../../services/firebase/database';

export default function TVScreen() {
  const store = useGame();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [currentNodeData, setCurrentNodeData] = useState<GameNode | null>(null);
  const [animClass, setAnimClass] = useState('');
  const [narrativeTime, setNarrativeTime] = useState<number | null>(null);
  const [afkTime, setAfkTime] = useState<number | null>(null);
  const [afkNotification, setAfkNotification] = useState<string | null>(null);

  useEffect(() => {
    const path = `/becoder-dnd/scenarios/${store.scenario_version || 'valdris/chapter_01_escape'}.json`;
    loadScenario(path).then(setScenario).catch(console.error);
  }, [store.scenario_version]);

  useEffect(() => {
    if (!scenario || !store.currentNode || !store.roomId) return;
    const node = getNode(scenario, store.currentNode);
    setCurrentNodeData(node);

    if (node?.type === 'voting' && store.phase !== 'voting') setPhase(store.roomId, 'voting').catch(console.error);
    if (node?.type === 'dice_check' && store.phase !== 'rolling') setPhase(store.roomId, 'rolling').catch(console.error);
    if ((node?.type === 'narrative' || node?.type === 'effect') && store.phase !== 'idle') setPhase(store.roomId, 'idle').catch(console.error);

    if (node?.type === 'narrative' && node.auto_advance && node.next && (!node.options || node.options.length === 0)) {
      setNarrativeTime(Math.ceil(node.auto_advance / 1000));
    } else {
      setNarrativeTime(null);
    }

    if (node?.type === 'voting') setAfkTime(30);
    else if (node?.type === 'dice_check') setAfkTime(20);
    else setAfkTime(null);

    setAnimClass('animate-shake');
    setTimeout(() => setAnimClass(''), 400);
  }, [scenario, store.currentNode, store.roomId, store.phase]);

  useEffect(() => {
    if (narrativeTime === null || narrativeTime <= 0) return;
    const timer = setInterval(() => {
      setNarrativeTime((prev) => (prev === null ? null : Math.max(0, prev - 1)));
    }, 1000);
    return () => clearInterval(timer);
  }, [narrativeTime]);

  useEffect(() => {
    if (narrativeTime !== 0) return;
    if (!currentNodeData?.next || !store.roomId || store.phase !== 'idle') return;
    transitionNode(store.roomId, currentNodeData.next).catch(console.error);
  }, [narrativeTime, currentNodeData, store.roomId, store.phase]);

  useEffect(() => {
    if (afkTime === null || afkTime <= 0) return;
    const timer = setInterval(() => {
      setAfkTime((prev) => (prev === null ? null : Math.max(0, prev - 1)));
    }, 1000);
    return () => clearInterval(timer);
  }, [afkTime]);

  useEffect(() => {
    if (afkTime !== 0) return;
    handleTimeoutAFK().catch(console.error);
  }, [afkTime, store.players, store.votes, store.diceResults, store.phase]);

  useEffect(() => {
    if (!store.roomId || !currentNodeData) return;
    const room = {
      roomId: store.roomId,
      meta: { created_at: 0, status: store.status, scenario_version: store.scenario_version || '' },
      state: { current_node: store.currentNode ?? '', phase: store.phase, is_resolving: false, animation_done: true },
      players: store.players,
      votes: store.votes,
      dice: Object.entries(store.diceResults).reduce((acc, [id, d]) => ({ ...acc, [id]: { value: (d as any).value, nonce: id, timestamp: (d as any).timestamp } }), {})
    };
    runResolverTick(room as any, currentNodeData).catch(console.error);
  }, [store.roomId, store.players, store.votes, store.diceResults, currentNodeData]);

  async function handleTimeoutAFK() {
    if (!store.roomId) return;
    const activePlayers = Object.values(store.players).filter((p) => p.status === 'active');
    let afkPlayers: string[] = [];

    if (store.phase === 'voting') afkPlayers = activePlayers.filter((p) => !store.votes[p.playerId]).map((p) => p.playerId);
    if (store.phase === 'rolling') afkPlayers = activePlayers.filter((p) => !store.diceResults[p.playerId]).map((p) => p.playerId);

    if (afkPlayers.length === 0) return;

    if (activePlayers.length === 1) {
      setAfkNotification('Hanya 1 petualang tersisa. Menunggu aksinya...');
      setTimeout(() => setAfkNotification(null), 4000);
      setAfkTime(20);
      return;
    }

    for (const pid of afkPlayers) await updatePlayerStatus(store.roomId, pid, 'afk');
    setAfkNotification(`${afkPlayers.length} petualang AFK dikeluarkan dari fase ini.`);
    setTimeout(() => setAfkNotification(null), 4000);
  }

  async function handleManualAdvance() {
    if (!store.roomId || !currentNodeData?.next) return;
    await transitionNode(store.roomId, currentNodeData.next);
  }

  async function handleResetGame() {
    if (!store.roomId) return;
    if (!confirm('Reset game ke awal chapter ini?')) return;
    await transitionNode(store.roomId, 'node_001_intro');
  }

  async function handleNextChapter() {
    if (!store.roomId) return;
    let nextChapter = '';
    if (store.scenario_version === 'valdris/chapter_01_escape') nextChapter = 'valdris/chapter_02_shadows';
    if (store.scenario_version === 'valdris/chapter_02_shadows') nextChapter = 'valdris/chapter_03_true_hand';
    if (!nextChapter) return;

    const { ref, update } = await import('firebase/database');
    const { db } = await import('../../../services/firebase/config');

    await update(ref(db, `rooms/${store.roomId}/meta`), { scenario_version: nextChapter, status: 'playing' });
    await updateRoomState(store.roomId, {
      current_node: 'node_001_intro',
      phase: 'idle',
      is_resolving: false,
      animation_done: false
    });
  }

  const playerList = Object.values(store.players);
  const voteCount = Object.keys(store.votes).length;
  const playerCount = playerList.filter((p) => p.status === 'active').length;
  const noPlayers = playerCount === 0;
  const canNextChapter = currentNodeData?.type === 'effect' && (store.scenario_version === 'valdris/chapter_01_escape' || store.scenario_version === 'valdris/chapter_02_shadows');

  return (
    <div className={`tv-mode relative flex flex-col bg-[#0d0d0d] ${animClass}`}>
      <AnimatePresence mode="wait">
        {currentNodeData?.image && (
          <motion.div key={currentNodeData.image} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-0">
            <img src={`/becoder-dnd/images/backgrounds/${currentNodeData.image}`} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/80" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col gap-3 p-5">
        <AnimatePresence>
          {afkNotification && <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-2 rounded-full font-bold z-50">{afkNotification}</motion.div>}
        </AnimatePresence>

        <div className="flex gap-3">
          {playerList.map((player) => (
            <motion.div key={player.playerId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={`flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2 border ${player.status === 'afk' ? 'border-red-500/50 opacity-50 grayscale' : 'border-white/10'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${player.class === 'warrior' ? 'bg-red-700' : player.class === 'mage' ? 'bg-blue-700' : player.class === 'rogue' ? 'bg-gray-600' : 'bg-yellow-600'}`}>{player.name.slice(0, 2).toUpperCase()}</div>
              <div><p className="text-white text-sm font-semibold leading-none">{player.name}</p><p className="text-gray-400 text-xs capitalize">{player.class}</p></div>
              <div className="flex items-center gap-1 ml-1"><Heart size={12} className="text-red-400" /><span className="text-red-300 text-xs">{player.hp}/{player.maxHp}</span></div>
              {store.votes[player.playerId] && <span className="w-2 h-2 bg-green-400 rounded-full" />}
              {player.status === 'afk' && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-20">
        {noPlayers && <div className="mb-6 px-6 py-4 rounded-xl bg-red-900/40 border border-red-500/50"><p className="text-red-300 font-serif text-xl">Perjalanan belum dimulai — para petualang belum berkumpul.</p></div>}

        <AnimatePresence mode="wait">
          {currentNodeData ? (
            <motion.div key={currentNodeData.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full max-w-4xl text-center">
              <div className="flex justify-center mb-6"><PhaseBadge phase={store.phase} /></div>
              <p className="font-serif text-3xl md:text-4xl text-white leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{currentNodeData.text}</p>

              {currentNodeData.type === 'voting' && currentNodeData.options && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-10 flex flex-wrap justify-center gap-4">
                  {currentNodeData.options.map((opt) => {
                    const votes = Object.values(store.votes).filter((v) => v === opt.id).length;
                    return <div key={opt.id} className="bg-black/70 border border-white/20 rounded-xl px-8 py-4 min-w-[180px]"><p className="text-white font-semibold text-lg">{opt.text}</p><p className="text-yellow-400 text-sm mt-1">{votes} vote{votes !== 1 ? 's' : ''}</p></div>;
                  })}
                </motion.div>
              )}

              {currentNodeData.type === 'dice_check' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 flex justify-center gap-6">
                  <div className="text-center bg-black/60 rounded-xl px-8 py-4 border border-blue-500/30">
                    <p className="text-blue-400 text-sm uppercase tracking-widest font-bold">Uji Kemampuan</p>
                    <p className="text-blue-300 font-serif text-5xl font-bold">D20</p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center"><div className="w-16 h-16 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin mx-auto mb-6" /><p className="text-gray-400 text-xl">Memuat skenario...</p></motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative z-10 flex items-center justify-between px-8 py-4 bg-black/60 border-t border-white/10">
        <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${store.isConnected ? 'bg-green-400' : 'bg-red-400'}`} /><span className="text-gray-400 text-sm">{store.isConnected ? 'Terhubung' : 'Menghubungkan...'}</span></div>
        <div className="text-gray-400 text-sm">Room: <span className="text-yellow-400 font-bold">{store.roomId}</span></div>
        <div className="text-gray-400 text-sm">Votes: <span className="text-green-400 font-bold">{voteCount}/{playerCount}</span></div>

        {afkTime !== null && (store.phase === 'voting' || store.phase === 'rolling') && <div className="ml-4 flex items-center gap-2 text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-full border border-yellow-400/20"><Timer size={14} /><span className="text-xs font-bold font-mono">{afkTime}s</span></div>}

        <button onClick={handleResetGame} className="ml-4 flex items-center gap-2 px-3 py-1 bg-red-700 hover:bg-red-600 text-white text-xs font-bold rounded-full"><RotateCcw size={12} /> Reset Chapter</button>

        {canNextChapter && <button onClick={handleNextChapter} className="ml-4 flex items-center gap-2 px-4 py-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-full">Lanjut Chapter Berikutnya <FastForward size={14} /></button>}

        {currentNodeData?.type === 'narrative' && (!currentNodeData.options || currentNodeData.options.length === 0) && (
          <div className="flex items-center gap-4 ml-6">
            {narrativeTime !== null && <div className="flex items-center gap-2 text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-full border border-yellow-400/20"><Timer size={14} /><span className="text-xs font-bold font-mono">{narrativeTime}s</span></div>}
            <button onClick={handleManualAdvance} disabled={noPlayers} className="flex items-center gap-2 px-4 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-400 text-white text-xs font-bold rounded-full">Lanjut <ChevronRight size={14} /></button>
          </div>
        )}
      </div>
    </div>
  );
}

function PhaseBadge({ phase }: { phase: string }) {
  const map: Record<string, { label: string; color: string }> = {
    idle: { label: 'Narasi', color: 'bg-gray-700 text-gray-300' },
    voting: { label: '⚔ Pilih Aksi', color: 'bg-blue-700 text-blue-200' },
    rolling: { label: '🎲 Lempar Dadu', color: 'bg-red-700 text-red-200' },
    resolving: { label: '⏳ Memproses...', color: 'bg-yellow-700 text-yellow-200' },
    animating: { label: '✨ Animasi', color: 'bg-purple-700 text-purple-200' }
  };
  const info = map[phase] ?? map.idle;
  return <span className={`px-5 py-2 rounded-full text-sm font-semibold uppercase tracking-widest ${info.color}`}>{info.label}</span>;
}
