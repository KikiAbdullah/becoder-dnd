import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useGame } from '../../../hooks/useGame';
import { loadScenario, getNode } from '../../../services/engine/scenario';
import { runResolverTick } from '../../../services/engine/resolver';
import { Scenario, GameNode } from '../../../types/game';
import { setPhase } from '../../../services/firebase/database';

export default function TVScreen() {
  const store = useGame();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [currentNodeData, setCurrentNodeData] = useState<GameNode | null>(null);
  const [animClass, setAnimClass] = useState('');

  // Load scenario once
  useEffect(() => {
    loadScenario('/becoder-dnd/scenarios/tutorial_01.json')
      .then(setScenario)
      .catch(console.error);
  }, []);

  // Update current node when state changes
  useEffect(() => {
    if (!scenario || !store.currentNode) return;
    const node = getNode(scenario, store.currentNode);
    setCurrentNodeData(node);

    // Trigger transition animation
    setAnimClass('animate-shake');
    setTimeout(() => setAnimClass(''), 600);
  }, [store.currentNode, scenario]);

  // Run resolver tick
  useEffect(() => {
    if (!store.roomId || !currentNodeData) return;
    const room = {
      roomId: store.roomId,
      meta: { created_at: 0, status: store.status, scenario_version: '1.0' },
      state: {
        current_node: store.currentNode ?? '',
        phase: store.phase,
        is_resolving: false,
        animation_done: true
      },
      players: store.players,
      votes: store.votes,
      dice: Object.entries(store.diceResults).reduce((acc, [id, d]) => ({
        ...acc, [id]: { value: d.value, nonce: id, timestamp: d.timestamp }
      }), {})
    };
    runResolverTick(room as any, currentNodeData).catch(console.error);
  }, [store.votes, store.diceResults]);

  // Auto-advance narrative nodes
  useEffect(() => {
    if (!currentNodeData || currentNodeData.type !== 'narrative') return;
    if (!currentNodeData.auto_advance || !currentNodeData.next || !store.roomId) return;
    const timer = setTimeout(() => {
      setPhase(store.roomId!, 'idle');
    }, currentNodeData.auto_advance);
    return () => clearTimeout(timer);
  }, [currentNodeData]);

  const playerList = Object.values(store.players);
  const voteCount = Object.keys(store.votes).length;
  const playerCount = playerList.filter(p => p.status === 'active').length;

  return (
    <div className={`tv-mode relative flex flex-col bg-[#0d0d0d] ${animClass}`}>
      {/* Background Image */}
      <AnimatePresence mode="wait">
        {currentNodeData?.image && (
          <motion.div
            key={currentNodeData.image}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 z-0"
          >
            <img
              src={`/becoder-dnd/images/backgrounds/${currentNodeData.image}`}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/80" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player HUD - Top */}
      <div className="relative z-10 flex gap-3 p-5">
        {playerList.map((player) => (
          <motion.div
            key={player.playerId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 bg-black/60 backdrop-blur-sm 
              rounded-xl px-4 py-2 border border-white/10"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
              ${player.class === 'warrior' ? 'bg-red-700' :
                player.class === 'mage' ? 'bg-blue-700' :
                player.class === 'rogue' ? 'bg-gray-600' : 'bg-yellow-600'}`}>
              {player.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-none">{player.name}</p>
              <p className="text-gray-400 text-xs capitalize">{player.class}</p>
            </div>
            <div className="flex items-center gap-1 ml-1">
              <Heart size={12} className="text-red-400" />
              <span className="text-red-300 text-xs">{player.hp}/{player.maxHp}</span>
            </div>
            {store.votes[player.playerId] && (
              <span className="w-2 h-2 bg-green-400 rounded-full" title="Sudah vote" />
            )}
          </motion.div>
        ))}
      </div>

      {/* Main Content - Center */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-20">
        <AnimatePresence mode="wait">
          {currentNodeData && (
            <motion.div
              key={currentNodeData.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="w-full max-w-4xl text-center"
            >
              {/* Phase Badge */}
              <div className="flex justify-center mb-6">
                <PhaseBadge phase={store.phase} />
              </div>

              {/* Node Text */}
              <p className="font-serif text-3xl md:text-4xl text-white leading-relaxed 
                drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                {currentNodeData.text}
              </p>

              {/* Voting Options */}
              {currentNodeData.type === 'voting' && currentNodeData.options && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-10 flex flex-wrap justify-center gap-4"
                >
                  {currentNodeData.options.map((opt) => {
                    const votes = Object.values(store.votes).filter(v => v === opt.id).length;
                    return (
                      <div
                        key={opt.id}
                        className="bg-black/70 backdrop-blur-sm border border-white/20 
                          rounded-xl px-8 py-4 min-w-[180px]"
                      >
                        <p className="text-white font-semibold text-lg">{opt.text}</p>
                        <p className="text-yellow-400 text-sm mt-1">
                          {votes} vote{votes !== 1 ? 's' : ''}
                        </p>
                      </div>
                    );
                  })}
                </motion.div>
              )}

              {/* Dice Check Info */}
              {currentNodeData.type === 'dice_check' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-8 flex justify-center gap-6"
                >
                  <div className="text-center bg-black/60 rounded-xl px-8 py-4 border border-yellow-500/30">
                    <p className="text-yellow-400 text-sm uppercase tracking-widest">Target DC</p>
                    <p className="text-yellow-300 font-serif text-5xl font-bold">
                      {currentNodeData.difficulty ?? 15}
                    </p>
                  </div>
                  <div className="text-center bg-black/60 rounded-xl px-8 py-4 border border-blue-500/30">
                    <p className="text-blue-400 text-sm uppercase tracking-widest">Dadu</p>
                    <p className="text-blue-300 font-serif text-5xl font-bold">D20</p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {!currentNodeData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 border-4 border-yellow-400/30 border-t-yellow-400 
                rounded-full animate-spin mx-auto mb-6" />
              <p className="text-gray-400 text-xl">Memuat skenario...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status Bar - Bottom */}
      <div className="relative z-10 flex items-center justify-between px-8 py-4 
        bg-black/60 backdrop-blur-sm border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${store.isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-gray-400 text-sm">
            {store.isConnected ? 'Terhubung' : 'Menghubungkan...'}
          </span>
        </div>
        <div className="text-gray-400 text-sm">
          Room: <span className="text-yellow-400 font-bold">{store.roomId}</span>
        </div>
        <div className="text-gray-400 text-sm">
          Votes: <span className="text-green-400 font-bold">{voteCount}/{playerCount}</span>
        </div>
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
  return (
    <span className={`px-5 py-2 rounded-full text-sm font-semibold uppercase tracking-widest ${info.color}`}>
      {info.label}
    </span>
  );
}
