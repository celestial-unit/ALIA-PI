/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  ChevronRight,
  Award,
  MessageSquare,
  Globe,
  Stethoscope,
  History,
  TrendingUp,
  FileText,
  AlertCircle,
  Database,
  ArrowRight,
  LogOut,
  BarChart3,
  Calendar,
  Mic,
} from 'lucide-react';
import { ThreeAvatar } from './components/ThreeAvatar';
import { TavusAvatar } from './components/TavusAvatar';
import { LandingPage } from './components/LandingPage';
import { ModeSelector } from './components/ModeSelector';
import { CameraFloatingBubble } from './components/CameraFloatingBubble';
import { LANGUAGES, HEALTHCARE_PROFILES } from './constants';
import { Language, Mode, MedicalProduct, Message, EvaluationResult } from './types';
import { GeminiService } from './services/geminiService';
import { GeminiLiveService } from './services/geminiLiveService';
import { cn } from './lib/utils';

// ─── API routing: Netlify functions in prod, Express locally ─────────────────
const IS_PROD = (import.meta as any).env?.PROD || false;
const PRODUCTS_ENDPOINT = IS_PROD
  ? '/.netlify/functions/products'
  : '/api/knowledge/products';

// ─── Avatar mode type ─────────────────────────────────────────────────────────
type AvatarMode = '3d' | 'hd' | null;

