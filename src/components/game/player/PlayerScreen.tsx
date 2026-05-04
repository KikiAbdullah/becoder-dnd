import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, CheckCircle2, Heart, Shield } from 'lucide-react';
import { useGame } from '../../../hooks/useGame';
import { useActions } from '../../../hooks/useActions';
import { loadScenario, getNode } from '../../../services/engine/scenario';
import { Scenario, GameNode } from '../../../types/game';
import { rollD20 } from '../../../utils/helpers';
import { submitDiceRoll } from '../../../services/firebase/database';

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

  useEffect(() => {
    loadScenario('/becoder-dnd/scenarios/tutorial_01.json')
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

    // Visual suspense
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
      </div>
    );
  }

  return (
    <div className="player-mode bg-[#0d0d0d] flex flex-col min-h-screen">
      {/* Character Header */}
      {myData && (
        <div className="bg-[#111] border-b border-[#2a2a2a] px-5 py-4 flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg"
            style={{
              background:
                myData.class === 'warrior' ? '#c41e3a' :
                myData.class === 'mage' ? '#4169e1' :
                myData.class === 'rogue' ? '#2f4f4f' : '#b8860b'
            }}
          >
            {myData.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-white font-bold">{myData.name}</p>
            <p className="text-gray-400 text-sm capitalize">{myData.class}</p>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Heart size={14} className="text-red-400" />
              <span className="text-red-300">{myData.hp}/{myData.maxHp}</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield size={14} className="text-blue-400" />
              <span className="text-blue-300">{myData.ac}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        <AnimatePresence mode="wait">
          {/* VOTING PHASE */}
          {store.phase === 'voting' && currentNode?.options && (
            <motion.div
              key="voting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-sm flex flex-col gap-4"
            >
              <div className="text-center mb-2">
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Pilih Aksimu</p>
                <p className="text-white font-serif text-xl leading-relaxed">{currentNode.text}</p>
              </div>

              {hasVoted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-3 py-8"
                >
                  <CheckCircle2 size={48} className="text-green-400" />
                  <p className="text-green-300 font-semibold">Vote Terkirim!</p>
                  <p className="text-gray-500 text-sm">Menunggu pemain lain...</p>
                </motion.div>
              ) : (
                currentNode.options.map((opt, i) => (
                  <motion.button
                    key={opt.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleVote(opt.id)}
                    className="w-full py-5 px-6 bg-[#111] border-2 border-[#2a2a2a] 
                      hover:border-blue-500 hover:bg-blue-900/20 rounded-xl text-white 
                      font-semibold text-lg text-left transition-all flex items-center gap-3"
                  >
                    <span className="w-8 h-8 rounded-full bg-blue-600 flex items-center 
                      justify-center text-sm font-bold shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt.text}
                  </motion.button>
                ))
              )}
            </motion.div>
          )}

          {/* ROLLING PHASE */}
          {store.phase === 'rolling' && (
            <motion.div
              key="rolling"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-sm flex flex-col items-center gap-8"
            >
              <div className="text-center">
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Dice Check</p>
                <p className="text-white font-serif text-xl">{currentNode?.text}</p>
                {currentNode?.difficulty && (
                  <p className="text-yellow-400 text-sm mt-2">Target DC: <strong>{currentNode.difficulty}</strong></p>
                )}
              </div>

              {/* Dice Display */}
              <motion.div
                animate={diceAnim ? { rotate: [0, 360, 720], scale: [1, 1.4, 1] } : {}}
                transition={{ duration: 0.9 }}
                className="w-32 h-32 bg-[#111] border-4 border-yellow-400/40 rounded-2xl 
                  flex items-center justify-center cursor-pointer select-none"
                onClick={!hasRolled ? handleRoll : undefined}
              >
                {diceValue !== null ? (
                  <span className={`font-serif font-bold text-5xl ${
                    diceValue === 20 ? 'text-yellow-300 animate-glow-gold' :
                    diceValue === 1 ? 'text-red-400' : 'text-white'
                  }`}>
                    {diceValue}
                  </span>
                ) : (
                  <Sword size={40} className="text-yellow-400/60" />
                )}
              </motion.div>

              {hasRolled ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
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
                  className="px-10 py-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 
                    text-white rounded-xl font-bold text-lg transition-colors
                    shadow-[0_0_20px_rgba(196,30,58,0.5)]"
                >
                  {isRolling ? 'Rolling...' : '🎲 Lempar D20'}
                </motion.button>
              )}
            </motion.div>
          )}

          {/* IDLE / NARRATIVE */}
          {(store.phase === 'idle' || store.phase === 'animating' || store.phase === 'resolving') && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center flex flex-col items-center gap-4"
            >
              <div className="w-12 h-12 border-4 border-yellow-400/20 border-t-yellow-400/60 
                rounded-full animate-spin" />
              <p className="text-gray-400">
                {store.phase === 'resolving' ? 'Memproses hasil...' : 'Menunggu GM...'}
              </p>
              {currentNode?.text && (
                <p className="text-gray-500 text-sm max-w-xs text-center leading-relaxed mt-2">
                  {currentNode.text}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Connection Status */}
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
