
import React from 'react';
import { Activity, FlaskConical, ArrowRight, Dna, Share2 } from 'lucide-react';

interface CommandHubProps {
  onSelectModule: (module: 'CLINICAL' | 'DISCOVERY') => void;
}

export const CommandHub: React.FC<CommandHubProps> = ({ onSelectModule }) => {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 animate-fade-in-up">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-brand font-bold text-white mb-4">Command Center</h2>
        <p className="text-slate-400 text-lg">Select your operational environment</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Module A: Clinical Decision Support */}
        <div 
          onClick={() => onSelectModule('CLINICAL')}
          className="group relative h-[400px] rounded-3xl border border-emerald-500/20 bg-slate-900/40 p-1 cursor-pointer hover:border-emerald-500/60 transition-all duration-500 hover:shadow-[0_0_50px_rgba(16,185,129,0.1)] overflow-hidden"
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="h-full rounded-[20px] bg-[#0B1221] p-8 flex flex-col relative z-10 overflow-hidden">
            <div className="mb-auto">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <Activity className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-3 group-hover:text-emerald-300 transition-colors">Clinical Decision Support</h3>
              <p className="text-slate-400 leading-relaxed">
                Precision medicine engine for real-time genomic analysis, pharmacogenomics (CPIC), and oncology risk stratification.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-4 text-sm font-mono text-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity">
              <span>ACTIVE PATIENT CONTEXT</span>
              <div className="h-px flex-grow bg-emerald-500/30"></div>
              <ArrowRight className="w-5 h-5" />
            </div>

            {/* Decorative BG element */}
            <Dna className="absolute -bottom-10 -right-10 w-64 h-64 text-emerald-900/20 group-hover:text-emerald-900/30 group-hover:rotate-12 transition-all duration-700" />
          </div>
        </div>

        {/* Module B: Discovery Lab */}
        <div 
          onClick={() => onSelectModule('DISCOVERY')}
          className="group relative h-[400px] rounded-3xl border border-violet-500/20 bg-slate-900/40 p-1 cursor-pointer hover:border-violet-500/60 transition-all duration-500 hover:shadow-[0_0_50px_rgba(139,92,246,0.15)] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-violet-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          <div className="h-full rounded-[20px] bg-[#0B1221] p-8 flex flex-col relative z-10 overflow-hidden">
            <div className="mb-auto">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <FlaskConical className="w-7 h-7 text-violet-400" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-3 group-hover:text-violet-300 transition-colors">Target Discovery (R&D)</h3>
              <p className="text-slate-400 leading-relaxed">
                Multi-Omics integration utilizing Latent Pattern Recognition for molecular target identification and novel therapeutic discovery.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-4 text-sm font-mono text-violet-500 opacity-60 group-hover:opacity-100 transition-opacity">
              <span>ENTER LAB ENVIRONMENT</span>
              <div className="h-px flex-grow bg-violet-500/30"></div>
              <ArrowRight className="w-5 h-5" />
            </div>

             {/* Decorative BG element */}
             <Share2 className="absolute -bottom-10 -right-10 w-64 h-64 text-violet-900/20 group-hover:text-violet-900/30 group-hover:rotate-12 transition-all duration-700" />
          </div>
        </div>
      </div>
    </div>
  );
};
