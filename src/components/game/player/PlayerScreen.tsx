import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, CheckCircle2, Heart, Shield, LogOut, Zap } from 'lucide-react';
import { useGame } from '../../../hooks/useGame';
import { useActions } from '../../../hooks/useActions';
import { loadScenario, getNode } from '../../../services/engine/scenario';
import { Scenario, GameNode } from '../../../types/game';
import { rollD20 } from '../../../utils/helpers';
import { submitDiceRoll } from '../../../services/firebase/database';

function StatBox({ label, value, mod }: { label: string; value: number; mod: number }) {
  return (
    <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-2 text-center">
      <p className="text-[9px] text-gray-500 font-bold uppercase">{label}</p>
      <p className="text-lg font-serif font-bold text-white leading-none my-1">{value}</p>
      <p className={`text-[10px] font-bold ${mod >= 0 ? 'text-green-500' : 'text-red-500'}`}>
        {mod >= 0 ? `+${mod}` : mod}
      </p>
    </div>
  );
}

export default function PlayerScreen() {
  const store = useGame();
  const { submitVote } = useActions();

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [currentNode, setCurrentNode] = useState<GameNode | null>(null);

  const [hasVoted, setHasVoted] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [diceAnim, setDiceAnim] = useState(false);

  const myData = store.playerId ? store.players[store.playerId] : null;

  const handleLogout = () => {
    if (confirm('Keluar dari permainan?')) {
      sessionStorage.removeItem('player_session');
      store.reset();
      window.location.reload();
    }
  };

  useEffect(() => {
    // Membaca path scenario dari store/firebase atau fallback ke valdris chapter 1
    // (Karena `store.scenario_version` belum diexpose di GameStore, fallback dulu. Nanti saya lengkapi).
    loadScenario('/becoder-dnd/scenarios/valdris/chapter_01_escape.json')
      .then(setScenario)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!scenario || !store.currentNode) return;
    setCurrentNode(getNode(scenario, store.currentNode));
    setHasVoted(false);
    setHasRolled(false);
    setDiceValue(null);
  }, [store.currentNode, scenario]);

  async function handleVote(optionId: string) {
    if (hasVoted) return;
    await submitVote(optionId);
    setHasVoted(true);
  }

  async function handleRoll() {
    if (hasRolled || isRolling || !store.roomId || !store.playerId) return;
    setIsRolling(true);
    setDiceAnim(true);

    let ticks = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 20) + 1);
      if (++ticks >= 12) {
        clearInterval(interval);
        const final = rollD20();
        setDiceValue(final);
        submitDiceRoll(store.roomId!, store.playerId!, final);
        setHasRolled(true);
        setIsRolling(false);
      }
    }, 80);

    setTimeout(() => setDiceAnim(false), 1100);
  }

  if (store.status === 'waiting') {
    return (
      <div className="player-mode flex flex-col items-center justify-center min-h-screen bg-[#0d0d0d] gap-4 p-8">
        <div className="w-10 h-10 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
        <p className="text-gray-400 text-lg">Menunggu GM memulai game...</p>
        <p className="text-gray-600 text-sm">Room: <span className="text-yellow-400">{store.roomId}</span></p>
        <button onClick={handleLogout} className="mt-4 text-gray-500 flex items-center gap-2 underline text-sm">
          <LogOut size={16} /> Keluar / Ganti PIN
        </button>
      </div>
    );
  }

  return (
    <div className="player-mode bg-[#0d0d0d] flex flex-col min-h-screen">
      <div className="bg-[#111] border-b border-[#2a2a2a] px-5 py-4 flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg"
          style={{
            background:
              myData?.class === 'warrior' ? '#c41e3a' :
              myData?.class === 'mage' ? '#4169e1' :
              myData?.class === 'rogue' ? '#2f4f4f' : '#b8860b'
          }}
        >
          {myData?.name.slice(0, 2).toUpperCase() || '??'}
        </div>
        <div className="flex-1">
          <p className="text-white font-bold">{myData?.name || 'Loading...'}</p>
          <p className="text-gray-400 text-sm capitalize">{myData?.class || '...'}</p>
        </div>
        <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-400 transition-colors">
          <LogOut size={20} />
        </button>
      </div>

      {myData && (
        <div className="px-5 py-4">
          <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-[#2a2a2a] shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-serif font-bold text-white">{myData.name}</h2>
                <p className="text-yellow-500 text-xs uppercase tracking-widest font-bold">{myData.class}</p>
              </div>
              <div className="bg-red-950/30 px-3 py-1 rounded-full border border-red-500/30 flex items-center gap-2">
                <Heart size={14} className="text-red-500 fill-red-500" />
                <span className="text-red-100 font-bold">{myData.hp}/{myData.maxHp}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <StatBox label="STR" value={myData.abilityScores.strength} mod={myData.modifiers.str_mod} />
              <StatBox label="DEX" value={myData.abilityScores.dexterity} mod={myData.modifiers.dex_mod} />
              <StatBox label="CON" value={myData.abilityScores.constitution} mod={myData.modifiers.con_mod} />
              <StatBox label="INT" value={myData.abilityScores.intelligence} mod={myData.modifiers.int_mod} />
              <StatBox label="WIS" value={myData.abilityScores.wisdom} mod={myData.modifiers.wis_mod} />
              <StatBox label="CHA" value={myData.abilityScores.charisma} mod={myData.modifiers.cha_mod} />
            </div>

            <div className="mt-4 pt-4 border-t border-[#2a2a2a] flex justify-between">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-gray-500 uppercase">Armor Class</span>
                <div className="flex items-center gap-1 text-blue-400">
                  <Shield size={16} />
                  <span className="font-bold text-lg">{myData.ac}</span>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-gray-500 uppercase">Proficiency</span>
                <div className="flex items-center gap-1 text-green-400">
                  <CheckCircle2 size={16} />
                  <span className="font-bold text-lg">+2</span>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-gray-500 uppercase">Speed</span>
                <div className="flex items-center gap-1 text-yellow-500">
                  <Zap size={16} />
                  <span className="font-bold text-lg">30ft</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-t from-black to-transparent">
        <AnimatePresence mode="wait">
          {currentNode?.id === 'node_010_end' && (
            <motion.div
              key="end"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-sm bg-[#111] border border-yellow-500/30 rounded-2xl p-6 text-center"
            >
              <p className="text-yellow-400 text-xs uppercase tracking-[0.2em] mb-2">Game Selesai</p>
              <h3 className="text-white font-serif text-2xl mb-3">Chapter End</h3>
              <p className="text-gray-400 text-sm mb-6">Terima kasih sudah bermain.</p>
              <button
                onClick={handleLogout}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold"
              >
                Keluar dari Room
              </button>
            </motion.div>
          )}

          {currentNode?.id !== 'node_010_end' && store.phase === 'voting' && currentNode?.options && (
            <motion.div
              key="voting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-sm flex flex-col gap-3"
            >
              <div className="text-center mb-4">
                <div className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full border border-blue-500/30 mb-2">
                  Voting
                </div>
                <h3 className="text-white text-lg font-medium">Pilih langkah selanjutnya</h3>
              </div>

              {hasVoted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-3 py-8 bg-[#111] rounded-2xl border border-green-500/20"
                >
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
                    <CheckCircle2 size={32} className="text-green-500" />
                  </div>
                  <p className="text-green-400 font-bold text-lg tracking-wide">VOTE TERKIRIM</p>
                  <p className="text-gray-500 text-xs italic">Menunggu pemain lain...</p>
                </motion.div>
              ) : (
                currentNode.options.map((opt, i) => (
                  <motion.button
                    key={opt.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleVote(opt.id)}
                    className="w-full py-4 px-5 bg-[#111] border border-[#333] hover:border-blue-500/50 rounded-xl text-white font-semibold text-base text-left transition-all flex items-center gap-4 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#222] group-hover:bg-blue-600 flex items-center justify-center text-xs font-bold text-gray-400 group-hover:text-white transition-colors">
                      {String.fromCharCode(65 + i)}
                    </div>
                    <span className="flex-1">{opt.text}</span>
                  </motion.button>
                ))
              )}
            </motion.div>
          )}

          {store.phase === 'rolling' && (
            <motion.div
              key="rolling"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-sm flex flex-col items-center gap-8"
            >
              <div className="text-center">
                <div className="inline-block px-3 py-1 bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full border border-red-500/30 mb-2">
                  Dice Roll
                </div>
                {currentNode?.difficulty && (
                  <p className="text-yellow-400 text-sm">Target DC: <strong>{currentNode.difficulty}</strong></p>
                )}
              </div>

              <motion.div
                animate={diceAnim ? { rotate: [0, 360, 720], scale: [1, 1.4, 1] } : {}}
                transition={{ duration: 0.9 }}
                className="w-32 h-32 bg-[#111] border-4 border-yellow-400/40 rounded-2xl flex items-center justify-center cursor-pointer select-none"
                onClick={!hasRolled ? handleRoll : undefined}
              >
                {diceValue !== null ? (
                  <span className={`font-serif font-bold text-5xl ${diceValue === 20 ? 'text-yellow-300 animate-glow-gold' : diceValue === 1 ? 'text-red-400' : 'text-white'}`}>
                    {diceValue}
                  </span>
                ) : (
                  <Sword size={40} className="text-yellow-400/60" />
                )}
              </motion.div>

              {hasRolled ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                  {diceValue === 20 && <p className="text-yellow-400 font-bold text-lg animate-glow-gold">CRITICAL SUCCESS!</p>}
                  {diceValue === 1 && <p className="text-red-400 font-bold text-lg">CRITICAL FAIL!</p>}
                  {diceValue !== null && diceValue !== 20 && diceValue !== 1 && (
                    <p className="text-gray-300">Menunggu resolver...</p>
                  )}
                </motion.div>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleRoll}
                  disabled={isRolling}
                  className="px-10 py-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl font-bold text-lg transition-colors shadow-[0_0_20px_rgba(196,30,58,0.5)]"
                >
                  {isRolling ? 'Rolling...' : '🎲 Lempar D20'}
                </motion.button>
              )}
            </motion.div>
          )}

          {(store.phase === 'idle' || store.phase === 'animating' || store.phase === 'resolving') && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-yellow-400/20 border-t-yellow-400/60 rounded-full animate-spin" />
              <p className="text-gray-400">{store.phase === 'resolving' ? 'Memproses hasil...' : 'Menunggu...'}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-5 py-3 border-t border-[#2a2a2a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${store.isConnected ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`} />
          <span className="text-gray-600 text-xs">{store.isConnected ? 'Online' : 'Reconnecting...'}</span>
        </div>
        <span className="text-gray-700 text-xs">Room {store.roomId}</span>
      </div>
    </div>
  );
}
