import DailyIframe from '@daily-co/daily-js';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface TavusAvatarProps {
  onExit: () => void;
}

// ─── Self-contained Tavus HD Avatar ──────────────────────────────────────────
// Fetches its own session from /.netlify/functions/tavus on mount.
// Calls DELETE on unmount to end the conversation and avoid wasting credits.
// Gemini is NOT used here at all.

const IS_PROD = (import.meta as any).env?.PROD || false;
const TAVUS_CREATE_ENDPOINT = IS_PROD
  ? '/.netlify/functions/tavus'
  : '/api/tavus/session';

export function TavusAvatar({ onExit }: TavusAvatarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callRef = useRef<any>(null);
  const conversationIdRef = useRef<string | null>(null);

  const [phase, setPhase] = useState<'loading' | 'connected' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // ── Create session + join Daily.co ──────────────────────────────────────────
  const startSession = async () => {
    setPhase('loading');
    setErrorMsg('');

    try {
      console.log('[ALIA] Creating Tavus session at:', TAVUS_CREATE_ENDPOINT);
      const res = await fetch(TAVUS_CREATE_ENDPOINT, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: 'Professional pharmaceutical sales training session',
          replicaId: 'r55e6793f10f' // Nathan - Bookshelf
        })
      });
      
      const data = await res.json();
      console.log('[ALIA] Tavus response:', data);

      if (!res.ok || !data.conversation_url) {
        throw new Error(data.error || `Tavus API error ${res.status}`);
      }

      conversationIdRef.current = data.conversation_id || null;

      console.log('[ALIA] Tavus session created, conversation_url:', data.conversation_url);
      
      // Simply set connected and let the iframe load naturally
      setPhase('connected');
      
      if (!containerRef.current) return;

      // Create iframe directly
      const iframe = document.createElement('iframe');
      iframe.src = data.conversation_url;
      iframe.allow = 'camera; microphone; autoplay; display-capture';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = '0';
      containerRef.current.appendChild(iframe);
      
      console.log('[ALIA] Iframe created and appended');
    } catch (err: any) {
      console.error('[ALIA] Tavus session error:', err);
      setErrorMsg(err.message || 'Erreur inconnue');
      setPhase('error');
    }
  };

  // ── End session ──────────────────────────────────────────────────────────────
  const endSession = async () => {
    // Clear iframe
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
    
    if (conversationIdRef.current) {
      try {
        const deleteEndpoint = IS_PROD 
          ? '/.netlify/functions/tavus'
          : `/api/tavus/session/${conversationIdRef.current}`;
        
        await fetch(deleteEndpoint, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (_) {}
      conversationIdRef.current = null;
    }
  };

  useEffect(() => {
    startSession();
    return () => { endSession(); };
  }, []);

  const handleExit = async () => {
    await endSession();
    onExit();
  };

  // ── Loading state ────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div
        className="w-full h-screen flex flex-col items-center justify-center gap-6"
        style={{ background: 'linear-gradient(135deg, #020817 0%, #0a1628 100%)' }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="w-14 h-14 rounded-full border-4 border-transparent"
          style={{ borderTopColor: '#FF6B9D', borderRightColor: '#FF6B9D44' }}
        />
        <div className="text-center">
          <p className="text-white font-bold text-xl mb-1">Connexion à ALIA...</p>
          <p className="text-white/40 text-sm">Initialisation de l'avatar HD</p>
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div
        className="w-full h-screen flex flex-col items-center justify-center gap-6 px-6"
        style={{ background: 'linear-gradient(135deg, #020817 0%, #0a1628 100%)' }}
      >
        <div className="text-5xl">⚠️</div>
        <div className="text-center max-w-md">
          <p className="text-white font-bold text-xl mb-2">Connexion échouée</p>
          <p className="text-white/50 text-sm mb-6">{errorMsg}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={startSession}
              className="px-8 py-3 rounded-2xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #FF6B9D, #c0392b)' }}
            >
              Réessayer
            </button>
            <button
              onClick={onExit}
              className="px-8 py-3 rounded-2xl font-bold text-white/60 border border-white/10 hover:border-white/30 transition-colors"
            >
              ← Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Connected state ──────────────────────────────────────────────────────────
  return (
    <div
      className="w-full h-screen relative overflow-hidden"
      style={{ background: '#000000' }}
    >
      {/* Daily.co iframe fills the entire screen */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Scan line */}
      <div
        className="absolute inset-x-0 h-px pointer-events-none"
        style={{
          animation: 'scan 6s linear infinite',
          background: 'rgba(255,107,157,0.2)',
          boxShadow: '0 0 20px rgba(255,107,157,0.4)',
          zIndex: 10,
        }}
      />

      {/* HUD — top left */}
      <div className="absolute top-6 left-6 z-20 pointer-events-none flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: '#FF6B9D',
              boxShadow: '0 0 8px rgba(255,107,157,0.8)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
          <span className="text-[10px] font-black text-white/50 tracking-[0.4em] uppercase">
            {isSpeaking ? 'ALIA PARLE' : 'HD VIDEO ACTIVE'}
          </span>
        </div>
        <div className="flex gap-0.5 h-4 items-end">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="w-1 rounded-full"
              style={{
                backgroundColor: isSpeaking ? 'rgba(255,107,157,0.8)' : 'rgba(255,107,157,0.25)',
                height: isSpeaking ? `${25 + Math.sin(Date.now() / 180 + i) * 60}%` : '20%',
                transition: 'height 0.1s',
              }}
            />
          ))}
        </div>
      </div>

      {/* Exit button — top right */}
      <button
        onClick={handleExit}
        className="absolute top-6 right-6 z-20 px-5 py-2.5 rounded-xl font-bold text-sm text-white/70 hover:text-white border border-white/10 hover:border-white/30 transition-all"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}
      >
        ← Quitter Session
      </button>

      {/* Branding */}
      <div className="absolute bottom-6 right-6 z-20 pointer-events-none">
        <span className="text-[10px] font-mono text-white/20 tracking-tighter uppercase">
          Tavus CVI • ALIA HD
        </span>
      </div>

      {/* Corner accents */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-pink-500/20 rounded-tl-lg pointer-events-none z-20" />
      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-pink-500/20 rounded-tr-lg pointer-events-none z-20" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-pink-500/20 rounded-bl-lg pointer-events-none z-20" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-pink-500/20 rounded-br-lg pointer-events-none z-20" />
    </div>
  );
}
