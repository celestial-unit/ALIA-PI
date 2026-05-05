import React, { Suspense, useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  useGLTF,
  OrbitControls,
  Environment,
  ContactShadows,
  useAnimations,
  Float,
  MeshDistortMaterial,
} from '@react-three/drei';
import * as THREE from 'three';

interface ThreeAvatarProps {
  isSpeaking: boolean;
  volume: number;
  modelUrl?: string;
}

// ─── Exhaustive blend-shape name registry ────────────────────────────────────
// Covers Ready Player Me, Mixamo, VRoid, MetaHuman, Reallusion, custom exports
const MOUTH_OPEN_NAMES = [
  // RPM / ARKit
  'jawOpen', 'JawOpen', 'jaw_open', 'Jaw_Open',
  // Visemes
  'viseme_aa', 'viseme_AA', 'viseme_O', 'viseme_U',
  'viseme_CH', 'viseme_DD', 'viseme_E', 'viseme_FF',
  // Generic
  'mouthOpen', 'MouthOpen', 'mouth_open', 'Mouth_Open',
  'mouth_a', 'Mouth_A', 'mouth_A',
  // VRoid
  'A', 'あ',
  // Reallusion / iClone
  'Open_Mouth', 'open_mouth',
  // Blender shape keys
  'mouth.open', 'Mouth.Open',
  // MetaHuman
  'CTRL_expressions_jawOpen',
];

const MOUTH_SMILE_NAMES = [
  'mouthSmile', 'MouthSmile', 'mouth_smile',
  'viseme_I', 'viseme_E',
  'smile', 'Smile',
  'I', 'い',
];

// ─── Holographic placeholder (no GLB loaded) ─────────────────────────────────
function AvatarPlaceholder({ isSpeaking, volume }: { isSpeaking: boolean; volume: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.2) * 0.1;
      groupRef.current.position.y = Math.sin(t * 1.5) * 0.05;
    }
    if (coreRef.current) {
      const s = 1.1 + (isSpeaking ? volume * 1.5 : Math.sin(t * 2) * 0.05);
      coreRef.current.scale.set(s, s, s);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.5;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[1.4, 20, 20]} />
        <meshStandardMaterial color="#3b82f6" wireframe transparent opacity={0.2} />
      </mesh>
      <mesh ref={coreRef} position={[0, 0.4, 0]}>
        <icosahedronGeometry args={[0.7, 1]} />
        <MeshDistortMaterial
          color="#3b82f6"
          emissive="#60a5fa"
          emissiveIntensity={isSpeaking ? 12 + volume * 25 : 4}
          distort={0.4}
          speed={3}
          roughness={0}
        />
      </mesh>
      <mesh position={[0, -1, 0.5]}>
        <torusGeometry args={[0.3, 0.05, 16, 32]} />
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={2} />
      </mesh>
      <mesh ref={ringRef} rotation={[Math.PI / 2.2, 0, 0]}>
        <torusGeometry args={[2.2, 0.01, 16, 100]} />
        <meshStandardMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={8} transparent opacity={0.5} />
      </mesh>
      <mesh rotation={[Math.PI / 1.8, Math.PI / 4, 0]}>
        <torusGeometry args={[2.4, 0.005, 16, 100]} />
        <meshStandardMaterial color="#2563eb" emissive="#3b82f6" emissiveIntensity={4} transparent opacity={0.3} />
      </mesh>
      <pointLight intensity={8} distance={10} color="#3b82f6" />
      <ContactShadows opacity={0.4} scale={15} blur={2} far={10} color="#000000" />
    </group>
  );
}

