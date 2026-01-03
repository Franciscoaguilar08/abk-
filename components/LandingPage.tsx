
import React from 'react';
import { Scan, Dna, ArrowRight, Activity, ShieldCheck, Cpu, Network } from 'lucide-react';
import { BioBackground } from './BioBackground';

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-[#020617] flex flex-col font-inter selection:bg-cyan-500 selection:text-white">
      
      {/* Plexus Background */}
      <BioBackground variant="landing" />

      {/* Decorative Background Textures - Enhanced */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#020617_90%)] pointer-events-none z-0"></div>
      
      {/* Ambient Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>

      {/* === MAIN LAYOUT CONTAINER (Prevents Overlap) === */}
      <div className="relative z-20 flex-grow flex flex-col items-center justify-center w-full max-w-7xl mx-auto px-4 py-12 md:py-0">
        
        {/* TOP SPACER */}
        <div className="flex-grow-[1] hidden md:block"></div>

        {/* --- CENTER CONTENT --- */}
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto relative">
            
            {/* 1. System Badge - Enhanced */}
            <div className="mb-8 animate-fade-in-up flex items-center gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 backdrop-blur-md shadow-[0_0_20px_rgba(34,211,238,0.15)]">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                    </span>
                    <span className="text-[10px] font-mono text-cyan-200 tracking-widest uppercase font-bold">
                        Sistema Activo v3.0
                    </span>
                </div>
                <div className="hidden md:flex h-px w-12 bg-gradient-to-r from-cyan-500/50 to-transparent"></div>
            </div>

            {/* 2. Headline - Updated Text & Styling */}
            <div className="relative mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <h1 className="text-5xl md:text-7xl lg:text-9xl font-bold text-white tracking-tighter font-brand leading-[0.95] z-10 relative">
                  MEDICINA DE <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-emerald-300 animate-shine drop-shadow-[0_0_25px_rgba(34,211,238,0.3)]">
                    PRECISIÓN
                  </span>
                </h1>
                
                {/* Decorative Elements around Title */}
                <div className="absolute -left-12 top-0 opacity-20 pointer-events-none hidden md:block">
                    <Cpu className="w-16 h-16 text-cyan-500 animate-[spin-slow_30s_linear_infinite]" />
                </div>
                 <div className="absolute -right-12 bottom-0 opacity-20 pointer-events-none hidden md:block">
                    <Network className="w-16 h-16 text-emerald-500 animate-[pulse_5s_ease-in-out_infinite]" />
                </div>
            </div>

            {/* 3. Description - Updated Text */}
            <div className="mb-14 max-w-2xl mx-auto animate-fade-in-up relative" style={{ animationDelay: '0.2s' }}>
                 <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent opacity-50 hidden md:block"></div>
                <p className="text-slate-300 text-lg md:text-xl font-light leading-relaxed">
                   Plataforma de simulación biológica personalizada. <br className="hidden md:block"/>
                   Ingresa tu información genética para acceder a <span className="text-white font-medium">predicciones de salud en tiempo real</span>.
                </p>
                 <div className="absolute -right-4 top-0 w-1 h-full bg-gradient-to-b from-transparent via-emerald-500/50 to-transparent opacity-50 hidden md:block"></div>
            </div>

            {/* 4. THE BUTTON (Preserved & Polished) */}
            <div className="w-full max-w-md animate-fade-in-up relative z-30" style={{ animationDelay: '0.3s' }}>
                <button 
                    onClick={onEnter}
                    className="group relative w-full h-24 bg-[#050b14]/80 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-cyan-500/50 transition-all duration-500 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                >
                    {/* Hover Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/40 via-blue-900/40 to-emerald-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    
                    {/* Scan Beam */}
                    <div className="absolute top-0 bottom-0 w-[3px] bg-cyan-400 shadow-[0_0_20px_#22d3ee] left-0 opacity-0 group-hover:opacity-100 group-hover:animate-[scan-fast_1.5s_cubic-bezier(0.4,0,0.2,1)_infinite]"></div>

                    <div className="absolute inset-0 flex items-center justify-between px-8">
                        {/* LEFT: Icon & Text */}
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-cyan-500 blur opacity-20 group-hover:opacity-60 transition-opacity"></div>
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-black border border-white/10 flex items-center justify-center relative z-10 group-hover:scale-105 transition-transform duration-300 group-hover:border-cyan-500/50">
                                    <Scan className="w-6 h-6 text-cyan-400" />
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-start text-left">
                                <span className="text-white font-bold tracking-[0.1em] text-xl group-hover:text-cyan-50 transition-colors font-brand">
                                    INICIAR SIMULACIÓN
                                </span>
                                <span className="text-[10px] font-mono text-slate-500 group-hover:text-cyan-300 transition-colors flex items-center gap-2 uppercase tracking-wider mt-1">
                                    <Activity className="w-3 h-3" />
                                    Engine Ready
                                </span>
                            </div>
                        </div>

                        {/* RIGHT: Arrow */}
                        <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all">
                            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-300" />
                        </div>
                    </div>

                    {/* Tech Corners */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500/30 rounded-tl-lg group-hover:border-cyan-400 transition-colors"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-500/30 rounded-br-lg group-hover:border-emerald-400 transition-colors"></div>
                </button>
                
                {/* Security Badge below button */}
                 <div className="mt-6 flex justify-center gap-6 text-[10px] text-slate-600 font-mono tracking-widest uppercase">
                    <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> HIPAA Compliant</span>
                    <span className="flex items-center gap-1.5"><Dna className="w-3 h-3" /> Genomic Encryption</span>
                </div>
            </div>

        </div>

        {/* BOTTOM SPACER */}
        <div className="flex-grow-[1]"></div>

      </div>

      {/* === FOOTER (Static Flow, No Overlap) === */}
      <div className="relative z-20 w-full border-t border-white/5 bg-[#020617]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap justify-between items-center gap-6">
            
            <div className="flex gap-8 md:gap-16">
                <MetricItem 
                    label="LATENCY" 
                    value="< 15ms" 
                    color="text-emerald-400" 
                />
                <MetricItem 
                    label="DATABASE" 
                    value="CLINVAR / GNOMAD" 
                    color="text-cyan-400" 
                />
                 <MetricItem 
                    label="AI MODEL" 
                    value="GEMINI 3.0" 
                    color="text-violet-400" 
                />
            </div>

            <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-slate-600">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                NODE STATUS: ONLINE
            </div>
        </div>
      </div>

      <style>{`
        .animate-shine {
            background-size: 200% auto;
            animation: shine 4s linear infinite;
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
const MetricItem = ({ label, value, color }: { label: string, value: string, color: string }) => (
    <div className="flex flex-col">
        <span className="text-[9px] font-mono text-slate-500 tracking-widest leading-none mb-1.5">{label}</span>
        <span className={`text-xs font-bold font-mono ${color} transition-colors leading-none`}>{value}</span>
    </div>
);
