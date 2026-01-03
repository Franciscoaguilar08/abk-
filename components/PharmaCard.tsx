
import React from 'react';
import { PharmaProfile, MetabolizerStatus } from '../types';
import { PillIcon } from './Icons';
import { Skull, AlertTriangle, Info, Globe2, ExternalLink } from 'lucide-react';

interface PharmaCardProps {
  profile: PharmaProfile;
}

const getMetabolizerColor = (status: MetabolizerStatus) => {
  switch (status) {
    case MetabolizerStatus.POOR:
      return 'text-red-400 bg-red-500/10 border-red-500/20';
    case MetabolizerStatus.RAPID:
    case MetabolizerStatus.ULTRA_RAPID:
      return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    case MetabolizerStatus.NORMAL:
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    default:
      return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
  }
};

export const PharmaCard: React.FC<PharmaCardProps> = ({ profile }) => {
  const interactions = profile.interactions || [];
  const sources = profile.sources || [];

  const getSeverityConfig = (severity: 'INFO' | 'WARNING' | 'DANGER') => {
    switch (severity) {
      case 'DANGER': 
        return {
          icon: Skull,
          color: 'text-red-400',
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          shadow: 'shadow-[0_0_10px_rgba(248,113,113,0.15)]'
        };
      case 'WARNING': 
        return {
          icon: AlertTriangle,
          color: 'text-orange-400',
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/30',
          shadow: ''
        };
      case 'INFO': 
      default:
        return {
          icon: Info,
          color: 'text-blue-400',
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          shadow: ''
        };
    }
  };

  return (
    <div className="glass-panel rounded-xl p-6 border-l-2 border-l-transparent hover:border-l-cyan-500 transition-all flex flex-col h-full">
      <div className="flex items-center gap-4 mb-5">
        <div className="p-3 bg-cyan-950/50 rounded-xl text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
           <PillIcon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">{profile.gene}</h3>
          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${getMetabolizerColor(profile.phenotype)}`}>
            {profile.phenotype} METABOLIZER
          </span>
        </div>
      </div>
      
      <p className="text-sm text-slate-300 mb-6 leading-relaxed border-l-2 border-slate-700 pl-4 min-h-[40px]">
        {profile.description}
      </p>
      
      {interactions.length > 0 && (
        <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5 mb-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            Drug Interactions
            <span className="text-slate-600 text-[10px] border border-slate-700 px-1 rounded">{interactions.length}</span>
          </h4>
          <div className="space-y-3">
            {interactions.map((interaction, idx) => {
              const config = getSeverityConfig(interaction.severity);
              const Icon = config.icon;
              
              return (
                <div key={idx} className="flex items-start gap-3 border-b border-white/5 last:border-0 pb-3 last:pb-0 group">
                  {/* Icon Indicator */}
                  <div className={`p-2 rounded-lg border ${config.bg} ${config.border} ${config.color} ${config.shadow} mt-0.5 shrink-0 transition-transform group-hover:scale-105`}>
                      <Icon className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-grow">
                      <div className="flex justify-between items-start mb-0.5">
                        <span className="font-semibold text-slate-200 text-sm group-hover:text-white transition-colors">{interaction.drugName}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${config.color} border border-current px-1 rounded opacity-80`}>
                            {interaction.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-tight">
                        {interaction.implication}
                      </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VERIFIED GROUNDING SOURCES */}
      {sources.length > 0 && (
          <div className="mt-auto pt-3 border-t border-white/5">
             <div className="flex items-center gap-2 mb-2">
                 <Globe2 className="w-3 h-3 text-emerald-500" />
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Verified Sources (Live Web)</span>
             </div>
             <div className="space-y-1.5">
                 {sources.slice(0, 3).map((source, i) => (
                     <a 
                        key={i} 
                        href={source.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[10px] text-slate-400 hover:text-emerald-400 transition-colors group truncate"
                     >
                         <ExternalLink className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100" />
                         <span className="truncate">{source.title || source.url}</span>
                     </a>
                 ))}
             </div>
          </div>
      )}
    </div>
  );
};
