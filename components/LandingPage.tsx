import React from 'react';
import { Dna, Fingerprint, Activity } from 'lucide-react';
import { SciFiButton } from './SciFiButton';
import { BioBackground } from './BioBackground';

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#020617] flex flex-col items-center justify-center font-inter selection:bg-violet-500 selection:text-white">
      
      {/* Shared Dynamic Background - Active Mode */}
      <BioBackground variant="landing" />

      {/* Main Content */}
      <div className="relative z-20 text-center px-4 max-w-5xl mx-auto flex flex-col items-center">
        
        {/* Holographic Logo Container */}
        <div className="mb-10 relative group perspective-[1000px]">
            <div className="absolute inset-0 bg-violet-600/30 blur-[60px] rounded-full group-hover:bg-violet-500/50 transition-all duration-700"></div>
            
            <div className="relative w-32 h-32 bg-slate-950/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(139,92,246,0.3)] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-y-12">
                {/* Rotating Rings */}
                <div className="absolute inset-0 border border-cyan-500/30 rounded-full animate-[spin-slow_10s_linear_infinite]"></div>
                <div className="absolute inset-2 border border-violet-500/30 rounded-full animate-[spin-slow_15s_linear_infinite_reverse]"></div>
                
                <Dna className="w-14 h-14 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                
                <div className="absolute -bottom-2 -right-2 bg-black border border-emerald-500/50 p-2 rounded-lg shadow-lg">
                    <Fingerprint className="w-6 h-6 text-emerald-400" />
                </div>
            </div>
        </div>

        {/* Text */}
        <div className="space-y-6 mb-12">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-violet-500/30 backdrop-blur-sm shadow-lg">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-mono text-emerald-300 tracking-widest uppercase">System Online</span>
             </div>

            <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tighter font-brand drop-shadow-2xl">
              ABK <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 animate-gradient-x">GENOMICS</span>
            </h1>
            
            <p className="text-slate-300 text-lg md:text-2xl max-w-3xl mx-auto font-light leading-relaxed">
              Activate your <strong className="text-white font-medium border-b border-cyan-500/50 pb-0.5">Digital Twin</strong>. 
              Real-time structural mapping and biophysical AI analysis.
            </p>
        </div>

        {/* Sci-Fi Button */}
        <div className="transform transition-transform hover:scale-105 duration-300">
            <SciFiButton onClick={onEnter} className="text-lg">
                INITIALIZE SYSTEM
                <Activity className="w-5 h-5 animate-pulse" />
            </SciFiButton>
        </div>
        
        {/* Footer Metrics */}
        <div className="mt-20 grid grid-cols-3 gap-8 md:gap-16 border-t border-white/5 pt-8 text-slate-500 font-mono text-xs uppercase tracking-[0.2em]">
            <div className="flex flex-col gap-1 items-center">
                <span className="text-violet-400 font-bold text-lg">3B+</span>
                <span>Base Pairs</span>
            </div>
            <div className="flex flex-col gap-1 items-center">
                <span className="text-cyan-400 font-bold text-lg">0ms</span>
                <span>Latency</span>
            </div>
            <div className="flex flex-col gap-1 items-center">
                <span className="text-emerald-400 font-bold text-lg">100%</span>
                <span>Secure</span>
            </div>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .animate-gradient-x {
            background-size: 200% 200%;
            animation: gradient-move 3s ease infinite;
        }
        @keyframes gradient-move {
            0% { background-position: 0% 50% }
            50% { background-position: 100% 50% }
            100% { background-position: 0% 50% }
        }
      `}</style>
    </div>
  );
};