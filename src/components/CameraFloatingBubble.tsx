/**
 * Bulle flottante avec caméra utilisateur
 * Affiche le flux vidéo avec un filtre "scan IA" (noir et blanc contrasté)
 */

import { useState, useRef, useEffect } from 'react';
import { Camera, Minimize2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function CameraFloatingBubble({ onStreamReady }: { onStreamReady?: (stream: MediaStream | null) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      setError(null);
      console.log('[Camera] Requesting camera access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });
      
      console.log('[Camera] Camera access granted, stream:', stream);
      
      // Set camera active first to render the video element
      setIsCameraActive(true);
      
      // Wait for next tick to ensure video element is rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          console.log('[Camera] Video element connected');
          
          // Notify parent that stream is ready
          onStreamReady?.(stream);
        } else {
          console.error('[Camera] Video ref is still null after render');
        }
      }, 100);
    } catch (err: any) {
      console.error('[Camera] Error accessing camera:', err);
      if (err.name === 'NotAllowedError') {
        setError('Permission refusée. Autorisez l\'accès à la caméra dans votre navigateur.');
      } else if (err.name === 'NotFoundError') {
        setError('Aucune caméra détectée sur cet appareil.');
      } else if (err.name === 'NotReadableError') {
        setError('La caméra est déjà utilisée par une autre application.');
      } else {
        setError(`Erreur: ${err.message || 'Impossible d\'accéder à la caméra'}`);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    
    // Notify parent that stream is stopped
    onStreamReady?.(null);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <>
      {/* Bouton flottant */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => {
            console.log('[Camera] Opening camera panel');
            setIsOpen(true);
          }}
          className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center z-50 transition-all"
        >
          <Camera className="w-7 h-7" />
        </motion.button>
      )}

      {/* Panneau caméra */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 100, y: 100 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              x: 0, 
              y: 0,
              width: isMinimized ? '80px' : '400px',
              height: isMinimized ? '80px' : '500px',
            }}
            exit={{ opacity: 0, scale: 0.8, x: 100, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden z-50 border-2 border-zinc-700"
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-zinc-900/95 to-transparent z-10 flex items-center justify-between px-4">
              {!isMinimized && (
                <>
                  <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-bold text-sm">Votre Caméra</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsMinimized(true)}
                      className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
                    >
                      <Minimize2 className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => {
                        stopCamera();
                        setIsOpen(false);
                      }}
                      className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </>
              )}
              {isMinimized && (
                <button
                  onClick={() => setIsMinimized(false)}
                  className="w-full h-full flex items-center justify-center"
                >
                  <Camera className="w-6 h-6 text-blue-400" />
                </button>
              )}
            </div>

            {/* Contenu */}
            {!isMinimized && (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 pt-16">
                {!isCameraActive ? (
                  <div className="text-center space-y-6">
                    <div className="w-24 h-24 mx-auto bg-zinc-800 rounded-full flex items-center justify-center">
                      <Camera className="w-12 h-12 text-zinc-600" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg mb-2">Caméra désactivée</h3>
                      <p className="text-zinc-400 text-sm mb-6">
                        Activez votre caméra pour vérifier votre posture et votre présentation professionnelle
                      </p>
                    </div>
                    {error && (
                      <div className="bg-red-900/30 border border-red-600 rounded-2xl p-4 text-red-300 text-sm">
                        {error}
                      </div>
                    )}
                    <button
                      onClick={startCamera}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg"
                    >
                      Activer la caméra
                    </button>
                  </div>
                ) : (
                  <div className="relative w-full h-full rounded-2xl overflow-hidden">
                    {/* Filtre "scan IA" - noir et blanc contrasté */}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{
                        filter: 'grayscale(100%) contrast(1.3) brightness(1.1)',
                        transform: 'scaleX(-1)', // Effet miroir
                      }}
                    />
                    
                    {/* Overlay scan IA */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Grille de scan */}
                      <div 
                        className="absolute inset-0 opacity-20"
                        style={{
                          backgroundImage: `
                            linear-gradient(0deg, transparent 24%, rgba(59, 130, 246, 0.3) 25%, rgba(59, 130, 246, 0.3) 26%, transparent 27%, transparent 74%, rgba(59, 130, 246, 0.3) 75%, rgba(59, 130, 246, 0.3) 76%, transparent 77%, transparent),
                            linear-gradient(90deg, transparent 24%, rgba(59, 130, 246, 0.3) 25%, rgba(59, 130, 246, 0.3) 26%, transparent 27%, transparent 74%, rgba(59, 130, 246, 0.3) 75%, rgba(59, 130, 246, 0.3) 76%, transparent 77%, transparent)
                          `,
                          backgroundSize: '50px 50px',
                        }}
                      />
                      
                      {/* Ligne de scan animée */}
                      <motion.div
                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                        animate={{ top: ['0%', '100%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      />
                      
                      {/* Coins de cadrage */}
                      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-blue-400" />
                      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-blue-400" />
                      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-blue-400" />
                      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-blue-400" />
                    </div>

                    {/* Badge "LIVE" */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      LIVE
                    </div>

                    {/* Bouton désactiver */}
                    <button
                      onClick={stopCamera}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-zinc-900/80 hover:bg-zinc-800 text-white px-6 py-2 rounded-full text-sm font-bold transition-all"
                    >
                      Désactiver
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
