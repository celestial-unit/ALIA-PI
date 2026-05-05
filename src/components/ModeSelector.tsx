import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

type AvatarMode = '3d' | 'hd';

interface ModeSelectorProps {
  onSelect: (mode: AvatarMode) => void;
}

// ─── Typing animation ─────────────────────────────────────────────────────────
function TypingBadge() {
  const phrases = ['Intelligence Pharmaceutique', 'Formation Médicale IA', 'Choisissez votre avatar'];
  const [idx, setIdx] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const phrase = phrases[idx];
    let t: ReturnType<typeof setTimeout>;
    if (!deleting && displayed.length < phrase.length) {
      t = setTimeout(() => setDisplayed(phrase.slice(0, displayed.length + 1)), 55);
    } else if (!deleting && displayed.length === phrase.length) {
      t = setTimeout(() => setDeleting(true), 1800);
    } else if (deleting && displayed.length > 0) {
      t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 28);
    } else {
      setDeleting(false);
      setIdx((i) => (i + 1) % phrases.length);
    }
    return () => clearTimeout(t);
  }, [displayed, deleting, idx]);

  return (
    <span className="text-[#00d9ff] font-mono">
      {displayed}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="inline-block w-0.5 h-5 bg-[#00d9ff] ml-0.5 align-middle"
      />
    </span>
  );
}

// ─── Floating orb ─────────────────────────────────────────────────────────────
function Orb({ color, size, x, y, dur, delay }: { color: string; size: number; x: string; y: string; dur: number; delay: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: x, top: y,
        width: size, height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        opacity: 0.15,
      }}
      animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.2, 1] }}
      transition={{ duration: dur, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

// ─── Mode card ────────────────────────────────────────────────────────────────
interface CardProps {
  icon: string;
  title: string;
  subtitle: string;
  badge: string;
  accent: string;
  description: string;
  features: string[];
  delay: number;
  onClick: () => void;
}

function ModeCard({ icon, title, subtitle, badge, accent, description, features, delay, onClick }: CardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.23, 1, 0.32, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={onClick}
      className="relative cursor-pointer rounded-3xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${hovered ? accent + '55' : 'rgba(255,255,255,0.08)'}`,
        backdropFilter: 'blur(24px)',
        transition: 'border-color 0.3s',
      }}
      whileHover={{ scale: 1.03, y: -6 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Glow overlay on hover */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-3xl"
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{ background: `radial-gradient(circle at 50% 0%, ${accent}18 0%, transparent 65%)` }}
      />

      {/* Top accent bar */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, opacity: hovered ? 1 : 0.3, transition: 'opacity 0.3s' }} />

      <div className="p-8 md:p-10 relative">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6"
          style={{ background: `${accent}18`, border: `1px solid ${accent}33`, color: accent }}
        >
          <motion.div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: accent }}
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          {badge}
        </div>

        {/* Icon + Title */}
        <div className="flex items-center gap-4 mb-3">
          <motion.div
            className="text-5xl"
            animate={hovered ? { rotate: [0, -10, 10, 0], scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.5 }}
          >
            {icon}
          </motion.div>
          <div>
            <h3 className="text-white font-black text-2xl md:text-3xl tracking-tight">{title}</h3>
            <p className="text-xs font-bold uppercase tracking-widest mt-0.5" style={{ color: accent + 'cc' }}>{subtitle}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-white/50 text-sm leading-relaxed mb-6">{description}</p>

        {/* Feature list */}
        <ul className="space-y-2 mb-8">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-2.5 text-sm text-white/70">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />
              {f}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <motion.div
          className="flex items-center justify-between px-6 py-4 rounded-2xl font-bold text-white text-sm"
          style={{ background: `linear-gradient(135deg, ${accent}33, ${accent}18)`, border: `1px solid ${accent}33` }}
          animate={hovered ? { x: [0, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <span>Sélectionner {title}</span>
          <motion.span
            animate={hovered ? { x: [0, 6, 0] } : {}}
            transition={{ duration: 0.4, repeat: hovered ? Infinity : 0 }}
          >
            →
          </motion.span>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Main ModeSelector ────────────────────────────────────────────────────────
export function ModeSelector({ onSelect }: ModeSelectorProps) {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #020817 0%, #0a1628 50%, #050d1a 100%)' }}
    >
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <Orb color="#0066ff" size={600} x="-10%" y="-10%" dur={18} delay={0} />
        <Orb color="#00d9ff" size={500} x="60%" y="50%" dur={22} delay={3} />
        <Orb color="#FF6B9D" size={400} x="80%" y="-5%" dur={16} delay={6} />
        <Orb color="#7c3aed" size={350} x="10%" y="70%" dur={20} delay={2} />
      </div>

      {/* Grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,217,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,217,255,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        className="text-center mb-14 relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
            style={{ background: 'linear-gradient(135deg, #0066ff, #00d9ff)', boxShadow: '0 0 30px rgba(0,102,255,0.4)' }}
          >
            🏥
          </div>
          <div className="text-left">
            <div className="text-white font-black text-3xl tracking-tight leading-none">ALIA</div>
            <div className="text-[#00d9ff] text-[10px] font-bold uppercase tracking-[0.35em] opacity-70">Intelligence Pharmaceutique</div>
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">
          Choisissez votre<br />
          <span style={{ background: 'linear-gradient(135deg, #00d9ff, #0066ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            expérience avatar
          </span>
        </h1>

        <p className="text-white/40 text-sm font-medium h-6">
          <TypingBadge />
        </p>
      </motion.div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl relative z-10">
        <ModeCard
          icon="🤖"
          title="Avatar 3D"
          subtitle="Gemini Live • Derja • Lip Sync temps réel"
          badge="GRATUIT • ILLIMITÉ"
          accent="#00D9FF"
          description="Avatar 3D interactif propulsé par Gemini 2.0 Flash Live. Conversation vocale en temps réel en dialecte tunisien avec synchronisation labiale procédurale."
          features={[
            'Gemini 2.0 Flash Live API',
            'Lip-sync via Web Audio AnalyserNode',
            'Support modèles GLB/GLTF personnalisés',
            'Dialecte tunisien (Derja) natif',
            'Aucun crédit Tavus consommé',
          ]}
          delay={0.2}
          onClick={() => onSelect('3d')}
        />
        <ModeCard
          icon="✨"
          title="Avatar HD"
          subtitle="Tavus CVI • Visage photoréaliste • ALIA"
          badge="HAUTE DÉFINITION"
          accent="#FF6B9D"
          description="Jumeau numérique photoréaliste via Tavus Conversational Video Intelligence. Expérience cinématographique avec synchronisation labiale parfaite."
          features={[
            'Tavus CVI — visage HD photoréaliste',
            'Persona ALIA dédiée',
            'Synchronisation labiale parfaite',
            'Interface vidéo immersive plein écran',
            'Transcription automatique activée',
          ]}
          delay={0.35}
          onClick={() => onSelect('hd')}
        />
      </div>

      {/* Footer note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-10 text-white/20 text-xs font-bold uppercase tracking-widest relative z-10 text-center"
      >
        Vital Company dima m3ak 🏥 — Projet de Fin d'Études 4DS 2025/2026
      </motion.p>
    </div>
  );
}
