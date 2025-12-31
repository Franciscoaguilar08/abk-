import React from 'react';
import { Scan, Dna, ArrowRight, Fingerprint, ChevronRight, Activity, Globe2, ShieldCheck } from 'lucide-react';
import { BioBackground } from './BioBackground';

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-[#020617] flex flex-col font-inter selection:bg-cyan-500 selection:text-white">
      
      {/* Plexus Background */}
      <BioBackground variant="landing" />

      {/* Decorative Background Textures */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.02)_1px,transparent_1px)] bg-[size:100%_120px] pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,#020617_90%)] pointer-events-none z-0"></div>

      {/* === MAIN LAYOUT CONTAINER (Prevents Overlap) === */}
      <div className="relative z-20 flex-grow flex flex-col items-center justify-center w-full max-w-7xl mx-auto px-4 py-12 md:py-0">
        
        {/* TOP SPACER (For vertical balance) */}
        <div className="flex-grow-[1] hidden md:block"></div>

        {/* --- CENTER CONTENT --- */}
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
            
            {/* 1. System Badge */}
            <div className="mb-8 animate-fade-in-up">
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-950/20 backdrop-blur-md shadow-[0_0_30px_rgba(34,211,238,0.05)]">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[11px] font-mono text-cyan-200 tracking-[0.25em] uppercase font-semibold">
                        ABK Genomics Core v2.4
                    </span>
                </div>
            </div>

            {/* 2. Headline */}
            <div className="relative mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <h1 className="text-5xl md:text-8xl lg:text-9xl font-bold text-white tracking-tighter font-brand leading-[0.9]">
                  MEDICINA DE <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyan-200 via-white to-slate-400 animate-shine relative z-10 drop-shadow-2xl">
                    PRECISIÓN
                  </span>
                </h1>
                
                {/* Decorative DNA (Fixed Position relative to title) */}
                <div className="absolute -right-4 -top-8 md:-right-16 md:-top-6 opacity-20 pointer-events-none z-0 mix-blend-screen">
                    <Dna className="w-20 h-20 md:w-36 md:h-36 text-cyan-500 animate-[spin-slow_20s_linear_infinite]" />
                </div>
            </div>

            {/* 3. Description */}
            <div className="mb-14 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <p className="text-slate-400 text-sm md:text-lg font-light leading-relaxed">
                   Plataforma de simulación biológica mediante <span className="text-cyan-200 font-medium border-b border-cyan-500/30 pb-0.5">Gemelo Digital</span>. 
                   Análisis estructural, farmacogenómica y predicción oncológica en tiempo real.
                </p>
            </div>

            {/* 4. THE BUTTON (Improved & Clean) */}
            <div className="w-full max-w-md animate-fade-in-up relative z-30" style={{ animationDelay: '0.3s' }}>
                <button 
                    onClick={onEnter}
                    className="group relative w-full h-20 bg-[#050b14] rounded-2xl border border-white/10 hover:border-cyan-500/50 transition-all duration-500 overflow-hidden shadow-2xl"
                >
                    {/* Hover Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/20 via-blue-900/20 to-cyan-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Scan Beam */}
                    <div className="absolute top-0 bottom-0 w-[2px] bg-cyan-400 shadow-[0_0_15px_#22d3ee] left-0 opacity-0 group-hover:opacity-100 group-hover:animate-[scan-fast_1.5s_ease-in-out_infinite]"></div>

                    <div className="absolute inset-0 flex items-center justify-between px-8">
                        {/* LEFT: Icon & Text */}
                        <div className="flex items-center gap-5">
                            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover:scale-110 transition-transform duration-300">
                                <Scan className="w-5 h-5 text-cyan-400" />
                            </div>
                            
                            <div className="flex flex-col items-start">
                                <span className="text-white font-bold tracking-[0.15em] text-lg group-hover:text-cyan-100 transition-colors">
                                    INICIAR ANÁLISIS
                                </span>
                                <span className="text-[10px] font-mono text-slate-500 group-hover:text-cyan-400 transition-colors flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    SYSTEM READY
                                </span>
                            </div>
                        </div>

                        {/* RIGHT: Arrow */}
                        <div className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                            <ArrowRight className="w-5 h-5 text-cyan-400" />
                        </div>
                    </div>

                    {/* Tech Corners */}
                    <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-500/30 rounded-tl-xl"></div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-500/30 rounded-br-xl"></div>
                </button>
            </div>

        </div>

        {/* BOTTOM SPACER (Ensures separation) */}
        <div className="flex-grow-[1]"></div>

      </div>

      {/* === FOOTER (Static Flow, No Overlap) === */}
      <div className="relative z-20 w-full border-t border-white/5 bg-[#020617]/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-wrap justify-center md:justify-between items-center gap-6">
            
            <div className="flex gap-8 md:gap-12">
                <MetricItem 
                    icon={Activity}
                    label="LATENCY" 
                    value="12ms" 
                    color="text-emerald-400" 
                />
                <MetricItem 
                    icon={ShieldCheck}
                    label="ENCRYPTION" 
                    value="AES-256" 
                    color="text-cyan-400" 
                />
                <MetricItem 
                    icon={Globe2}
                    label="DATABASE" 
                    value="GNOMAD v4" 
                    color="text-violet-400" 
                />
            </div>

            <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-slate-600">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                SERVER STATUS: ONLINE
            </div>
        </div>
      </div>

      <style>{`
        .animate-shine {
            background-size: 200% auto;
            animation: shine 5s linear infinite;
        }
        @keyframes shine {
            to { background-position: 200% center; }
        }
        @keyframes scan-fast {
            0% { left: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { left: 100%; opacity: 0; }
        }
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Helper for Footer Metrics
const MetricItem = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) => (
    <div className="flex items-center gap-3 group cursor-default">
        <Icon className={`w-4 h-4 ${color} opacity-50 group-hover:opacity-100 transition-opacity`} />
        <div className="flex flex-col">
            <span className="text-[9px] font-mono text-slate-500 tracking-widest leading-none mb-1">{label}</span>
            <span className="text-xs font-bold font-brand text-slate-300 group-hover:text-white transition-colors leading-none">{value}</span>
        </div>
    </div>
);
