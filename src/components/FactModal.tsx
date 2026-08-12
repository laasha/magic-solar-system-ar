import { motion, AnimatePresence } from 'motion/react';
import { Volume2, X, AlertCircle, Sparkles } from 'lucide-react';
import { speak, stopSpeaking } from '../lib/speech';

interface FactModalProps {
  isOpen: boolean;
  planetName: string;
  georgianName: string;
  shortFact: string | null;
  fact: string | null;
  isLoading: boolean;
  onClose: () => void;
  onGenerateMore: () => void;
  uiScale?: number;
}

export function FactModal({ isOpen, georgianName, shortFact, fact, isLoading, onClose, onGenerateMore, uiScale = 1 }: FactModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:justify-end p-4 md:p-8 pointer-events-none"
        >
          <motion.div
            initial={{ scale: uiScale * 0.8, x: 50, opacity: 0 }}
            animate={{ scale: uiScale, x: 0, opacity: 1 }}
            exit={{ scale: uiScale * 0.8, x: 50, opacity: 0 }}
            className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative overflow-hidden text-white pointer-events-auto"
          >
            {/* Minimal top accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/20" />
            
            <button
              onClick={() => {
                stopSpeaking();
                onClose();
              }}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/50" />
            </button>

            <div className="text-center mt-4">
              <h2 className="text-3xl font-light tracking-wide text-white/90 mb-6 uppercase">
                {georgianName}
              </h2>

              <div className="max-h-[50vh] overflow-y-auto min-h-[120px] flex flex-col items-center p-2 pr-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {shortFact && (
                  <p className="text-lg text-white/80 font-light leading-relaxed text-justify mb-6">
                    {shortFact}
                  </p>
                )}
                
                {isLoading ? (
                  <div className="flex flex-col items-center gap-4 py-4">
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                    <p className="text-white/50 text-sm tracking-widest uppercase">მონაცემების სინთეზი...</p>
                  </div>
                ) : fact ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-4 border-t border-white/10 w-full"
                  >
                    <div className="text-base text-white/70 font-light leading-relaxed text-justify whitespace-pre-wrap">
                      {fact}
                    </div>
                  </motion.div>
                ) : null}
              </div>

              <div className="flex flex-wrap justify-center gap-3 mt-6">
                {!fact && (
                  <button
                    onClick={onGenerateMore}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white/90 px-6 py-2.5 rounded-full font-light tracking-wider text-sm transition-all border border-white/10 disabled:opacity-50"
                  >
                     <Sparkles className="w-4 h-4 opacity-70" />
                     <span className="uppercase">დამატებითი ინფორმაცია</span>
                  </button>
                )}
                
                {(shortFact || fact) && !isLoading && (
                  <button
                    onClick={() => speak(fact || shortFact || '')}
                    className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/15 text-white/90 px-6 py-2.5 rounded-full font-light tracking-wider text-sm transition-all border border-white/5"
                  >
                    <Volume2 className="w-4 h-4 opacity-70" />
                    <span className="uppercase">აუდიო</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
