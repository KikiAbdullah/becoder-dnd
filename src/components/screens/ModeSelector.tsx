import { motion } from 'framer-motion';
import { Tv, Smartphone, Sword } from 'lucide-react';

type Mode = 'tv' | 'player';

interface Props {
  onSelect: (mode: Mode) => void;
}

export default function ModeSelector({ onSelect }: Props) {
  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-14"
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <Sword size={36} className="text-yellow-400" />
          <h1 className="font-serif text-5xl font-bold text-yellow-400 tracking-wide"
              style={{ textShadow: '0 0 24px rgba(255,215,0,0.5)' }}>
            Chrono-Dungeon
          </h1>
          <Sword size={36} className="text-yellow-400 scale-x-[-1]" />
        </div>
        <p className="text-gray-400 text-sm tracking-widest uppercase">Virtual Tabletop · D&D 5e</p>
      </motion.div>

      {/* Mode Cards */}
      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl">
        <ModeCard
          delay={0.2}
          icon={<Tv size={48} className="text-blue-400" />}
          title="GM / TV Mode"
          description="Tampilkan narasi game di layar besar. Jalankan sebagai Game Master dan kendalikan sesi."
          color="blue"
          onClick={() => onSelect('tv')}
        />
        <ModeCard
          delay={0.35}
          icon={<Smartphone size={48} className="text-red-400" />}
          title="Player Mode"
          description="Bergabung ke sesi game sebagai pemain. Gunakan HP atau tablet untuk voting dan melempar dadu."
          color="red"
          onClick={() => onSelect('player')}
        />
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-gray-600 text-xs mt-12"
      >
        Chrono-Dungeon VTT · Built for D&D enthusiasts
      </motion.p>
    </div>
  );
}

function ModeCard({
  icon, title, description, color, onClick, delay
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'blue' | 'red';
  onClick: () => void;
  delay: number;
}) {
  const borderColor = color === 'blue' ? 'border-blue-500/40 hover:border-blue-400' : 'border-red-500/40 hover:border-red-400';
  const glowColor = color === 'blue' ? 'hover:shadow-[0_0_30px_rgba(65,105,225,0.3)]' : 'hover:shadow-[0_0_30px_rgba(196,30,58,0.3)]';

  return (
    <motion.button
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-5 p-8 rounded-2xl border-2 
        bg-[#111] cursor-pointer text-center transition-all duration-300
        ${borderColor} ${glowColor}`}
    >
      <div className="p-4 rounded-full bg-[#1a1a1a]">{icon}</div>
      <div>
        <h2 className="font-serif text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>
    </motion.button>
  );
}
