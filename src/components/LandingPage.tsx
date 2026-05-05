import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';

interface LandingPageProps {
  onLaunch: () => void;
}

// ─── Floating particle ────────────────────────────────────────────────────────
function Particle({ x, y, size, delay, duration }: { x: number; y: number; size: number; delay: number; duration: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, background: 'radial-gradient(circle, rgba(0,217,255,0.6) 0%, rgba(0,217,255,0) 70%)' }}
      animate={{ y: [0, -30, 0], opacity: [0.2, 0.8, 0.2], scale: [1, 1.4, 1] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

// ─── Typing text animation ────────────────────────────────────────────────────
const TYPING_PHRASES = [
  'Intelligence Pharmaceutique',
  'Formation Médicale IA',
  'Avatar Conversationnel HD',
  'Powered by Gemini 2.0',
];

function TypingText() {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const phrase = TYPING_PHRASES[phraseIdx];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && displayed.length < phrase.length) {
      timeout = setTimeout(() => setDisplayed(phrase.slice(0, displayed.length + 1)), 60);
    } else if (!isDeleting && displayed.length === phrase.length) {
      timeout = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 30);
    } else if (isDeleting && displayed.length === 0) {
      setIsDeleting(false);
      setPhraseIdx((i) => (i + 1) % TYPING_PHRASES.length);
    }

    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, phraseIdx]);

  return (
    <span className="text-[#00d9ff]">
      {displayed}
      <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="inline-block w-0.5 h-8 bg-[#00d9ff] ml-1 align-middle" />
    </span>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, delay }: { icon: string; title: string; desc: string; delay: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.23, 1, 0.32, 1] }}
      className="relative group p-8 rounded-3xl border border-white/10 overflow-hidden cursor-default"
      style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)' }}
      whileHover={{ scale: 1.03, borderColor: 'rgba(0,217,255,0.3)' }}
    >
      {/* Glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(0,217,255,0.08) 0%, transparent 70%)' }} />
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
      <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
}

// ─── Stat counter ─────────────────────────────────────────────────────────────
function StatCounter({ value, label, delay }: { value: string; label: string; delay: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.6, delay, ease: 'backOut' }}
      className="text-center"
    >
      <div className="text-5xl font-black text-white mb-1" style={{ textShadow: '0 0 30px rgba(0,217,255,0.5)' }}>{value}</div>
      <div className="text-white/40 text-xs font-bold uppercase tracking-widest">{label}</div>
    </motion.div>
  );
}

// ─── Tech card (extracted to avoid hooks-in-map) ─────────────────────────────
function TechCard({ name, desc, color, icon, index }: { name: string; desc: string; color: string; icon: string; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.23, 1, 0.32, 1] }}
      className="p-8 rounded-3xl flex gap-6 items-start"
      style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}22` }}
      whileHover={{ borderColor: `${color}44`, scale: 1.02 }}
    >
      <div className="text-4xl flex-shrink-0">{icon}</div>
      <div>
        <h3 className="font-black text-lg mb-2" style={{ color }}>{name}</h3>
        <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

// ─── Main LandingPage ─────────────────────────────────────────────────────────
export function LandingPage({ onLaunch }: LandingPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  // Generate stable particles
  const particles = useRef(
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 4 + Math.random() * 8,
      delay: Math.random() * 4,
      duration: 4 + Math.random() * 6,
    }))
  ).current;

  const features = [
    { icon: '🎙️', title: 'Voix Tunisienne (Derja)', desc: 'Interaction vocale en temps réel dans le dialecte tunisien natif, propulsée par Gemini 2.0 Flash Live.' },
    { icon: '🤖', title: 'Dual Avatar System', desc: 'Choisissez entre un avatar 3D GLB interactif avec lip-sync procédural ou un jumeau numérique HD via Tavus CVI.' },
    { icon: '📹', title: 'Coaching Posture Caméra', desc: 'Analyse en temps réel de votre posture et de votre langage corporel pendant les simulations de visite médicale.' },
    { icon: '🧬', title: 'Base Vital Company', desc: 'Connaissance médicale intégrée des produits Vital Company avec données cliniques, posologie et études.' },
    { icon: '💬', title: 'Interface Hybride', desc: 'Combinez texte et voix dans une interface fluide. Transcription automatique et historique de session complet.' },
    { icon: '🌍', title: 'Marché Tunisien', desc: 'Conçu spécifiquement pour le marché pharmaceutique tunisien avec support multilingue FR/AR/EN/ES.' },
  ];

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.6 }}
      className="relative min-h-screen overflow-x-hidden"
      style={{ background: 'linear-gradient(135deg, #020817 0%, #0a1628 40%, #050d1a 100%)' }}
    >
      {/* ── Animated gradient orbs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ x: [0, 60, 0], y: [0, -40, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #0066ff 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 60, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #00d9ff 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }}
        />
      </div>

      {/* ── Floating particles ── */}
      <div className="fixed inset-0 pointer-events-none">
        {particles.map((p) => (
          <Particle key={p.id} {...p} />
        ))}
      </div>

      {/* ── Grid overlay ── */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(rgba(0,217,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,217,255,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
      />

      {/* ── Navigation ── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="fixed top-0 left-0 right-0 z-50 px-8 py-5 flex items-center justify-between"
        style={{ background: 'rgba(2,8,23,0.7)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg, #0066ff, #00d9ff)' }}>
            🏥
          </div>
          <div>
            <span className="text-white font-black text-xl tracking-tight">ALIA</span>
            <span className="text-[#00d9ff] text-[10px] font-bold uppercase tracking-[0.3em] ml-2 opacity-70">v2.0</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8 text-white/50 text-sm font-medium">
          <a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a>
          <a href="#about" className="hover:text-white transition-colors">À propos</a>
          <a href="#tech" className="hover:text-white transition-colors">Technologie</a>
        </div>
        <motion.button
          onClick={onLaunch}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-5 py-2.5 rounded-xl text-sm font-bold text-white border border-[#00d9ff]/30 hover:border-[#00d9ff]/70 transition-all"
          style={{ background: 'rgba(0,217,255,0.08)' }}
        >
          Lancer ALIA →
        </motion.button>
      </motion.nav>

      {/* ── HERO SECTION ── */}
      <motion.section
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-20"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-bold uppercase tracking-widest"
          style={{ background: 'rgba(0,217,255,0.08)', border: '1px solid rgba(0,217,255,0.2)', color: '#00d9ff' }}
        >
          <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-2 h-2 rounded-full bg-[#00d9ff]" />
          Projet de Fin d'Études — 4DS — 2025/2026
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.88] mb-6 text-white"
          style={{ textShadow: '0 0 80px rgba(0,102,255,0.3)' }}
        >
          ALIA
        </motion.h1>

        {/* Typing subtitle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-2xl md:text-3xl font-bold mb-6 h-10"
        >
          <TypingText />
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="text-white/50 text-lg max-w-2xl leading-relaxed mb-12"
        >
          Avatar intelligent de formation pharmaceutique propulsé par Gemini 2.0 Flash et Tavus CVI.
          Simulez des visites médicales réalistes en dialecte tunisien avec un jumeau numérique HD.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="flex flex-col sm:flex-row gap-4 items-center"
        >
          <motion.button
            onClick={onLaunch}
            whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(0,102,255,0.5)' }}
            whileTap={{ scale: 0.97 }}
            className="group relative px-10 py-5 rounded-2xl font-black text-lg text-white overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0066ff 0%, #00d9ff 100%)' }}
          >
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #0052cc 0%, #00b8d9 100%)' }}
            />
            <span className="relative flex items-center gap-3">
              🚀 Lancer ALIA
              <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>→</motion.span>
            </span>
          </motion.button>

          <motion.a
            href="#features"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-10 py-5 rounded-2xl font-bold text-white/70 hover:text-white transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' }}
          >
            Découvrir →
          </motion.a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-white/30 text-xs font-bold uppercase tracking-widest">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center pt-1.5"
          >
            <div className="w-1 h-2 rounded-full bg-white/40" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ── STATS SECTION ── */}
      <section id="about" className="relative py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div
            className="rounded-3xl p-12 grid grid-cols-2 md:grid-cols-4 gap-8"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}
          >
            <StatCounter value="2.0" label="Gemini Flash" delay={0} />
            <StatCounter value="HD" label="Tavus Avatar" delay={0.1} />
            <StatCounter value="4+" label="Langues" delay={0.2} />
            <StatCounter value="100%" label="Tunisien" delay={0.3} />
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section id="features" className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <span className="text-[#00d9ff] text-xs font-black uppercase tracking-[0.4em] mb-4 block">Fonctionnalités</span>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">
                Tout ce dont vous avez<br />
                <span style={{ background: 'linear-gradient(135deg, #0066ff, #00d9ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  besoin pour former
                </span>
              </h2>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <FeatureCard key={i} {...f} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH SECTION ── */}
      <section id="tech" className="relative py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <span className="text-[#00d9ff] text-xs font-black uppercase tracking-[0.4em] mb-4 block">Stack Technologique</span>
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                Propulsé par les meilleures<br />technologies IA 2025
              </h2>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TechCard name="Gemini 2.0 Flash Live" desc="API Live temps réel pour la conversation vocale bidirectionnelle avec transcription automatique et synthèse vocale." color="#4285F4" icon="🧠" index={0} />
            <TechCard name="Tavus CVI" desc="Conversational Video Intelligence — jumeau numérique photoréaliste avec synchronisation labiale parfaite." color="#FF6B6B" icon="🎬" index={1} />
            <TechCard name="React Three Fiber" desc="Avatar 3D GLB interactif avec lip-sync procédural via Web Audio AnalyserNode et morph targets." color="#61DAFB" icon="🌐" index={2} />
            <TechCard name="Netlify Functions" desc="Architecture serverless sécurisée — les clés API Tavus ne sont jamais exposées côté client." color="#00C7B7" icon="⚡" index={3} />
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative py-32 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
          >
            <div
              className="p-16 rounded-[3rem] relative overflow-hidden"
              style={{ background: 'rgba(0,102,255,0.08)', border: '1px solid rgba(0,217,255,0.15)' }}
            >
              {/* Glow */}
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(0,217,255,0.1) 0%, transparent 60%)' }} />

              <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight relative">
                Prêt à révolutionner<br />
                <span style={{ background: 'linear-gradient(135deg, #0066ff, #00d9ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  la formation médicale ?
                </span>
              </h2>
              <p className="text-white/50 text-lg mb-10 relative">
                Lancez ALIA et commencez votre première simulation pharmaceutique en dialecte tunisien.
              </p>

              <motion.button
                onClick={onLaunch}
                whileHover={{ scale: 1.06, boxShadow: '0 0 60px rgba(0,102,255,0.6)' }}
                whileTap={{ scale: 0.97 }}
                className="relative px-14 py-6 rounded-2xl font-black text-xl text-white"
                style={{ background: 'linear-gradient(135deg, #0066ff 0%, #00d9ff 100%)' }}
              >
                <span className="flex items-center gap-3">
                  🚀 Lancer ALIA Maintenant
                </span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative py-12 px-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: 'linear-gradient(135deg, #0066ff, #00d9ff)' }}>
              🏥
            </div>
            <div>
              <span className="text-white font-black">ALIA</span>
              <span className="text-white/30 text-xs ml-2">by Vital Company</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-white/60 font-bold">Vital Company dima m3ak 🏥</p>
            <p className="text-white/30 text-sm italic">Projet de Fin d'Études — 4DS — 2025/2026</p>
          </div>
          <div className="flex gap-4 text-white/30 text-xs font-bold uppercase tracking-widest">
            <span>React 19</span>
            <span>·</span>
            <span>Gemini 2.0</span>
            <span>·</span>
            <span>Tavus CVI</span>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
