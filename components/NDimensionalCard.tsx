import React from 'react';
import { NDimensionalAnalysis } from '../types';
import { Network, GitMerge, Share2, Layers, Zap, ArrowRight, Activity, AlertTriangle } from 'lucide-react';

interface NDimensionalCardProps {
    analysis: NDimensionalAnalysis;
}

export const NDimensionalCard: React.FC<NDimensionalCardProps> = ({ analysis }) => {
    // Determine risk color intensity
    const getRiskColor = () => {
        if (analysis.riskLevel === 'CRITICAL' || analysis.riskLevel === 'HIGH') return 'text-red-400 border-red-500/50 bg-red-900/10';
        if (analysis.riskLevel === 'MODERATE') return 'text-orange-400 border-orange-500/50 bg-orange-900/10';
        return 'text-emerald-400 border-emerald-500/50 bg-emerald-900/10';
    };

    return (
        <div className="glass-panel p-0 rounded-xl relative overflow-hidden border border-slate-700 shadow-2xl">
            {/* Header Area */}
            <div className="p-6 border-b border-white/5 bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-violet-600/20 rounded-xl text-violet-300 border border-violet-500/30">
                        <Network className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-violet-400 uppercase tracking-widest mb-1">Systemic Network Analysis</h3>
                        <h2 className="text-xl md:text-2xl font-brand font-bold text-white leading-none">
                            {analysis.compositeBiomarker}
                        </h2>
                    </div>
                </div>
                
                <div className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${getRiskColor()}`}>
                    <Activity className="w-4 h-4 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                        {analysis.riskLevel} Convergence Impact
                    </span>
                </div>
            </div>

            <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Visual Flow Diagram (Left - 7 cols) */}
                <div className="lg:col-span-7 flex flex-col justify-center">
                     <div className="relative flex items-center justify-between w-full min-h-[200px] bg-slate-950/50 rounded-xl border border-white/5 p-6 md:px-10">
                        
                        {/* Connecting Curves (SVG Overlay) */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" preserveAspectRatio="none">
                             <path d="M 100 100 C 200 100, 200 100, 300 100" stroke="url(#gradient)" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke"/>
                             <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#8b5cf6" />
                                    <stop offset="100%" stopColor="#10b981" />
                                </linearGradient>
                             </defs>
                        </svg>

                        {/* Step 1: Input/Triggers */}
                        <div className="flex flex-col items-center gap-3 relative z-10 w-1/3">
                            <span className="text-[10px] uppercase text-slate-500 font-bold tracking-widest mb-2">Genomic Drivers</span>
                            <div className="flex flex-col gap-2 w-full items-center">
                                {analysis.factors.slice(0, 3).map((f, i) => (
                                    <div key={i} className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded text-xs text-slate-300 font-mono w-full text-center truncate">
                                        {f}
                                    </div>
                                ))}
                                {analysis.factors.length > 3 && <div className="text-[10px] text-slate-600">+{analysis.factors.length - 3} more</div>}
                            </div>
                        </div>

                        {/* Arrow */}
                        <div className="text-slate-700">
                             <ArrowRight className="w-6 h-6" />
                        </div>

                        {/* Step 2: Mechanism */}
                        <div className="flex flex-col items-center gap-3 relative z-10 w-1/3">
                             <span className="text-[10px] uppercase text-slate-500 font-bold tracking-widest mb-2">Biological Mechanism</span>
                             <div className="w-20 h-20 rounded-full border-2 border-dashed border-violet-500/50 flex items-center justify-center bg-violet-900/10 shadow-[0_0_20px_rgba(139,92,246,0.1)]">
                                 <GitMerge className="w-8 h-8 text-violet-400" />
                             </div>
                             <div className="text-center">
                                 <span className="text-xs font-bold text-violet-200 block">Pathways Intersect</span>
                             </div>
                        </div>

                        {/* Arrow */}
                        <div className="text-slate-700">
                             <ArrowRight className="w-6 h-6" />
                        </div>

                        {/* Step 3: Outcome */}
                        <div className="flex flex-col items-center gap-3 relative z-10 w-1/3">
                             <span className="text-[10px] uppercase text-slate-500 font-bold tracking-widest mb-2">Clinical Manifestation</span>
                             <div className="w-full bg-slate-900 border border-emerald-500/30 p-3 rounded text-center">
                                 <Zap className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                                 <span className="text-xs font-bold text-emerald-100 leading-tight block">
                                     Combined Risk Phenotype
                                 </span>
                             </div>
                        </div>
                     </div>
                </div>

                {/* Text Explanation (Right - 5 cols) */}
                <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-6">
                    <div>
                        <h4 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                            <Layers className="w-4 h-4" /> Clinical Translation
                        </h4>
                        <div className="bg-slate-800/30 rounded-lg p-4 border border-white/5">
                            <p className="text-slate-300 text-sm leading-relaxed">
                                {analysis.clinicalInsight}
                            </p>
                        </div>
                    </div>

                    <div>
                        <h4 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                            <AlertTriangle className="w-4 h-4 text-orange-400" /> Actionable Protocol
                        </h4>
                        <ul className="space-y-2">
                             <li className="flex items-start gap-2 text-sm text-slate-400">
                                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                                 <span>Evaluate combinatorial therapy options targeting the <strong>{analysis.compositeBiomarker}</strong>.</span>
                             </li>
                             <li className="flex items-start gap-2 text-sm text-slate-400">
                                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                                 <span>Monitor for specific phenotypes associated with multi-gene convergence.</span>
                             </li>
                        </ul>
                    </div>
                </div>

            </div>

            {/* Footer Metrics */}
            <div className="bg-slate-950 px-6 py-3 flex items-center justify-between border-t border-white/5 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                <div className="flex items-center gap-4">
                    <span>Algorithm: Multi-Omics_V4</span>
                    <span>Conf: {analysis.convergenceScore}%</span>
                </div>
                <div className="flex items-center gap-2">
                    <Share2 className="w-3 h-3" />
                    <span>Nodes: {analysis.networkNodes.length}</span>
                </div>
            </div>
        </div>
    );
};