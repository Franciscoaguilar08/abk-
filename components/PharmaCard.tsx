import React from 'react';
import { PharmaProfile, MetabolizerStatus } from '../types';
import { PillIcon } from './Icons';

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

const getSeverityColor = (severity: 'INFO' | 'WARNING' | 'DANGER') => {
  switch (severity) {
    case 'DANGER': return 'text-red-400';
    case 'WARNING': return 'text-orange-400';
    case 'INFO': return 'text-blue-400';
  }
};

export const PharmaCard: React.FC<PharmaCardProps> = ({ profile }) => {
  const interactions = profile.interactions || [];

  return (
    <div className="glass-panel rounded-xl p-6 border-l-2 border-l-transparent hover:border-l-cyan-500 transition-all">
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
      
      <p className="text-sm text-slate-300 mb-6 leading-relaxed border-l-2 border-slate-700 pl-4">
        {profile.description}
      </p>
      
      {interactions.length > 0 && (
        <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            Drug Interactions
            <span className="text-slate-600 text-[10px] border border-slate-700 px-1 rounded">{interactions.length}</span>
          </h4>
          <div className="space-y-4">
            {interactions.map((interaction, idx) => (
              <div key={idx} className="flex justify-between items-start border-b border-white/5 last:border-0 pb-3 last:pb-0">
                <span className="font-semibold text-slate-200 text-sm">{interaction.drugName}</span>
                <div className="text-right">
                    <span className={`text-[10px] font-bold uppercase ${getSeverityColor(interaction.severity)}`}>
                        {interaction.severity}
                    </span>
                    <p className="text-xs text-slate-400 max-w-[200px] mt-1 leading-tight">{interaction.implication}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};