import React, { useEffect, useState } from 'react';
import { Dna, ArrowRight, Fingerprint } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

interface Particle {
  id: number;
  char: string;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  color: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const chars = ['A', 'T', 'C', 'G'];
    const colors = ['text-violet-500', 'text-cyan-500', 'text-emerald-500', 'text-rose-500'];
    const count = 40; // Number of floating nucleotides
    const newParticles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        char: chars[Math.floor(Math.random() * chars.length)],
        x: Math.random() * 100, // %
        y: Math.random() * 100, // %
        size: Math.random() * 20 + 10, // px
        duration: Math.random() * 20 + 10, // seconds
        delay: Math.random() * -20, // start at random times
        opacity: Math.random() * 0.5 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    setParticles(newParticles);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#020617] flex flex-col items-center justify-center font-inter selection:bg-violet-500 selection:text-white">
      
      {/* Dynamic Background Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-violet-900/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-900/10 rounded-full blur-[120px]"></div>
        
        {/* Floating Nucleotides */}
        {particles.map((p) => (
          <div
            key={p.id}
            className={`absolute font-mono font-bold ${p.color} select-none animate-float`}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              fontSize: `${p.size}px`,
              opacity: p.opacity,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          >
            {p.char}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        
        {/* Logo/Icon Container */}
        <div className="mb-8 relative inline-block group">
            <div className="absolute inset-0 bg-violet-500/30 blur-2xl rounded-full group-hover:bg-violet-500/50 transition-all duration-700"></div>
            <div className="relative w-24 h-24 bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl">
                <Dna className="w-12 h-12 text-violet-400 animate-[spin_10s_linear_infinite]" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-slate-900 border border-slate-700 p-2 rounded-lg">
                <Fingerprint className="w-5 h-5 text-emerald-400" />
            </div>
        </div>

        {/* Text */}
        <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight font-brand">
          ABK <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">Genomics</span>
        </h1>
        
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-light leading-relaxed">
          The next generation of <strong className="text-slate-200 font-medium">Precision Medicine</strong>. 
          Analyze your genetic twin, predict phenotypic traits, and discover personalized oncological insights using advanced AI.
        </p>

        {/* CTA Button */}
        <button 
          onClick={onEnter}
          className="group relative px-8 py-4 bg-white text-slate-950 rounded-full font-bold text-sm uppercase tracking-widest overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-violet-200 to-cyan-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center gap-3">
             <span>Initialize System</span>
             <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
        
        <div className="mt-12 flex justify-center gap-8 text-[10px] text-slate-600 font-mono uppercase tracking-widest">
            <span>v3.1 Pro</span>
            <span>GRCh38 Reference</span>
            <span>Secure Environment</span>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0% { transform: translateY(0) rotate(0deg); }
          33% { transform: translateY(-30px) rotate(10deg); }
          66% { transform: translateY(20px) rotate(-5deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        .animate-float {
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
};