// ─── GLB Model with robust lip-sync ──────────────────────────────────────────
function Model({
  url,
  volume,
  isSpeaking,
  onError,
  onBlendShapesFound,
}: {
  url: string;
  volume: number;
  isSpeaking: boolean;
  onError: () => void;
  onBlendShapesFound?: (names: string[]) => void;
}) {
  const { scene: modelScene, animations: modelAnims } = useGLTF(url, true);
  const { actions } = useAnimations(modelAnims, modelScene);

  // Refs to the specific morph target indices we'll drive
  const morphRefs = useRef<
    Array<{ mesh: THREE.Mesh; jawIdx: number; smileIdx: number }>
  >([]);
  const smoothVolRef = useRef(0);

  useEffect(() => {
    if (!modelScene) return;

    morphRefs.current = [];
    const foundNames: string[] = [];

    modelScene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh || !mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;

      const dict = mesh.morphTargetDictionary;
      const allKeys = Object.keys(dict);

      // Log all available blend shapes for debugging
      if (allKeys.length > 0) {
        console.log(`[ALIA LipSync] Mesh "${mesh.name}" blend shapes:`, allKeys);
        foundNames.push(...allKeys);
      }

      // Find jaw/mouth open index
      let jawIdx = -1;
      for (const name of MOUTH_OPEN_NAMES) {
        if (dict[name] !== undefined) {
          jawIdx = dict[name];
          console.log(`[ALIA LipSync] ✅ Using "${name}" (idx ${jawIdx}) for jaw open on "${mesh.name}"`);
          break;
        }
      }

      // Find smile/secondary mouth index
      let smileIdx = -1;
      for (const name of MOUTH_SMILE_NAMES) {
        if (dict[name] !== undefined) {
          smileIdx = dict[name];
          break;
        }
      }

      if (jawIdx !== -1) {
        morphRefs.current.push({ mesh, jawIdx, smileIdx });
      }
    });

    if (morphRefs.current.length === 0) {
      console.warn('[ALIA LipSync] ⚠️ No compatible blend shapes found. Lip-sync disabled for this model.');
      console.warn('[ALIA LipSync] Available names were:', foundNames);
    } else {
      console.log(`[ALIA LipSync] ✅ Lip-sync active on ${morphRefs.current.length} mesh(es)`);
    }

    onBlendShapesFound?.(foundNames);

    // Play idle/default animation
    const idleAction =
      actions['Armature|mixamo.com|Layer0'] ||
      actions['Idle'] ||
      actions['idle'] ||
      Object.values(actions)[0];
    if (idleAction) {
      idleAction.reset().fadeIn(0.5).play();
    }
  }, [modelScene, actions]);

  useFrame((_, delta) => {
    if (!modelScene) return;

    // Smooth the incoming volume with exponential moving average
    const targetVol = isSpeaking ? Math.min(1, volume * 1.8) : 0;
    // Fast attack (0.3), slow release (0.08) — natural speech feel
    const alpha = targetVol > smoothVolRef.current ? 0.35 : 0.1;
    smoothVolRef.current += (targetVol - smoothVolRef.current) * alpha;

    const v = smoothVolRef.current;

    for (const { mesh, jawIdx, smileIdx } of morphRefs.current) {
      const infl = mesh.morphTargetInfluences!;
      // Jaw open: direct volume mapping
      infl[jawIdx] = THREE.MathUtils.clamp(v, 0, 1);
      // Smile: subtle secondary motion at mid-volume
      if (smileIdx !== -1) {
        infl[smileIdx] = THREE.MathUtils.clamp(v * 0.4, 0, 1);
      }
    }

    // Subtle idle sway
    const t = performance.now() / 1000;
    modelScene.rotation.y = Math.sin(t * 0.4) * 0.03;
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <primitive object={modelScene} scale={2.2} position={[0, -3.4, 0]} />
    </Float>
  );
}

