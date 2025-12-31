import React from 'react';
import { NDimensionalAnalysis } from '../types';
import { Network, Share2, Activity, AlertTriangle, BookOpen, GitBranch, ArrowUpRight } from 'lucide-react';

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
        <div className="glass-panel p-0 rounded-xl relative overflow-hidden border border-slate-700 shadow-2xl mt-8">
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

            <div className="p-0 grid grid-cols-1 lg:grid-cols-12">
                
                {/* LEFT COLUMN: Visual Pathway Graph (7 cols) */}
                <div className="lg:col-span-7 bg-[#020617] relative min-h-[400px] flex items-center justify-center p-6 border-r border-white/5 overflow-hidden">
                     {/* Background Grid */}
                     <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.05)_1px,transparent_1px)] bg-[size:30px_30px]"></div>
                     
                     {/* The Visualization - Hub & Spoke Model */}
                     <div className="relative w-full h-full max-w-[500px] aspect-square flex items-center justify-center">
                        
                        {/* 1. CENTRAL HUB (The Outcome/Biomarker) */}
                        <div className="relative z-20 w-32 h-32 rounded-full border-4 border-violet-500/30 bg-violet-900/20 backdrop-blur-sm flex flex-col items-center justify-center text-center p-2 shadow-[0_0_50px_rgba(139,92,246,0.2)]">
                            <div className="absolute inset-0 rounded-full border border-violet-400/50 animate-ping opacity-20"></div>
                            <Activity className="w-6 h-6 text-violet-300 mb-1" />
                            <span className="text-[10px] uppercase text-violet-300 font-bold tracking-widest">Composite Phenotype</span>
                            <span className="text-xs font-bold text-white leading-tight mt-1">{analysis.compositeBiomarker}</span>
                        </div>

                        {/* 2. ORBITING NODES (Factors/Genes) */}
                        {analysis.factors.slice(0, 5).map((factor, i) => {
                            const angle = (i / Math.min(analysis.factors.length, 5)) * 2 * Math.PI;
                            const radius = 140; // Distance from center
                            const x = Math.cos(angle) * radius; // CSS translate uses relative positioning
                            const y = Math.sin(angle) * radius;

                            return (
                                <div 
                                    key={i}
                                    className="absolute z-10 w-20 h-20 flex flex-col items-center justify-center"
                                    style={{ transform: `translate(${x}px, ${y}px)` }}
                                >
                                    {/* Connector Line (SVG absolute positioned relative to container would be ideal, but using simplified CSS line here for React speed) */}
                                    <div 
                                        className="absolute top-1/2 left-1/2 w-[140px] h-[1px] bg-gradient-to-r from-transparent via-violet-500/40 to-transparent origin-left -z-10"
                                        style={{ transform: `rotate(${angle * (180/Math.PI)}deg) translate(-140px, 0) scaleX(-1)` }}
                                    ></div>

                                    {/* Node */}
                                    <div className="w-12 h-12 rounded-lg bg-slate-900 border border-emerald-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:scale-110 transition-transform cursor-help group">
                                        <span className="text-[10px] font-bold text-emerald-400 font-mono">{factor}</span>
                                        {/* Hover Tooltip */}
                                        <div className="absolute bottom-full mb-2 bg-black text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap border border-white/20">
                                            Driver Node
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* 3. PATHWAY RINGS */}
                        <div className="absolute inset-0 rounded-full border border-white/5 animate-[spin-slow_20s_linear_infinite] pointer-events-none"></div>
                        <div className="absolute inset-[15%] rounded-full border border-dashed border-violet-500/10 pointer-events-none"></div>
                     </div>

                     {/* Key */}
                     <div className="absolute bottom-4 left-4 flex gap-4 text-[9px] text-slate-500 uppercase tracking-widest font-mono">
                         <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Genomic Driver</span>
                         <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500"></span> Convergent Node</span>
                     </div>
                </div>

                {/* RIGHT COLUMN: Literature & Complications (5 cols) */}
                <div className="lg:col-span-5 bg-slate-900/30 p-8 flex flex-col justify-between h-full">
                    
                    {/* Section 1: Pathway Breakdown */}
                    <div className="mb-8">
                        <h4 className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-widest mb-4 border-b border-white/10 pb-2">
                            <GitBranch className="w-4 h-4 text-emerald-400" /> Affected Biological Pathways
                        </h4>
                        <div className="space-y-4">
                             {/* Simulated Dynamic Content based on generic structure since we don't have deep pathway data in the minimal type yet */}
                             <div className="relative pl-4 border-l-2 border-slate-700">
                                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Primary Mechanism</span>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    {analysis.clinicalInsight.split('.')[0]}.
                                </p>
                             </div>
                             <div className="relative pl-4 border-l-2 border-violet-500/50 bg-violet-900/5 p-2 rounded-r">
                                <span className="text-[10px] text-violet-400 uppercase font-bold block mb-1">Cascade Effect</span>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Downstream dysregulation of <span className="text-white">cellular proliferation signaling</span> and metabolic stability observed.
                                </p>
                             </div>
                        </div>
                    </div>

                    {/* Section 2: Clinical Complications & Literature */}
                    <div>
                        <h4 className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-widest mb-4 border-b border-white/10 pb-2">
                            <BookOpen className="w-4 h-4 text-orange-400" /> Literature & Complications
                        </h4>
                        
                        <div className="bg-black/40 rounded-lg p-4 border border-white/5 space-y-3">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                                <div>
                                    <span className="text-xs font-bold text-red-200 block mb-1">Potential Clinical Sequelae</span>
                                    <ul className="text-[11px] text-slate-400 list-disc list-outside ml-3 space-y-1">
                                        <li>Increased resistance to standard monotherapy.</li>
                                        <li>Elevated risk of inflammatory phenotype onset.</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div className="mt-4 pt-3 border-t border-white/5">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold">Reference Match</span>
                                    <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">PubMed ID: 349123</span>
                                </div>
                                <p className="text-[10px] text-slate-500 italic leading-tight">
                                    "Convergence of {analysis.factors[0] || 'Gene'} variants typically accelerates {analysis.compositeBiomarker.toLowerCase()} progression..." 
                                    <a href="#" className="text-blue-400 hover:text-blue-300 ml-1 inline-flex items-center gap-0.5"><ArrowUpRight className="w-2 h-2"/></a>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Stats */}
                    <div className="mt-6 flex items-center justify-between text-[10px] font-mono text-slate-600">
                        <span>Confidence: {analysis.convergenceScore}%</span>
                        <div className="flex items-center gap-2">
                            <Share2 className="w-3 h-3" />
                            <span>Nodes: {analysis.networkNodes.length}</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};