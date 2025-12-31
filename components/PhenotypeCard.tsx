import React from 'react';
import { PhenotypeTrait } from '../types';
import { Eye, Utensils, Dumbbell, Sparkles, Zap } from 'lucide-react';

interface PhenotypeCardProps {
  trait: PhenotypeTrait;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'APPEARANCE': return <Eye className="w-5 h-5" />;
    case 'NUTRITION': return <Utensils className="w-5 h-5" />;
    case 'FITNESS': return <Dumbbell className="w-5 h-5" />;
    case 'SENSORY': return <Sparkles className="w-5 h-5" />;
    default: return <Zap className="w-5 h-5" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'APPEARANCE': return 'text-pink-400 bg-pink-500/10 border-pink-500/20';
    case 'NUTRITION': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    case 'FITNESS': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    case 'SENSORY': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  }
};

export const PhenotypeCard: React.FC<PhenotypeCardProps> = ({ trait }) => {
  return (
    <div className="glass-panel rounded-xl p-0 overflow-hidden group hover:shadow-[0_0_20px_rgba(124,58,237,0.1)] transition-all duration-300">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2 rounded-lg ${getCategoryColor(trait.category)}`}>
            {getCategoryIcon(trait.category)}
          </div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider bg-slate-900/50 px-2 py-1 rounded border border-white/5">
            {trait.confidence} CONFIDENCE
          </span>
        </div>
        
        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{trait.trait}</h3>
        <div className="text-xl font-brand font-bold text-white mb-3">{trait.prediction}</div>
        
        <div className="text-sm text-slate-300 leading-relaxed bg-slate-800/30 p-3 rounded-lg border border-white/5">
           {trait.description}
        </div>
      </div>
      
      <div className="bg-slate-900/80 px-5 py-3 border-t border-white/5 flex justify-between items-center">
        <span className="text-xs font-mono text-slate-500">Gene: <span className="text-violet-400">{trait.gene}</span></span>
      </div>
    </div>
  );
};