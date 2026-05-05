import { motion, AnimatePresence } from "framer-motion";
import { User, Volume2, VolumeX, Mic } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { cn } from "../lib/utils";

interface AvatarProps {
  isSpeaking: boolean;
  isListening: boolean;
  text?: string;
  onSpeechEnd?: () => void;
  language: string;
}

export function Avatar({ isSpeaking, isListening, text, onSpeechEnd, language }: AvatarProps) {
  const [isMuted, setIsMuted] = useState(false);

  return (
    <div className={cn(
      "relative w-full h-[550px] flex items-center justify-center rounded-[3rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-700 bg-white border border-zinc-100",
      isSpeaking && "ring-8 ring-blue-50/50"
    )}>
      {/* Pristine Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#f0f7ff_0%,_transparent_70%)]" />
      
      {/* Technical Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0066FF 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      {/* Biometric Scan Line */}
      <motion.div
        animate={{ top: ["0%", "100%", "0%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute inset-x-0 h-[2px] bg-blue-400/20 shadow-[0_0_15px_rgba(59,130,246,0.5)] z-20 pointer-events-none"
      />

      {/* Animated Aura */}
      <AnimatePresence>
        {(isSpeaking || isListening) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: isSpeaking ? 0.3 : 0.1, 
              scale: isSpeaking ? 1.6 : 1.2,
              backgroundColor: isSpeaking ? "#bfdbfe" : "#d1fae5" 
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              repeatType: "reverse" 
            }}
            className="absolute w-96 h-96 rounded-full blur-[100px]"
          />
        )}
      </AnimatePresence>

      {/* Main Avatar Container */}
      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          animate={isSpeaking ? {
            y: [0, -8, 0],
          } : {
            y: [0, -4, 0]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          {/* Scientific Rings */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-8 rounded-full border border-blue-100 opacity-60"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-12 rounded-full border border-dashed border-zinc-200 opacity-40"
          />

          <div className="w-80 h-80 rounded-full border-[12px] border-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden relative">
            <img 
              src="https://images.unsplash.com/photo-1559839734-2b71f1536783?auto=format&fit=crop&q=80&w=1000" 
              alt="ALIA Avatar" 
              className={cn(
                "w-full h-full object-cover transition-all duration-1000 grayscale-[0.2]",
                isSpeaking ? "scale-105 contrast-110" : "scale-100"
              )}
            />
            
            {/* Sophisticated Lip Sync Overlay */}
            <AnimatePresence>
              {isSpeaking && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-x-0 bottom-12 h-16 flex items-center justify-center gap-1.5"
                >
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        height: [4, Math.random() * 30 + 10, 4],
                        opacity: [0.4, 1, 0.4]
                      }}
                      transition={{ 
                        duration: 0.3 + Math.random() * 0.2, 
                        repeat: Infinity,
                      }}
                      className="w-1.5 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Speaking Mask Glow */}
            {isSpeaking && (
              <motion.div 
                animate={{ opacity: [0.05, 0.2, 0.05] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-blue-400 mix-blend-overlay pointer-events-none"
              />
            )}
          </div>
        </motion.div>

        {/* Status Indicator */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 flex items-center gap-3 px-6 py-2.5 rounded-full bg-white shadow-xl shadow-blue-900/5 border border-zinc-100"
        >
          <div className="relative">
            <div className={cn(
              "w-2.5 h-2.5 rounded-full",
              isSpeaking ? "bg-blue-600" : isListening ? "bg-emerald-500" : "bg-zinc-300"
            )} />
            {(isSpeaking || isListening) && (
              <div className={cn(
                "absolute inset-0 rounded-full animate-ping opacity-50",
                isSpeaking ? "bg-blue-400" : "bg-emerald-400"
              )} />
            )}
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-500">
            {isSpeaking ? "ALIA Transmet" : isListening ? "ALIA Analyse" : "Prête"}
          </span>
        </motion.div>
      </div>

      {/* Controls Overlay */}
      <div className="absolute top-8 right-8 flex gap-3">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/90 backdrop-blur shadow-lg border border-zinc-50 text-zinc-600 hover:text-blue-600 hover:bg-white transition-all transform hover:-translate-y-1 active:scale-95"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Subtitles Overlay */}
      <AnimatePresence>
        {isSpeaking && text && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="absolute bottom-10 left-10 right-10 flex justify-center"
          >
            <div className="bg-white/90 backdrop-blur-2xl px-10 py-6 rounded-[2.5rem] border border-white shadow-[0_25px_60px_rgba(0,0,0,0.1)] max-w-2xl">
              <p className="text-zinc-900 text-center text-lg font-bold leading-relaxed tracking-tight">
                {text}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

