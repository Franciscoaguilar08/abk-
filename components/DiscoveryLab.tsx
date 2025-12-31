
import React, { useState } from 'react';
import { Upload, FileCode, Dna, Layers, Image as ImageIcon, Sparkles, Network, ArrowRight, Loader2, Target, Share2, FlaskConical } from 'lucide-react';
import { SciFiButton } from './SciFiButton';
import { analyzeDiscoveryData } from '../services/geminiService';
import { DiscoveryAnalysisResult } from '../types';
import { Heatmap } from './Heatmap';

export const DiscoveryLab: React.FC = () => {
    const [genomicInput, setGenomicInput] = useState("");
    const [proteomicInput, setProteomicInput] = useState("");
    const [imagingMeta, setImagingMeta] = useState("");
    
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [result, setResult] = useState<DiscoveryAnalysisResult | null>(null);

    // EXAMPLE DATA AUTO-FILL
    const loadDemoData = () => {
        setGenomicInput("VCF: chr7:140453136 A>T (BRAF V600E); chr12:25398284 C>T (KRAS G12D)");
        setProteomicInput("CSV: EGFR_Exp: 4.5 (High); PTEN_Level: 0.2 (Low); PDL1_Surface: 85%");
        setImagingMeta("JSON: { 'tumor_heterogeneity': 'high', 'necrosis_percent': 15, 'vascularity_index': 0.85 }");
    };

    const handleRunDiscovery = async () => {
        if (!genomicInput || !proteomicInput) return;
        setLoading(true);
        try {
            const res = await analyzeDiscoveryData(genomicInput, proteomicInput, imagingMeta, setStatus);
            setResult(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in w-full max-w-7xl mx-auto space-y-8 pb-20">
            
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-brand font-bold text-white flex items-center gap-3">
                        <FlaskConical className="w-8 h-8 text-violet-500" />
                        Molecular Target Discovery
                    </h2>
                    <p className="text-slate-400 text-sm">Multi-Omics Latent Pattern Recognition for Novel Therapeutics</p>
                </div>
                <button onClick={loadDemoData} className="text-xs text-violet-400 hover:text-violet-300 border border-violet-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
                    Load Demo Dataset
                </button>
            </div>

            {!result && !loading && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* INPUT 1: GENOMICS */}
                    <div className="glass-panel p-6 rounded-xl border border-slate-700/50 hover:border-violet-500/30 transition-colors">
                        <div className="flex items-center gap-2 mb-4 text-violet-400 font-bold uppercase tracking-wider text-xs">
                            <Dna className="w-4 h-4" /> Genomics (VCF)
                        </div>
                        <textarea 
                            value={genomicInput}
                            onChange={(e) => setGenomicInput(e.target.value)}
                            className="w-full h-32 bg-slate-950/50 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 focus:border-violet-500/50 outline-none resize-none"
                            placeholder="Paste VCF data or gene variants..."
                        />
                    </div>

                    {/* INPUT 2: PROTEOMICS */}
                    <div className="glass-panel p-6 rounded-xl border border-slate-700/50 hover:border-violet-500/30 transition-colors">
                        <div className="flex items-center gap-2 mb-4 text-cyan-400 font-bold uppercase tracking-wider text-xs">
                            <Layers className="w-4 h-4" /> Proteomics (Expression)
                        </div>
                        <textarea 
                            value={proteomicInput}
                            onChange={(e) => setProteomicInput(e.target.value)}
                            className="w-full h-32 bg-slate-950/50 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 focus:border-cyan-500/50 outline-none resize-none"
                            placeholder="Paste protein expression levels (CSV/JSON)..."
                        />
                    </div>

                    {/* INPUT 3: IMAGING */}
                    <div className="glass-panel p-6 rounded-xl border border-slate-700/50 hover:border-violet-500/30 transition-colors">
                        <div className="flex items-center gap-2 mb-4 text-pink-400 font-bold uppercase tracking-wider text-xs">
                            <ImageIcon className="w-4 h-4" /> Radiomics / H&E
                        </div>
                        <textarea 
                            value={imagingMeta}
                            onChange={(e) => setImagingMeta(e.target.value)}
                            className="w-full h-32 bg-slate-950/50 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 focus:border-pink-500/50 outline-none resize-none"
                            placeholder="Paste imaging metadata or histological features..."
                        />
                    </div>

                    <div className="md:col-span-3 flex justify-center mt-4">
                         <SciFiButton onClick={handleRunDiscovery} disabled={!genomicInput || !proteomicInput}>
                            INITIATE LATENT SPACE ANALYSIS
                            <Sparkles className="w-4 h-4" />
                         </SciFiButton>
                    </div>
                </div>
            )}

            {/* LOADING STATE */}
            {loading && (
                 <div className="glass-panel p-12 rounded-xl flex flex-col items-center justify-center border border-violet-500/30">
                     <Loader2 className="w-12 h-12 text-violet-500 animate-spin mb-4" />
                     <h3 className="text-xl font-brand font-bold text-white mb-2">Systems Biology Engine Running</h3>
                     <p className="text-violet-300 font-mono text-sm animate-pulse">{status}</p>
                 </div>
            )}

            {/* RESULTS DASHBOARD */}
            {result && (
                <div className="space-y-6 animate-fade-in-up">
                    
                    {/* Top Insight Card */}
                    <div className="glass-panel p-8 rounded-xl border-l-4 border-l-violet-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-5">
                            <Network className="w-48 h-48 text-white" />
                        </div>
                        <h3 className="text-sm font-bold text-violet-400 uppercase tracking-widest mb-2">Discovery Hypothesis</h3>
                        <p className="text-xl text-white font-light leading-relaxed max-w-4xl">
                            {result.hypothesis}
                        </p>
                        <div className="mt-4 flex gap-4 text-xs font-mono text-slate-500">
                             <span>Latent Insight: {result.latentSpaceInsight}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Target List */}
                        <div className="glass-panel p-6 rounded-xl border border-violet-500/20">
                             <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                <Target className="w-4 h-4 text-violet-400" />
                                Predicted Molecular Targets
                             </h3>
                             
                             <div className="space-y-3">
                                {result.molecularTargets.map((target, idx) => (
                                    <div key={idx} className="bg-slate-900/50 p-4 rounded-lg border border-white/5 flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-white text-lg">{target.targetName}</span>
                                                <span className={`text-[9px] uppercase px-2 py-0.5 rounded border ${target.status === 'NOVEL' ? 'bg-violet-500/20 text-violet-300 border-violet-500/30' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                                                    {target.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400">{target.mechanism}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-slate-500 uppercase font-bold">Druggability</div>
                                            <div className="font-mono text-emerald-400 font-bold text-lg">{target.druggabilityScore.toFixed(2)}</div>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>

                        {/* Correlation Heatmap */}
                        <div className="glass-panel p-6 rounded-xl border border-cyan-500/20">
                             <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                <Share2 className="w-4 h-4 text-cyan-400" />
                                Latent Correlation Map
                             </h3>
                             <Heatmap data={result.correlationMatrix} />
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};