export default function App() {
  // ── Top-level view state ───────────────────────────────────────────────────
  const [showLanding, setShowLanding] = useState(true);
  const [avatarMode, setAvatarMode] = useState<AvatarMode>(null);

  // ── App state (3D mode) ────────────────────────────────────────────────────
  const [appState, setAppState] = useState<'IDLE' | 'CONFIG' | 'SESSION' | 'EVALUATION'>('IDLE');
  
  // Debug appState changes
  useEffect(() => {
    console.log('[DEBUG] appState changed to:', appState);
  }, [appState]);
  const [mode, setMode] = useState<Mode>('TRAINING');
  const [language, setLanguage] = useState<Language>('FR');
  const [products, setProducts] = useState<MedicalProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<MedicalProduct | null>(null);
  const [selectedProfile, setSelectedProfile] = useState(HEALTHCARE_PROFILES[0].id);
  const [history, setHistory] = useState<Message[]>([]);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [avatarVolume, setAvatarVolume] = useState(0);
  const [customModelUrl, setCustomModelUrl] = useState<string | undefined>(undefined);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Enable video streaming when camera becomes available
  useEffect(() => {
    if (cameraStream && liveServiceRef.current) {
      console.log('[DEBUG] Enabling video stream for Gemini');
      liveServiceRef.current.enableVideoStream(cameraStream);
    }
  }, [cameraStream]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const liveServiceRef = useRef<GeminiLiveService | null>(null);
  const recognitionRef = useRef<any>(null);
  const hasInitialized3DMode = useRef(false);
  const isConnectingRef = useRef(false);

  // ── Set appState to CONFIG when entering 3D mode ───────────────────────────
  useEffect(() => {
    console.log('[DEBUG] avatarMode useEffect triggered, avatarMode:', avatarMode, 'hasInitialized:', hasInitialized3DMode.current);
    if (avatarMode === '3d' && !hasInitialized3DMode.current) {
      setAppState('CONFIG');
      hasInitialized3DMode.current = true;
    } else if (avatarMode === null) {
      setAppState('IDLE');
      hasInitialized3DMode.current = false;
    }
  }, [avatarMode]);

  // ── Fetch products on mount ────────────────────────────────────────────────
  useEffect(() => {
    fetch(PRODUCTS_ENDPOINT)
      .then((r) => r.json())
      .then((data) => {
        setProducts(data);
        setSelectedProduct(data[0]);
      })
      .catch(() => {});
  }, []);

  // ── Speech recognition setup ───────────────────────────────────────────────
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === 'FR' ? 'fr-FR' : 'en-US';
    recognition.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      if (t) handleSendMessage(t);
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, [language]);

  // ── Audio playback helper ──────────────────────────────────────────────────
  const playAudio = async (base64Data: string, mimeType = 'audio/mp3') => {
    try {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
      const audio = new Audio(url);
      audioRef.current = audio;
      setIsSpeaking(true);
      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); audioRef.current = null; };
      audio.onerror = () => { setIsSpeaking(false); audioRef.current = null; };
      await audio.play();
    } catch { setIsSpeaking(false); }
  };

  // ── Start 3D Gemini session ────────────────────────────────────────────────
  const startSession = async () => {
    if (isConnectingRef.current) {
      console.log('[DEBUG] Already connecting, ignoring duplicate call');
      return;
    }
    
    console.log('[DEBUG] startSession called');
    isConnectingRef.current = true;
    setHistory([]);
    setEvaluation(null);
    setAppState('SESSION');
    console.log('[DEBUG] appState set to SESSION');
    
    if (!selectedProduct) {
      isConnectingRef.current = false;
      return;
    }

    try {
      liveServiceRef.current = new GeminiLiveService();
      await liveServiceRef.current.connect(
        mode,
        selectedProduct,
        HEALTHCARE_PROFILES.find((p) => p.id === selectedProfile)?.label || '',
        language,
        (text, isModel) => {
          setHistory((prev) => {
            const last = prev[prev.length - 1];
            if (last && ((isModel && last.role === 'model') || (!isModel && last.role === 'user'))) {
              const updated = [...prev];
              updated[updated.length - 1] = { ...last, content: last.content + ' ' + text };
              return updated;
            }
            return [...prev, { role: isModel ? 'model' : 'user', content: text, timestamp: Date.now() }];
          });
        },
        () => setIsSpeaking(true),
        () => setIsSpeaking(false),
        (vol) => setAvatarVolume(vol),
        () => {
          console.log('[DEBUG] onClose callback triggered - not auto-stopping');
          // Don't auto-stop on close
        },
        cameraStream || undefined
      );
      console.log('[DEBUG] Gemini connection established');
    } catch (error) {
      console.error('[DEBUG] Connection error:', error);
      isConnectingRef.current = false;
    }
  };

  // ── AI response (fallback text mode) ──────────────────────────────────────
  const handleAIResponse = async (currentHistory: Message[]) => {
    if (!selectedProduct) return;
    setIsProcessing(true);
    try {
      const response = await GeminiService.getAvatarResponse(
        currentHistory, mode, language, selectedProduct,
        HEALTHCARE_PROFILES.find((p) => p.id === selectedProfile)?.label,
      );
      const aiMsg: Message = { role: 'model', content: response, timestamp: Date.now() };
      const newHistory = [...currentHistory, aiMsg];
      setHistory(newHistory);
      const speech = await GeminiService.generateSpeech(response);
      if (speech?.data) await playAudio(speech.data, speech.mimeType);
      else { setIsSpeaking(true); setTimeout(() => setIsSpeaking(false), 3000); }
    } catch (e) { console.error(e); }
    finally { setIsProcessing(false); }
  };

  // ── Stop session ───────────────────────────────────────────────────────────
  const stopSession = async () => {
    console.log('[DEBUG] stopSession called');
    if (liveServiceRef.current) {
      liveServiceRef.current.disconnect();
      liveServiceRef.current = null;
    }
    isConnectingRef.current = false;
    
    if (mode === 'TRAINING' && history.length > 2) {
      setIsProcessing(true);
      try {
        const result = await GeminiService.evaluateSession(history, selectedProduct!, language);
        setEvaluation(result);
        setAppState('EVALUATION');
      } catch { setAppState('IDLE'); }
      finally { setIsProcessing(false); }
    } else {
      setAppState('IDLE');
    }
  };

  // ── Input handlers ─────────────────────────────────────────────────────────
  const startListening = () => {
    if (!recognitionRef.current || isProcessing) return;
    try { recognitionRef.current.start(); setIsListening(true); } catch {}
  };
  const stopListening = () => recognitionRef.current?.stop();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.name.endsWith('.glb') || file.name.endsWith('.gltf'))) {
      setCustomModelUrl(URL.createObjectURL(file));
    }
  };

  const handleSendMessage = (content?: string) => {
    const text = content || userInput;
    if (!text.trim() || isProcessing) return;
    if (liveServiceRef.current) {
      setHistory((prev) => [...prev, { role: 'user', content: text, timestamp: Date.now() }]);
      setUserInput('');
    } else {
      const newHistory = [...history, { role: 'user' as const, content: text, timestamp: Date.now() }];
      setHistory(newHistory);
      setUserInput('');
      handleAIResponse(newHistory);
    }
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      {/* Bulle caméra flottante - visible partout sauf sur landing */}
      {!showLanding && <CameraFloatingBubble onStreamReady={setCameraStream} />}
      
      <AnimatePresence mode="wait">
        {/* Landing page */}
        {showLanding && (
          <LandingPage key="landing" onLaunch={() => setShowLanding(false)} />
        )}

        {/* Mode selector */}
        {!showLanding && avatarMode === null && (
          <ModeSelector
            key="mode-selector"
            onSelect={(mode) => {
              setAvatarMode(mode);
              if (mode === '3d') setAppState('CONFIG');
            }}
          />
        )}

        {/* HD Mode — Tavus only */}
        {!showLanding && avatarMode === 'hd' && (
          <TavusAvatar key="hd-mode" onExit={() => setAvatarMode(null)} />
        )}

        {/* 3D Mode — Gemini + ThreeAvatar */}
        {!showLanding && avatarMode === '3d' && (
          <motion.div
            key="3d-mode"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen"
          >
            {/* Nav */}
            <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-zinc-200 z-50 px-6 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Stethoscope className="text-white w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-zinc-900">ALIA</h1>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-blue-600 leading-none">Avatar 3D</p>
                </div>
              </div>
              <button
                onClick={() => setAvatarMode(null)}
                className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                ← Changer de mode
              </button>
            </nav>

            <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
              <AnimatePresence mode="wait">
                {/* CONFIG */}
                {appState === 'CONFIG' && (
                  <motion.div
                    key="config"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="max-w-4xl mx-auto space-y-12"
                  >
                    <div className="text-center space-y-4">
                      <h3 className="text-5xl font-black tracking-tight text-zinc-900">Configuration ALIA</h3>
                      <p className="text-zinc-500 font-medium">Préparez votre session 3D</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-10">
                      {/* Product */}
                      <div className="bg-white p-10 rounded-[3.5rem] border border-zinc-100 shadow-xl space-y-8">
                        <div className="flex items-center gap-4">
                          <div className="p-4 bg-blue-50 text-blue-600 rounded-[1.5rem]">
                            <Database className="w-7 h-7" />
                          </div>
                          <div>
                            <label className="text-xl font-black block">Produit</label>
                            <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Base médicale</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {products.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => setSelectedProduct(p)}
                              className={cn(
                                'w-full text-left p-6 rounded-3xl border-2 transition-all',
                                selectedProduct?.id === p.id
                                  ? 'border-blue-600 bg-blue-50 shadow-lg scale-[1.02]'
                                  : 'border-zinc-50 hover:border-zinc-200 opacity-60',
                              )}
                            >
                              <p className="font-black text-lg">{p.name}</p>
                              <p className="text-sm text-zinc-500 mt-1">{p.indication}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Profile */}
                      <div className="bg-white p-10 rounded-[3.5rem] border border-zinc-100 shadow-xl space-y-8">
                        <div className="flex items-center gap-4">
                          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-[1.5rem]">
                            <Stethoscope className="w-7 h-7" />
                          </div>
                          <div>
                            <label className="text-xl font-black block">Profil</label>
                            <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Simulation</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {HEALTHCARE_PROFILES.map((prof) => (
                            <button
                              key={prof.id}
                              onClick={() => setSelectedProfile(prof.id)}
                              className={cn(
                                'w-full flex items-center justify-between p-6 rounded-3xl border-2 transition-all',
                                selectedProfile === prof.id
                                  ? 'border-emerald-600 bg-emerald-50'
                                  : 'border-zinc-50 hover:border-zinc-200 opacity-60',
                              )}
                            >
                              <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-wider mb-1 opacity-40">{prof.specialty}</p>
                                <p className="font-black text-lg leading-tight">{prof.label}</p>
                              </div>
                              <div
                                className={cn(
                                  'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                                  selectedProfile === prof.id ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-zinc-200',
                                )}
                              >
                                {selectedProfile === prof.id && <ChevronRight className="w-4 h-4" />}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Language */}
                    <div className="bg-white p-8 rounded-[3rem] border border-zinc-100 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                          <Globe className="w-6 h-6" />
                        </div>
                        <p className="font-black text-xl">Langue</p>
                      </div>
                      <div className="flex gap-3">
                        {LANGUAGES.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => setLanguage(lang.code)}
                            className={cn(
                              'px-8 py-4 rounded-2xl font-black text-sm transition-all',
                              language === lang.code ? 'bg-zinc-900 text-white shadow-2xl' : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100',
                            )}
                          >
                            {lang.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-center pt-8">
                      <button
                        onClick={startSession}
                        className="bg-blue-600 text-white px-12 py-5 rounded-[2rem] font-bold text-xl flex items-center gap-4 hover:bg-blue-700 hover:shadow-2xl transition-all"
                      >
                        Démarrer ALIA
                        <ArrowRight className="w-6 h-6" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* SESSION */}
                {appState === 'SESSION' && (
                  <motion.div
                    key="session"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid lg:grid-cols-5 gap-6"
                  >
                    {/* Left panel */}
                    <div className="lg:col-span-1 space-y-4 hidden lg:block">
                      <div className="bg-white p-7 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-5">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <FileText className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Référence</span>
                        </div>
                        <h4 className="text-2xl font-black text-blue-600 tracking-tight">{selectedProduct?.name}</h4>
                        <div className="space-y-4 text-sm">
                          <div>
                            <p className="font-black text-zinc-400 text-[10px] uppercase tracking-wider">Indication</p>
                            <p className="mt-1.5 leading-relaxed text-zinc-600 font-medium">{selectedProduct?.indication}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Center */}
                    <div className="lg:col-span-3 flex flex-col gap-6">
                      {/* 3D Avatar with lip-sync */}
                      <ThreeAvatar
                        isSpeaking={isSpeaking}
                        volume={avatarVolume}
                        modelUrl={customModelUrl}
                      />

                      <div className="bg-white border border-zinc-100 rounded-[3rem] p-7 flex flex-col gap-4 min-h-[300px]">
                        <div className="flex-1 overflow-y-auto space-y-6 px-4">
                          {history.filter((m) => m.role !== 'system').map((msg, i) => (
                            <div
                              key={i}
                              className={cn(
                                'flex flex-col gap-2 max-w-[85%]',
                                msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start',
                              )}
                            >
                              <div
                                className={cn(
                                  'px-6 py-4 rounded-[2rem] text-[15px] leading-relaxed font-medium shadow-sm',
                                  msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-zinc-50 text-zinc-800 border border-zinc-100 rounded-tl-none',
                                )}
                              >
                                {msg.content}
                              </div>
                              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">
                                {msg.role === 'user' ? 'Vous' : 'ALIA'} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                          {isProcessing && (
                            <div className="flex gap-3 items-center text-zinc-400 text-xs ml-6 font-semibold">
                              <div className="flex gap-1">
                                {[0, 1, 2].map((i) => (
                                  <motion.div
                                    key={i}
                                    animate={{ scale: [1, 1.5, 1] }}
                                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                                    className="w-1.5 h-1.5 bg-blue-500 rounded-full"
                                  />
                                ))}
                              </div>
                              ALIA prépare sa réponse...
                            </div>
                          )}
                        </div>

                        <div className="flex gap-4 p-2">
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              value={userInput}
                              onChange={(e) => setUserInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                              placeholder="Interagissez avec ALIA..."
                              className="w-full bg-zinc-50 border border-zinc-100 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100/50 rounded-[2rem] px-8 py-5 text-sm font-semibold transition-all"
                            />
                            <button
                              className={cn(
                                'absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all',
                                isListening ? 'bg-emerald-500 text-white shadow-lg animate-pulse' : 'text-zinc-400 hover:text-blue-600 bg-white/50',
                              )}
                              onMouseDown={startListening}
                              onMouseUp={stopListening}
                            >
                              <Mic className="w-5 h-5" />
                            </button>
                          </div>
                          <button
                            onClick={() => handleSendMessage()}
                            disabled={isProcessing || !userInput.trim()}
                            className="bg-zinc-900 text-white px-8 rounded-[2rem] shadow-xl hover:bg-black transition-all disabled:opacity-30"
                          >
                            <ChevronRight className="w-7 h-7" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right panel */}
                    <div className="lg:col-span-1 flex flex-col gap-4">
                      <input type="file" id="avatar-upload" className="hidden" accept=".glb,.gltf" onChange={handleFileUpload} />
                      <label
                        htmlFor="avatar-upload"
                        className="w-full bg-blue-50 text-blue-600 border border-blue-100 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-all cursor-pointer text-sm"
                      >
                        <Database className="w-5 h-5" />
                        Changer Modèle 3D
                      </label>
                      <button
                        onClick={stopSession}
                        className="w-full bg-red-50 text-red-600 border border-red-100 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-all"
                      >
                        <LogOut className="w-5 h-5" />
                        {mode === 'TRAINING' ? 'Terminer & Évaluer' : 'Quitter'}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* EVALUATION */}
                {appState === 'EVALUATION' && evaluation && (
                  <motion.div
                    key="eval"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="max-w-5xl mx-auto space-y-8"
                  >
                    <div className="flex items-center justify-between bg-white p-8 rounded-[3rem] border border-zinc-200 shadow-xl">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-blue-600">Synthèse</h3>
                        <p className="text-4xl font-bold tracking-tighter">Évaluation terminée</p>
                      </div>
                      <div className="relative">
                        <svg className="w-40 h-40 transform -rotate-90">
                          <circle cx="80" cy="80" r="70" fill="none" stroke="#f4f4f5" strokeWidth="12" />
                          <motion.circle
                            cx="80"
                            cy="80"
                            r="70"
                            fill="none"
                            stroke="#2563eb"
                            strokeWidth="12"
                            strokeDasharray="440"
                            initial={{ strokeDashoffset: 440 }}
                            animate={{ strokeDashoffset: 440 - (440 * evaluation.globalScore) / 100 }}
                            transition={{ duration: 1.5, ease: 'easeOut' }}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-5xl font-black text-blue-600">{evaluation.globalScore}</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Score</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-4 gap-6">
                      {[
                        { label: 'Clarté', score: evaluation.clarity, icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Exactitude', score: evaluation.accuracy, icon: BarChart3, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Conformité', score: evaluation.compliance, icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Objections', score: evaluation.objectionHandling, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
                      ].map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-zinc-100 flex flex-col items-center gap-4 text-center shadow-sm">
                          <div className={cn('p-4 rounded-2xl', stat.bg, stat.color)}>
                            <stat.icon className="w-8 h-8" />
                          </div>
                          <div>
                            <p className="text-3xl font-black">{stat.score}</p>
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">{stat.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="bg-white p-12 rounded-[3.5rem] border border-zinc-100 shadow-xl space-y-10">
                        <div>
                          <h4 className="text-3xl font-black flex items-center gap-4 text-zinc-900">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                              <Award className="w-8 h-8" />
                            </div>
                            Points Forts
                          </h4>
                        </div>
                        <ul className="space-y-6">
                          {evaluation.feedback.strengths.map((s, i) => (
                            <li key={i} className="flex gap-5 items-start">
                              <div className="mt-2 w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0 shadow-lg" />
                              <p className="text-xl font-bold text-zinc-800 leading-snug">{s}</p>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-zinc-950 text-white p-12 rounded-[3.5rem] shadow-2xl space-y-10 border border-zinc-800">
                        <div>
                          <h4 className="text-3xl font-black flex items-center gap-4">
                            <div className="p-3 bg-white/10 text-white rounded-2xl">
                              <TrendingUp className="w-8 h-8" />
                            </div>
                            Opportunités
                          </h4>
                        </div>
                        <ul className="space-y-6">
                          {evaluation.feedback.recommendations.map((r, i) => (
                            <li key={i} className="flex gap-5 items-start">
                              <div className="mt-1 w-6 h-6 flex items-center justify-center bg-blue-600/20 text-blue-400 rounded-full flex-shrink-0">
                                <ArrowRight className="w-4 h-4" />
                              </div>
                              <p className="text-xl font-semibold text-zinc-200 leading-snug">{r}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex justify-center pt-16">
                      <button
                        onClick={() => setAppState('IDLE')}
                        className="bg-blue-600 text-white px-16 py-6 rounded-[2.5rem] font-black text-2xl flex items-center gap-5 hover:bg-blue-700 transition-all shadow-2xl"
                      >
                        <Calendar className="w-6 h-6" />
                        Nouvelle Simulation
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
