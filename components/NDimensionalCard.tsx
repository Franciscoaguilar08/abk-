
import React from 'react';
import { NDimensionalAnalysis } from '../types';
import { Network, BrainCircuit, Share2, Layers } from 'lucide-react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell } from 'recharts';

interface NDimensionalCardProps {
    analysis: NDimensionalAnalysis;
}

export const NDimensionalCard: React.FC<NDimensionalCardProps> = ({ analysis }) => {
    // Transform nodes for simple scatter visualization since full force-directed graph needs d3 heavily
    // We simulate a network view using ScatterChart for simplicity and aesthetic
    const data = analysis.networkNodes.map((node, index) => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        z: node.group === 'GENE' ? 200 : 100,
        name: node.label,
        group: node.group
    }));

    return (
        <div className="glass-panel p-8 rounded-xl relative overflow-hidden border border-violet-500/30">
            {/* Background Neural Mesh */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <svg width="100%" height="100%">
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                
                {/* Left: Text Insight */}
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-violet-600/20 rounded-xl text-violet-300 border border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                            <Layers className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-violet-400 uppercase tracking-widest">N-Dimensional Convergence</h3>
                            <h2 className="text-2xl font-brand font-bold text-white leading-tight">
                                {analysis.compositeBiomarker}
                            </h2>
                        </div>
                    </div>

                    <p className="text-slate-300 leading-relaxed mb-6 border-l-2 border-violet-500/50 pl-4">
                        {analysis.clinicalInsight}
                    </p>

                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase">Converging Factors</h4>
                        <div className="flex flex-wrap gap-2">
                            {analysis.factors.map((f, i) => (
                                <span key={i} className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs text-slate-300 flex items-center gap-1">
                                    <Share2 className="w-3 h-3 text-emerald-400" /> {f}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 flex items-center gap-4">
                         <div className="flex-grow bg-slate-800 h-2 rounded-full overflow-hidden">
                             <div 
                                className="h-full bg-gradient-to-r from-emerald-500 via-violet-500 to-red-500 relative"
                                style={{ width: `${analysis.convergenceScore}%` }}
                             >
                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-white animate-pulse shadow-[0_0_10px_white]"></div>
                             </div>
                         </div>
                         <span className="font-mono text-xl font-bold text-white">{analysis.convergenceScore}%</span>
                    </div>
                </div>

                {/* Right: Neural Vis (Simulated) */}
                <div className="h-[300px] w-full bg-slate-900/50 rounded-xl border border-white/5 relative overflow-hidden">
                     <div className="absolute inset-0 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <XAxis type="number" dataKey="x" name="stature" hide domain={[0, 100]} />
                                <YAxis type="number" dataKey="y" name="weight" hide domain={[0, 100]} />
                                <ZAxis type="number" dataKey="z" range={[100, 400]} />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => {
                                    if (payload && payload.length) {
                                        return (
                                            <div className="bg-black/80 border border-white/20 p-2 rounded text-xs text-white">
                                                {payload[0].payload.name}
                                            </div>
                                        );
                                    }
                                    return null;
                                }} />
                                <Scatter name="Nodes" data={data} fill="#8884d8">
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.group === 'GENE' ? '#8b5cf6' : '#10b981'} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                        
                        {/* Connecting Lines Overlay (CSS Animation) */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-1/2 left-1/2 w-32 h-32 border border-violet-500/20 rounded-full -translate-x-1/2 -translate-y-1/2 animate-[spin_10s_linear_infinite]"></div>
                             <div className="absolute top-1/2 left-1/2 w-48 h-48 border border-emerald-500/10 rounded-full -translate-x-1/2 -translate-y-1/2 animate-[spin_15s_linear_infinite_reverse]"></div>
                        </div>
                     </div>
                     <div className="absolute bottom-3 left-3 flex gap-3">
                         <div className="flex items-center gap-1 text-[10px] text-slate-400">
                             <span className="w-2 h-2 rounded-full bg-violet-500"></span> Genomic
                         </div>
                         <div className="flex items-center gap-1 text-[10px] text-slate-400">
                             <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Clinical
                         </div>
                     </div>
                </div>

            </div>
        </div>
    );
};
