import { useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, AlertCircle, Loader2 } from 'lucide-react';
import { useGame } from '../../hooks/useGame';
import { CharacterId } from '../../types/game';
import { getAllCharacters } from '../../services/game/character';

export default function PlayerJoin() {
  const { playerJoinRoom, isLoading, error } = useGame();
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState<CharacterId | null>(null);
  const characters = getAllCharacters();

  const canJoin = pin.length === 4 && name.trim().length >= 2 && selectedClass;

  async function handleJoin() {
    if (!canJoin) return;
    await playerJoinRoom(pin, name.trim(), selectedClass!);
  }

  return (
    <div className="player-mode bg-[#0d0d0d] flex flex-col items-center px-5 py-8 gap-7 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <Smartphone size={32} className="text-red-400 mx-auto mb-2" />
        <h1 className="font-serif text-3xl text-white">Bergabung ke Sesi</h1>
        <p className="text-gray-500 text-sm">Masukkan PIN dari GM</p>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-red-400 bg-red-900/20 
            px-4 py-3 rounded-lg border border-red-500/30 w-full max-w-sm text-sm"
        >
          <AlertCircle size={16} />
          {error}
        </motion.div>
      )}

      <div className="w-full max-w-sm flex flex-col gap-5">
        {/* PIN */}
        <div>
          <label className="text-gray-400 text-xs uppercase tracking-widest mb-2 block">Room PIN</label>
          <input
            type="number"
            maxLength={4}
            placeholder="0000"
            value={pin}
            onChange={e => setPin(e.target.value.slice(0, 4))}
            className="w-full bg-[#111] border-2 border-[#2a2a2a] focus:border-yellow-500/60
              rounded-xl px-5 py-4 text-white text-center text-3xl font-bold tracking-[0.5em]
              outline-none transition-colors"
          />
        </div>

        {/* Name */}
        <div>
          <label className="text-gray-400 text-xs uppercase tracking-widest mb-2 block">Nama Karakter</label>
          <input
            type="text"
            placeholder="Masukkan nama..."
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-[#111] border-2 border-[#2a2a2a] focus:border-yellow-500/60
              rounded-xl px-5 py-4 text-white outline-none transition-colors"
          />
        </div>

        {/* Class Selection */}
        <div>
          <label className="text-gray-400 text-xs uppercase tracking-widest mb-3 block">Pilih Class</label>
          <div className="grid grid-cols-2 gap-3">
            {characters.map((char) => (
              <motion.button
                key={char.class_id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedClass(char.class_id as CharacterId)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                  ${selectedClass === char.class_id
                    ? 'border-yellow-400 bg-yellow-400/10'
                    : 'border-[#2a2a2a] bg-[#111] hover:border-[#444]'
                  }`}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: char.color }}
                >
                  {char.class_name.slice(0, 2)}
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold text-sm">{char.class_name}</p>
                  <p className="text-gray-500 text-xs">HP {char.base_stats.hp} · AC {char.base_stats.armor_class}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Class Description */}
        {selectedClass && (
          <motion.div
            key={selectedClass}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-[#111] border border-[#2a2a2a] rounded-xl p-4"
          >
            <p className="text-gray-300 text-sm leading-relaxed">
              {characters.find(c => c.class_id === selectedClass)?.description}
            </p>
          </motion.div>
        )}

        {/* Join Button */}
        <motion.button
          whileHover={canJoin ? { scale: 1.02 } : {}}
          whileTap={canJoin ? { scale: 0.97 } : {}}
          onClick={handleJoin}
          disabled={!canJoin || isLoading}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all
            ${canJoin && !isLoading
              ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(196,30,58,0.4)]'
              : 'bg-[#1a1a1a] text-gray-600 cursor-not-allowed'
            }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              Bergabung...
            </span>
          ) : 'Bergabung →'}
        </motion.button>
      </div>
    </div>
  );
}
