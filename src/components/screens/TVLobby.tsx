import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tv, Plus, Users, Loader2, AlertCircle } from 'lucide-react';
import { useGame } from '../../hooks/useGame';
import { updateRoomState } from '../../services/firebase/database';

export default function TVLobby() {
  const { hostCreateRoom, roomId, players, isLoading, error } = useGame();
  const [started, setStarted] = useState(false);

  const playerList = Object.values(players);

  async function handleStart() {
    if (!roomId) return;
    setStarted(true);
    await updateRoomState(roomId, {
      phase: 'idle',
      current_node: 'node_001',
      is_resolving: false,
      animation_done: false
    });
    await updateRoomState(roomId.replace('/state', '') + '', {});
    // update meta status
    const { ref, update } = await import('firebase/database');
    const { db } = await import('../../services/firebase/config');
    await update(ref(db, `rooms/${roomId}/meta`), { status: 'playing' });
  }

  if (!roomId) {
    return (
      <div className="tv-mode flex flex-col items-center justify-center bg-[#0d0d0d] gap-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Tv size={64} className="text-blue-400 mx-auto mb-4" />
          <h1 className="font-serif text-5xl text-white mb-2">GM / TV Mode</h1>
          <p className="text-gray-400">Buat room baru untuk memulai sesi</p>
        </motion.div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 bg-red-900/20 px-4 py-2 rounded-lg border border-red-500/30">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => hostCreateRoom('tutorial_01')}
          disabled={isLoading}
          className="flex items-center gap-3 px-10 py-4 bg-blue-600 hover:bg-blue-500 
            disabled:opacity-50 text-white rounded-xl font-semibold text-lg transition-colors"
        >
          {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
          {isLoading ? 'Membuat Room...' : 'Buat Room Baru'}
        </motion.button>
      </div>
    );
  }

  return (
    <div className="tv-mode flex flex-col items-center justify-center bg-[#0d0d0d] gap-8 p-12">
      {/* PIN Display */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <p className="text-gray-400 text-lg mb-2 tracking-widest uppercase">Room PIN</p>
        <div className="font-serif text-8xl font-bold text-yellow-400 tracking-[0.3em]"
             style={{ textShadow: '0 0 40px rgba(255,215,0,0.6)' }}>
          {roomId}
        </div>
        <p className="text-gray-500 mt-3 text-sm">Bagikan PIN ini ke semua pemain</p>
      </motion.div>

      {/* Players */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-2xl"
      >
        <div className="flex items-center gap-2 mb-4">
          <Users size={20} className="text-gray-400" />
          <span className="text-gray-400">{playerList.length}/6 Pemain</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => {
            const player = playerList[i];
            return (
              <div
                key={i}
                className={`rounded-xl p-4 border-2 transition-all duration-500 ${
                  player
                    ? 'bg-[#1a1a1a] border-green-500/50'
                    : 'bg-[#111] border-[#222] opacity-40'
                }`}
              >
                {player ? (
                  <div>
                    <p className="text-white font-semibold truncate">{player.name}</p>
                    <p className="text-gray-400 text-sm capitalize">{player.class}</p>
                    <p className="text-green-400 text-xs mt-1">✓ Siap</p>
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">Menunggu...</p>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Start Button */}
      {playerList.length > 0 && !started && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleStart}
          className="px-14 py-5 bg-green-600 hover:bg-green-500 text-white rounded-xl 
            font-bold text-xl transition-colors shadow-[0_0_30px_rgba(34,197,94,0.4)]"
        >
          Mulai Game →
        </motion.button>
      )}
    </div>
  );
}