// ─── Error boundary ───────────────────────────────────────────────────────────
class ThreeErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.warn('[ALIA] 3D Avatar load failure:', error.message);
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function ThreeAvatar({ isSpeaking, volume, modelUrl }: ThreeAvatarProps) {
  const [useFallback, setUseFallback] = useState(false);
  const [blendShapes, setBlendShapes] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  // Reset fallback when a new model is loaded
  useEffect(() => {
    setUseFallback(false);
    setBlendShapes([]);
  }, [modelUrl]);

  return (
    <div className="w-full h-[480px] bg-black rounded-[4rem] overflow-hidden relative border border-zinc-800 shadow-2xl flex-shrink-0 group">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_#0f172a_0%,_#000000_100%)]" />
      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />
      {/* Scan line */}
      <div
        className="absolute inset-x-0 h-px bg-blue-500/30 pointer-events-none"
        style={{
          animation: 'scan 4s linear infinite',
          boxShadow: '0 0 20px rgba(59,130,246,0.6)',
          zIndex: 10,
        }}
      />

      <Canvas shadows camera={{ position: [0, 0, 5], fov: 35 }} dpr={[1, 2]}>
        <Suspense fallback={<AvatarPlaceholder isSpeaking={isSpeaking} volume={volume} />}>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={1} color="#3b82f6" />

          <ThreeErrorBoundary
            fallback={<AvatarPlaceholder isSpeaking={isSpeaking} volume={volume} />}
          >
            {modelUrl && !useFallback ? (
              <Model
                url={modelUrl}
                volume={volume}
                isSpeaking={isSpeaking}
                onError={() => setUseFallback(true)}
                onBlendShapesFound={setBlendShapes}
              />
            ) : (
              <AvatarPlaceholder isSpeaking={isSpeaking} volume={volume} />
            )}
          </ThreeErrorBoundary>

          <Environment preset="night" />
          <ContactShadows
            resolution={1024}
            scale={15}
            blur={2.5}
            opacity={0.4}
            far={10}
            color="#000000"
          />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 2.5}
            maxPolarAngle={Math.PI / 1.7}
            autoRotate
            autoRotateSpeed={0.3}
          />
        </Suspense>
      </Canvas>

      {/* HUD top-left */}
      <div className="absolute top-8 left-8 flex flex-col gap-3 z-20 pointer-events-none">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isSpeaking ? 'bg-blue-400 animate-ping' : 'bg-zinc-700'
            }`}
          />
          <span className="text-[10px] font-black text-white/50 tracking-[0.4em] uppercase">
            BIO-SYNC ACTIVE
          </span>
        </div>
        {/* Volume bars */}
        <div className="flex gap-0.5 h-4 items-end">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="w-1 rounded-full transition-all duration-75"
              style={{
                backgroundColor: isSpeaking ? 'rgba(96,165,250,0.8)' : 'rgba(59,130,246,0.25)',
                height: isSpeaking ? `${15 + Math.sin(Date.now() / 150 + i * 0.8) * 50 + volume * 35}%` : '15%',
              }}
            />
          ))}
        </div>
      </div>

      {/* Debug panel — shows available blend shapes */}
      {modelUrl && blendShapes.length > 0 && (
        <button
          onClick={() => setShowDebug((v) => !v)}
          className="absolute top-8 right-8 z-20 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 rounded-lg text-[9px] font-black text-blue-300 tracking-widest uppercase transition-all"
        >
          {showDebug ? 'Hide' : 'Debug'} Shapes
        </button>
      )}
      {showDebug && blendShapes.length > 0 && (
        <div className="absolute top-20 right-8 z-20 bg-black/80 backdrop-blur border border-zinc-700 rounded-2xl p-4 max-w-[220px] max-h-[200px] overflow-y-auto">
          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">
            Blend Shapes ({blendShapes.length})
          </p>
          {blendShapes.map((name) => (
            <p key={name} className="text-[10px] font-mono text-zinc-300 leading-relaxed">
              {name}
            </p>
          ))}
        </div>
      )}

      {/* No blend shapes warning */}
      {modelUrl && !useFallback && blendShapes.length === 0 && (
        <div className="absolute bottom-16 left-8 right-8 z-20 pointer-events-none">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2 text-[10px] text-amber-400 font-bold">
            ⚠ No blend shapes detected — lip-sync requires a model with morph targets (jawOpen, viseme_aa, etc.)
          </div>
        </div>
      )}

      {/* Branding */}
      <div className="absolute bottom-10 right-10 z-20 pointer-events-none">
        <span className="text-[10px] font-mono text-zinc-600 tracking-tighter">
          ALIA_V1.2_NEURAL_MESH
        </span>
      </div>

      {/* Corner accents */}
      <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-blue-500/20 rounded-tl-lg pointer-events-none z-20" />
      <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-blue-500/20 rounded-tr-lg pointer-events-none z-20" />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-blue-500/20 rounded-bl-lg pointer-events-none z-20" />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-blue-500/20 rounded-br-lg pointer-events-none z-20" />
    </div>
  );
}
