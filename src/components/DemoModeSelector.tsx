import { motion } from 'framer-motion';

interface DemoModeSelectorProps {
  onSelect: (mode: 'demo-3d' | 'demo-hd' | 'real') => void;
}

export function DemoModeSelector({ onSelect }: DemoModeSelectorProps) {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-6 py-16"
      style={{ background: 'linear-gradient(135deg, #020817 0%, #0a1628 50%, #050d1a 100%)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="text-4xl font-black text-white mb-4">
          Mode Démonstration
        </h1>
        <p className="text-white/60 text-sm">
          Choisissez comment vous voulez tester ALIA
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
        {/* Demo 3D */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => onSelect('demo-3d')}
          className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/50 rounded-2xl p-8 text-left transition-all"
        >
          <div className="text-4xl mb-4">🎮</div>
          <h3 className="text-white font-bold text-xl mb-2">Demo 3D</h3>
          <p className="text-white/60 text-sm mb-4">
            Avatar 3D avec réponses simulées (pas besoin de clé API)
          </p>
          <div className="text-cyan-400 text-xs font-bold">
            ✓ Fonctionne sans API
          </div>
        </motion.button>

        {/* Demo HD */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => onSelect('demo-hd')}
          className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-500/50 rounded-2xl p-8 text-left transition-all"
        >
          <div className="text-4xl mb-4">🎬</div>
          <h3 className="text-white font-bold text-xl mb-2">Demo HD</h3>
          <p className="text-white/60 text-sm mb-4">
            Simulation vidéo HD (pas besoin de Tavus)
          </p>
          <div className="text-pink-400 text-xs font-bold">
            ✓ Fonctionne sans API
          </div>
        </motion.button>

        {/* Real Mode */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => onSelect('real')}
          className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-500/50 rounded-2xl p-8 text-left transition-all"
        >
          <div className="text-4xl mb-4">🚀</div>
          <h3 className="text-white font-bold text-xl mb-2">Mode Réel</h3>
          <p className="text-white/60 text-sm mb-4">
            Gemini + Tavus avec vraies clés API
          </p>
          <div className="text-green-400 text-xs font-bold">
            ⚠ Nécessite clés API
          </div>
        </motion.button>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-10 text-white/30 text-xs text-center max-w-md"
      >
        💡 Pour la démonstration, utilisez les modes Demo qui fonctionnent sans configuration
      </motion.p>
    </div>
  );
}
