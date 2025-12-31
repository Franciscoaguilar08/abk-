import React from 'react';
import { EquityAnalysis } from '../types';
import { Globe2, Scale, Users, CheckCheck } from 'lucide-react';

interface AncestryCardProps {
    analysis?: EquityAnalysis;
}

export const AncestryCard: React.FC<AncestryCardProps> = ({ analysis }) => {
    if (!analysis || !analysis.biasCorrectionApplied) return null;

    return (
        <div className="glass-panel p-6 rounded-xl border border-indigo-500/30 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="flex items-start gap-4 relative z-10">
                <div className="p-3 bg-indigo-500/20 rounded-lg text-indigo-300">
                    <Scale className="w-6 h-6" />
                </div>
                
                <div className="flex-grow">
                    <h3 className="text-lg font-brand font-bold text-white mb-1 flex items-center gap-2">
                        Genomic Transferability Active
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 uppercase tracking-wider">
                            PRIMED Protocol
                        </span>
                    </h3>
                    <p className="text-slate-400 text-sm mb-4">
                        Risk scores have been calibrated for <strong>{analysis.detectedAncestry}</strong> ancestry to correct for Eurocentric bias in standard databases.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5">
                            <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-bold mb-1">
                                <Globe2 className="w-3 h-3" /> Targeted Pop.
                            </div>
                            <div className="text-white font-mono">{analysis.detectedAncestry.replace('_', ' ')}</div>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5">
                            <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-bold mb-1">
                                <Users className="w-3 h-3" /> PRS Adjustment
                            </div>
                            <div className="text-white font-mono">
                                {analysis.adjustmentFactor > 1 
                                    ? `+${((analysis.adjustmentFactor - 1) * 100).toFixed(1)}% Sensitivity` 
                                    : `-${((1 - analysis.adjustmentFactor) * 100).toFixed(1)}% Noise Reduc.`}
                            </div>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5">
                            <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-bold mb-1">
                                <CheckCheck className="w-3 h-3" /> Status
                            </div>
                            <div className="text-emerald-400 font-mono text-sm">Bias Corrected</div>
                        </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-indigo-900/20 border-l-2 border-indigo-500 rounded-r-lg">
                        <p className="text-xs text-indigo-200 italic">
                            "{analysis.explanation}"
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};