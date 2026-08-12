import { useState, useCallback, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import { createXRStore, XR } from '@react-three/xr';
import { Rocket, Settings, SlidersHorizontal, X } from 'lucide-react';
import { SolarSystem } from './components/SolarSystem';
import { FactModal } from './components/FactModal';
import { getPlanetFact } from './lib/gemini';
import { speak, stopSpeaking } from './lib/speech';
import * as THREE from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { PLANETS, SUN_FACT } from './constants/planets';
import { ErrorBoundary } from './components/ErrorBoundary';

// Check if window is defined to avoid SSR issues with XR
const store = createXRStore();

export default function App() {
  const [selectedPlanet, setSelectedPlanet] = useState<{ id: string; name: string } | null>(null);
  const [shortFact, setShortFact] = useState<string | null>(null);
  const [fact, setFact] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  
  const [sceneScale, setSceneScale] = useState(1);
  const [uiScale, setUiScale] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  
  const controlsRef = useRef<any>(null);

  const handlePlanetClick = useCallback(async (id: string, name: string, position?: THREE.Vector3) => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 150);

    if (position && controlsRef.current) {
      const isSun = id === 'Sun';
      const planetData = PLANETS.find(p => p.name === id);
      const pSize = isSun ? 0.4 : (planetData?.size || 0.05);
      
      // Move camera close enough depending on the planet size
      const offset = isSun ? pSize * 6 : pSize * 4.5 + 0.05;
      
      // Slightly shift target so planet is not covered by modal on desktop
      controlsRef.current.setLookAt(
        position.x + offset, 
        position.y + offset * 0.3, 
        position.z + offset,
        position.x, position.y, position.z,
        true
      );
    }

    setSelectedPlanet({ id, name });
    setIsPaused(true);
    setFact(null);
    stopSpeaking();
    
    // Set short fact immediately
    let initialFact = '';
    if (id === 'Sun') {
      initialFact = SUN_FACT;
      setShortFact(initialFact);
    } else {
      const planetData = PLANETS.find(p => p.name === id); // `id` coming from solar system is actually the english Name
      if (planetData) {
        initialFact = planetData.shortFact;
        setShortFact(initialFact);
      } else {
        setShortFact(null);
      }
    }
  }, []);

  const handleGenerateMore = useCallback(async () => {
    if (!selectedPlanet) return;
    setIsLoading(true);
    const newFact = await getPlanetFact(selectedPlanet.name);
    setFact(newFact);
    setIsLoading(false);
    
    // Auto-play the full fact
    speak(newFact);
  }, [selectedPlanet]);

  const handleCloseModal = useCallback(() => {
    setSelectedPlanet(null);
    setIsPaused(false);
    setShortFact(null);
    setFact(null);
    stopSpeaking();
    
    // Reset camera position loosely
    if (controlsRef.current) {
      controlsRef.current.setTarget(0, 0, 0, true);
      controlsRef.current.setLookAt(0, 2, 8, 0, 0, 0, true);
    }
  }, []);

  return (
    <div className="w-full h-screen overflow-hidden bg-slate-900 font-sans">
      {/* UI Overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 flex flex-col items-center justify-between pointer-events-none p-8">
        <div className="bg-black/40 backdrop-blur-xl px-10 py-6 rounded-2xl border border-white/10 shadow-2xl text-center pointer-events-auto">
          <h1 className="text-3xl md:text-5xl font-light tracking-wider text-white/90 uppercase mb-3">
            კოსმოსური სიმულაცია
          </h1>
          <p className="text-white/50 text-sm md:text-base font-medium tracking-widest uppercase">
            აირჩიეთ ციური სხეული ასტროფიზიკური მონაცემებისთვის
          </p>
        </div>
      </div>

      {/* Settings Toggle Button */}
      <button 
        onClick={() => setShowSettings(!showSettings)} 
        className="absolute top-8 right-8 z-30 p-4 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 text-white transition-all shadow-xl"
      >
        <Settings className="w-6 h-6 opacity-80" />
      </button>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-28 right-8 z-30 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl w-80 text-white/90">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-light tracking-widest uppercase text-sm flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 opacity-70" />
              პარამეტრები
            </h3>
            <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-4 h-4 opacity-60" />
            </button>
          </div>
          
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 text-xs font-light uppercase tracking-wider">
              <label className="flex justify-between items-center">
                <span className="opacity-80">სიმულაციის მასშტაბი</span>
                <span className="font-medium bg-white/10 px-2 py-1 rounded">{sceneScale.toFixed(1)}x</span>
              </label>
              <input 
                type="range" min="0.1" max="3" step="0.1" 
                value={sceneScale} onChange={(e) => setSceneScale(parseFloat(e.target.value))}
                className="w-full accent-white h-1 bg-white/20 rounded-full appearance-none outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
            
            <div className="flex flex-col gap-3 text-xs font-light uppercase tracking-wider">
              <label className="flex justify-between items-center">
                <span className="opacity-80">UI მასშტაბი</span>
                <span className="font-medium bg-white/10 px-2 py-1 rounded">{uiScale.toFixed(1)}x</span>
              </label>
              <input 
                type="range" min="0.5" max="2" step="0.1" 
                value={uiScale} onChange={(e) => setUiScale(parseFloat(e.target.value))}
                className="w-full accent-white h-1 bg-white/20 rounded-full appearance-none outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          </div>
        </div>
      )}

      {/* AR Button Container */}
      <div className="absolute bottom-12 left-0 right-0 z-20 flex justify-center pointer-events-none">
        <button
          onClick={() => store.enterAR()}
          className="pointer-events-auto flex items-center gap-3 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/20 text-white/90 px-8 py-3 rounded-full font-light text-lg transition-all outline-none shadow-2xl"
        >
          <Rocket className="w-5 h-5 opacity-70" />
          <span className="tracking-widest uppercase text-sm">AR პროექცია</span>
        </button>
      </div>

      <FactModal
        isOpen={!!selectedPlanet}
        planetName={selectedPlanet?.id || ''}
        georgianName={selectedPlanet?.name || ''}
        shortFact={shortFact}
        fact={fact}
        isLoading={isLoading}
        onClose={handleCloseModal}
        onGenerateMore={handleGenerateMore}
        uiScale={uiScale}
      />

      <ErrorBoundary>
        <Canvas camera={{ position: [0, 2, 8], fov: 60 }} className="touch-none" gl={{ localClippingEnabled: true }}>
          <XR store={store}>
            <Suspense fallback={null}>
              <group scale={sceneScale}>
                <SolarSystem onPlanetClick={handlePlanetClick} isPaused={isPaused} isShaking={isShaking} />
              </group>
            </Suspense>
          </XR>
          <CameraControls 
            ref={controlsRef} 
            maxDistance={50} 
            minDistance={0.1} 
            makeDefault 
          />
          <ErrorBoundary fallback={null}>
            <EffectComposer disableNormalPass>
              <Bloom luminanceThreshold={1.5} mipmapBlur intensity={0.6} />
            </EffectComposer>
          </ErrorBoundary>
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}
