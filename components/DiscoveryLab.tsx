
import React, { useState } from 'react';
import { 
    Box, Network, BookOpen, Globe2, 
    Cpu, ShieldCheck, Zap, Activity, Dna,
    Database, PlayCircle, AlertTriangle, Search, Loader2,
    FileText, Terminal, UploadCloud, HelpCircle, Eye, Fingerprint, FlaskConical,
    CheckCircle2, RotateCcw, Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SciFiButton } from './SciFiButton'; 
import { analyzeDiscoveryData } from '../services/geminiService';
import { SandboxResult, NetworkNode, NetworkLink, VariantAnalysis } from '../types';
import { ProteinViewer } from './ProteinViewer';

const MotionDiv = motion.div as any;

// --- DEMO DATA ---
const DEMO_MODELS = [
    { id: 'KRAS', label: 'KRAS G12C', category: 'ONCOLOGY', color: 'rose' },
    { id: 'ACE2', label: 'ACE2 Receptor', category: 'VIROLOGY', color: 'cyan' },
    { id: 'CFTR', label: 'CFTR (F508del)', category: 'RARE DISEASE', color: 'amber' }
];

// --- FALLBACK MOCK DATA ---
const MOCK_SANDBOX_RESULT: SandboxResult = {
    targetId: "MOCK-KRAS-G12C",
    hypothesis: "G12C mutation locks KRAS in an active state. Covalent inhibitors targeting Cys12 can lock it in an inactive GDP-bound state.",
    docking: {
        targetName: "KRAS G12C",
        uniprotId: "P01116",
        ligandName: "AMG-510 (Sotorasib)",
        bindingEnergy: -11.5,
        activeSiteResidues: [12, 68, 95]
    },
    network: {
        nodes: [
            { id: "KRAS", group: "PROTEIN", impactScore: 1.0 },
            { id: "RAF1", group: "PROTEIN", impactScore: 0.9 },
            { id: "MEK", group: "PROTEIN", impactScore: 0.8 },
            { id: "ERK", group: "PROTEIN", impactScore: 0.8 },
            { id: "PI3K", group: "PROTEIN", impactScore: 0.7 },
            { id: "Growth_Signal", group: "METABOLITE", impactScore: 0.6 }
        ],
        links: [
            { source: "Growth_Signal", target: "KRAS", interactionType: "ACTIVATION" },
            { source: "KRAS", target: "RAF1", interactionType: "ACTIVATION" },
            { source: "RAF1", target: "MEK", interactionType: "ACTIVATION" },
            { source: "MEK", target: "ERK", interactionType: "ACTIVATION" },
            { source: "KRAS", target: "PI3K", interactionType: "ACTIVATION" }
        ]
    },
    literature: [
        { title: "Kras G12C Inhibition", source: "Nature, 2019", summary: "Discovery of a covalent inhibitor.", relevanceScore: 98 },
        { title: "Resistance Mechanisms", source: "NEJM, 2021", summary: "Acquired resistance via feedback loops.", relevanceScore: 85 }
    ],
    stratification: [
        { population: "NSCLC (Smokers)", alleleFrequency: 13.0, predictedEfficacy: 85 },
        { population: "Colorectal Cancer", alleleFrequency: 3.0, predictedEfficacy: 40 },
        { population: "Pancreatic Cancer", alleleFrequency: 1.5, predictedEfficacy: 55 }
    ],
    convergenceInsight: "Convergence of structural vulnerability (Cys12) and high clinical prevalence suggests high priority for covalent inhibitor development.",
    detailedAnalysis: {
        dockingDynamics: "Calculated ΔG of -11.5 kcal/mol suggests nanomolar affinity. Covalent bond formation at Cys12 is thermodynamically favorable.",
        pathwayKinetics: "MAPK signaling output predicted to drop by 85%.",
        evidenceSynthesis: "Meta-analysis indicates high confidence in covalent strategy.",
        populationStat: "Stratification reveals 13% frequency in NSCLC."
    }
};

interface DiscoveryLabProps {
    userVariants?: VariantAnalysis[];
}

export const DiscoveryLab: React.FC<DiscoveryLabProps> = ({ userVariants = [] }) => {
    const [targetInput, setTargetInput] = useState("");
    const [literatureInput, setLiteratureInput] = useState(""); 
    const [showLiteratureInput, setShowLiteratureInput] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [result, setResult] = useState<SandboxResult | null>(null);
    const [isOfflineMode, setIsOfflineMode] = useState(false);

    const handleReset = () => {
        setResult(null);
        setTargetInput("");
        setLiteratureInput("");
        setShowLiteratureInput(false);
        setLoading(false);
        setIsOfflineMode(false);
    };

    const handleRunSimulation = async (overrideInput?: string) => {
        const inputToUse = overrideInput || targetInput;
        if (!inputToUse) return;
        
        if (overrideInput) setTargetInput(overrideInput);

        setLoading(true);
        setResult(null); 
        setIsOfflineMode(false);
        
        setStatus(literatureInput.length > 50 ? "INGESTING LITERATURE..." : "QUERYING UNIPROT DATABASE...");

        try {
            const res = await analyzeDiscoveryData(inputToUse, literatureInput, setStatus);
            
            if (res) {
                setResult(res);
                setLoading(false); 
                if (literatureInput) setShowLiteratureInput(false);
            } else {
                throw new Error("Empty AI Response");
            }

        } catch (e: any) {
            console.error("Simulation failed:", e);
            setIsOfflineMode(true);
            
            const fallbackData = {
                ...MOCK_SANDBOX_RESULT,
                targetId: inputToUse.toUpperCase(),
                docking: { 
                    ...MOCK_SANDBOX_RESULT.docking, 
                    targetName: inputToUse.toUpperCase(),
                    ligandName: "FALLBACK-MOL-001"
                },
                hypothesis: `[OFFLINE SIMULATION] Hypothesis generated for ${inputToUse} based on analogous structural homologues. Connectivity to Gemini/UniProt interrupted.`
            };
            
            setResult(fallbackData);
            setLoading(false);
            setStatus(`OFFLINE SIMULATION ACTIVE`);
        }
    };

    return (
        <div className="w-full max-w-[1400px] mx-auto pb-20 space-y-6 text-slate-200 font-sans animate-fade-in">
            
            {/* 1. HEADER & SEARCH CORE */}
            <div className="relative z-10 bg-[#020617]/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-2xl transition-all">
                 <div className="flex flex-col md:flex-row items-start gap-6 justify-between">
                    <div className="max-w-xl">
                        <div className="flex items-center gap-2 text-violet-400 mb-2">
                             <FlaskConical className="w-5 h-5" />
                             <span className="text-xs font-bold tracking-[0.2em] uppercase font-mono">Research & Development</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-brand font-bold text-white tracking-tight mb-2">
                            Target <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Discovery</span>
                        </h1>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            This module combines <span className="text-white font-bold">UniProt Structural Data</span> with AI to simulate drug interactions. It analyzes the specific functional domain your mutation affects to propose therapeutic hypotheses.
                        </p>
                    </div>
                    
                    <div className="w-full md:w-[500px] flex flex-col gap-3">
                         {result ? (
                             <div className="flex justify-end">
                                 <button 
                                    onClick={handleReset}
                                    className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-bold uppercase tracking-wider shadow-lg shadow-violet-900/40 transition-all transform hover:scale-105"
                                 >
                                     <RotateCcw className="w-4 h-4" />
                                     New Simulation
                                 </button>
                             </div>
                         ) : (
                             <div className="flex gap-2">
                                <div className="relative flex-grow group">
                                    <div className="absolute inset-0 bg-violet-600/20 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <input 
                                        type="text"
                                        value={targetInput}
                                        onChange={(e) => setTargetInput(e.target.value)}
                                        placeholder="SEARCH GENE VARIANT (e.g. BRAF V600E)"
                                        className="relative w-full h-12 bg-[#0a0a0a] border border-slate-700 text-white rounded-lg px-4 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none font-mono text-sm uppercase tracking-wider placeholder:text-slate-600 transition-all"
                                        onKeyDown={(e) => e.key === 'Enter' && handleRunSimulation()}
                                    />
                                    {/* LIVE PULSE INDICATOR */}
                                    {targetInput && (
                                        <div className="absolute right-3 top-3.5 flex items-center gap-1.5 pointer-events-none">
                                            <span className="relative flex h-2 w-2">
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                            <span className="text-[9px] font-bold text-emerald-500 uppercase">Live DB Ready</span>
                                        </div>
                                    )}
                                </div>
                                <SciFiButton onClick={() => handleRunSimulation()} disabled={!targetInput || loading} className="h-12 px-6">
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                                </SciFiButton>
                             </div>
                         )}
                         
                         {/* Controls Row */}
                         <div className="flex justify-between items-center">
                             <button onClick={() => setShowGuide(!showGuide)} className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-colors px-3 py-1.5 rounded-full border ${showGuide ? 'bg-violet-500 text-white border-violet-400' : 'bg-slate-900 text-slate-500 border-slate-700 hover:text-white'}`}>
                                 <Eye className="w-3 h-3" /> {showGuide ? 'Concept Guide: ON' : 'Show Concept Guide'}
                             </button>
                             <button onClick={() => setShowLiteratureInput(!showLiteratureInput)} className={`text-[10px] font-mono uppercase tracking-wider flex items-center gap-2 hover:text-white transition-colors ${showLiteratureInput || literatureInput ? 'text-violet-400' : 'text-slate-500'}`}>
                                 <FileText className="w-3 h-3" /> {showLiteratureInput ? 'Hide Paper Input' : 'Advanced: Add Research Paper'}
                             </button>
                         </div>
                    </div>
                 </div>

                 {/* PERSONALIZED TARGET SUGGESTIONS */}
                 {userVariants.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-white/5">
                          <div className="flex items-center gap-2 mb-3">
                              <Fingerprint className="w-3 h-3 text-emerald-500" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Personal Targets ({userVariants.length})</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                              {userVariants.map((v, i) => (
                                  <button key={i} onClick={() => handleRunSimulation(`${v.gene} ${v.variant}`)} disabled={loading} className="flex items-center gap-2 px-3 py-2 rounded bg-emerald-900/20 border border-emerald-500/30 hover:bg-emerald-900/40 hover:border-emerald-400 transition-all group">
                                      <Dna className="w-3 h-3 text-emerald-500 group-hover:text-emerald-400" />
                                      <div className="text-left">
                                          <div className="text-xs font-bold text-emerald-100">{v.gene}</div>
                                          <div className="text-[9px] font-mono text-emerald-500/70">{v.variant}</div>
                                      </div>
                                      <PlayCircle className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                                  </button>
                              ))}
                          </div>
                      </div>
                 )}

                 {/* DEMO MODELS */}
                 {!result && (
                     <div className="mt-6 pt-4 border-t border-white/5">
                          <div className="flex items-center gap-2 mb-3">
                              <Database className="w-3 h-3 text-slate-500" />
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Standard Reference Models</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                              {DEMO_MODELS.map((model) => (
                                  <button key={model.id} onClick={() => handleRunSimulation(model.label)} disabled={loading} className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-all bg-slate-900/50 hover:bg-slate-800 ${model.color === 'rose' ? 'border-rose-500/30 hover:border-rose-500 text-rose-400' : model.color === 'cyan' ? 'border-cyan-500/30 hover:border-cyan-500 text-cyan-400' : 'border-amber-500/30 hover:border-amber-500 text-amber-400'}`}>
                                      <Box className="w-3 h-3" />
                                      <span className="text-xs font-bold">{model.id}</span>
                                  </button>
                              ))}
                          </div>
                     </div>
                 )}

                 {/* LITERATURE INPUT (Hidden by default) */}
                 <AnimatePresence>
                      {showLiteratureInput && !result && (
                          <MotionDiv initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-4">
                              <div className="bg-slate-900/50 rounded-xl border border-violet-500/30 p-4">
                                  <textarea value={literatureInput} onChange={(e) => setLiteratureInput(e.target.value)} placeholder="PASTE ABSTRACT OR DOI..." className="w-full h-32 bg-[#050505] border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-300 focus:border-violet-500 outline-none resize-none" />
                              </div>
                          </MotionDiv>
                      )}
                 </AnimatePresence>
            </div>

            {/* OFFLINE INDICATOR */}
            {isOfflineMode && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center gap-3 animate-fade-in-up">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <div>
                        <h4 className="text-amber-400 text-xs font-bold uppercase">Simulation Mode: Offline/Fallback</h4>
                        <p className="text-amber-200/70 text-[10px]">Using local projection data. Connectivity to Gemini/UniProt interrupted.</p>
                    </div>
                </div>
            )}

            {/* 2. THE GRID (4 CARDS + BIOLOGY PANEL) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px]">
                
                {/* CARD 1: DOCKING (Now with Real Data Overlay) */}
                <SandboxCard title="Structural Docking" icon={Box} color="violet" loading={loading} status={loading ? "DOCKING..." : (result?.docking?.uniprotId ? "MODEL RENDERED" : "STANDBY")} analysisText={result?.detailedAnalysis?.dockingDynamics} guideMode={showGuide} guideText="Visualizes 3D protein shape and mutation location.">
                    {result && !loading && result.docking && result.docking.uniprotId ? (
                        <div className="h-full flex flex-col animate-fade-in">
                            <div className="relative flex-grow rounded-lg overflow-hidden border border-slate-800 bg-black shadow-inner min-h-[300px]">
                                <ProteinViewer uniprotId={result.docking.uniprotId} highlightPosition={result.docking.activeSiteResidues?.[0]} />
                                
                                {/* Overlay Metrics */}
                                <div className="absolute top-4 left-4 z-20 pointer-events-none">
                                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Target</div>
                                    <div className="text-2xl font-mono text-white font-bold">{result.docking.targetName}</div>
                                </div>
                                <div className="absolute bottom-4 right-4 z-20 text-right pointer-events-none">
                                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Binding Energy</div>
                                    <div className="text-xl font-mono text-emerald-400 font-bold">{result.docking.bindingEnergy} kcal/mol</div>
                                </div>

                                {/* REAL DATA BADGE (New) */}
                                {result.proteinMetaData && (
                                    <div className="absolute top-4 right-4 z-20">
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded text-[9px] font-bold text-emerald-300 uppercase tracking-wider backdrop-blur-md">
                                            <Database className="w-3 h-3" />
                                            UniProt Data Loaded
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="mt-4 flex justify-between text-xs font-mono text-slate-500">
                                <span className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                                    Active Sites: {result.docking.activeSiteResidues?.join(', ')}
                                </span>
                                <span className="text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded bg-violet-900/10">{result.docking.ligandName}</span>
                            </div>
                        </div>
                    ) : <StandbyMode icon={Dna} label="Waiting for Structure" color="violet" loading={loading} />}
                </SandboxCard>

                {/* NEW CARD: BIOLOGICAL REALITY (Replaces Network if Real Data is present, otherwise standard grid) */}
                {result && result.proteinMetaData ? (
                    <div className="bg-[#050505] rounded-xl border border-emerald-500/30 relative flex flex-col h-[520px] overflow-hidden group shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                        <div className="p-4 border-b border-white/5 bg-emerald-900/10 backdrop-blur-sm flex justify-between items-center z-10">
                             <div className="flex items-center gap-3">
                                 <div className="p-1.5 rounded bg-emerald-900/20 border border-emerald-500/30"><Database className="w-4 h-4 text-emerald-400" /></div>
                                 <span className="text-sm font-bold tracking-widest uppercase font-mono text-emerald-400">Biological Reality</span>
                             </div>
                             <div className="flex items-center gap-2">
                                 <span className="text-[9px] font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">CONFIRMED</span>
                             </div>
                        </div>
                        <div className="flex-grow p-6 overflow-y-auto custom-scrollbar">
                            <div className="mb-6">
                                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Protein Entity</div>
                                <div className="text-2xl text-white font-brand font-bold leading-tight">{result.proteinMetaData.geneName}</div>
                            </div>
                            
                            <div className="mb-6 bg-slate-900/50 p-4 rounded-lg border border-white/5">
                                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Activity className="w-3 h-3" /> Molecular Function
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                    {result.proteinMetaData.functionDescription}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Structural Features</div>
                                {result.proteinMetaData.structuralFeatures.length > 0 ? (
                                    result.proteinMetaData.structuralFeatures.map((feat, i) => (
                                        <div key={i} className={`p-3 rounded border text-xs font-mono flex items-start gap-2 ${feat.includes('CRITICAL HIT') ? 'bg-red-900/20 border-red-500/40 text-red-200' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                                            {feat.includes('CRITICAL HIT') ? <AlertTriangle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" /> : <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0"></div>}
                                            {feat}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-xs text-slate-500 italic">No specific structural domains mapped for this variant position.</div>
                                )}
                            </div>
                        </div>
                        <div className="p-4 border-t border-white/5 bg-slate-900/30">
                            <div className="text-[10px] text-slate-500 flex items-center gap-2">
                                <Globe2 className="w-3 h-3" /> Source: UniProtKB (Live)
                            </div>
                        </div>
                    </div>
                ) : (
                    /* FALLBACK TO NETWORK CARD IF NO REAL DATA */
                    <SandboxCard title="Protein Network" icon={Network} color="cyan" loading={loading} status={loading ? "TRACING..." : (result?.network ? "ACTIVE" : "STANDBY")} analysisText={result?.detailedAnalysis?.pathwayKinetics} guideMode={showGuide} guideText="Shows protein interaction pathways.">
                        {result && !loading && result.network ? (
                            <div className="h-full flex flex-col animate-fade-in">
                                <div className="flex-grow bg-[#020202] rounded-lg border border-slate-800 relative overflow-hidden flex items-center justify-center min-h-[300px]">
                                    <CyberNetworkGraph nodes={result.network.nodes || []} links={result.network.links || []} />
                                </div>
                            </div>
                        ) : <StandbyMode icon={Activity} label="Waiting for Pathways" color="cyan" loading={loading} />}
                    </SandboxCard>
                )}

                {/* CARD 3: LITERATURE */}
                <SandboxCard title="Research Evidence" icon={BookOpen} color="amber" loading={loading} status={loading ? "SEARCHING..." : (result?.literature ? `${result.literature.length} FOUND` : "STANDBY")} analysisText={result?.detailedAnalysis?.evidenceSynthesis} guideMode={showGuide} guideText="Scans medical papers for experimental data.">
                      {result && !loading && result.literature ? (
                        <div className="flex-grow space-y-3 overflow-y-auto custom-scrollbar max-h-[350px]">
                            {result.literature.map((paper, idx) => (
                                <div key={idx} className="bg-[#0a0a0a] p-4 rounded border border-white/5 hover:border-amber-500/50 transition-all">
                                    <h4 className="text-xs font-bold text-slate-200 mb-2 font-mono uppercase">{paper.title}</h4>
                                    <p className="text-[11px] text-slate-400 font-mono opacity-80">{paper.summary}</p>
                                </div>
                            ))}
                        </div>
                      ) : <StandbyMode icon={Database} label="Waiting for Query" color="amber" loading={loading} />}
                </SandboxCard>

                {/* CARD 4: STRATIFICATION */}
                <SandboxCard title="Global Efficacy" icon={Globe2} color="emerald" loading={loading} status={loading ? "CALCULATING..." : (result?.stratification ? "MAPPED" : "STANDBY")} analysisText={result?.detailedAnalysis?.populationStat} guideMode={showGuide} guideText="Population-based efficacy prediction.">
                    {result && !loading && result.stratification ? (
                        <div className="h-full flex flex-col items-center justify-center animate-fade-in">
                             <div className="w-full h-full flex items-center justify-center"><StratificationViz data={result.stratification} /></div>
                        </div>
                    ) : <StandbyMode icon={Globe2} label="Waiting for Data" color="emerald" loading={loading} />}
                </SandboxCard>

            </div>

            {/* 3. NEW CONVERGENCE INSIGHT (ENHANCED VISUALIZATION) */}
            <AnimatePresence>
                {result && !loading && result.convergenceInsight && (
                    <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-gradient-to-r from-violet-900/20 via-cyan-900/20 to-violet-900/20 border border-white/10 rounded-2xl p-8 relative overflow-hidden mt-6">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-cyan-500 to-violet-500"></div>
                        
                        <div className="flex flex-col md:flex-row gap-8 items-center">
                             {/* Badge Icon with Validation Status */}
                             <div className="shrink-0 p-4 bg-black rounded-full border border-white/10 shadow-[0_0_30px_rgba(139,92,246,0.2)] relative">
                                 <ShieldCheck className="w-12 h-12 text-white" />
                                 {result.docking?.uniprotId && (
                                     <div className="absolute -bottom-2 -right-6 bg-emerald-500 text-black text-[9px] font-bold px-3 py-1 rounded-full border border-black flex items-center gap-1 shadow-lg">
                                         <CheckCircle2 className="w-3 h-3" /> PDB VALIDATED
                                     </div>
                                 )}
                             </div>
                             
                             <div>
                                 <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-widest mb-2">
                                     <Zap className="w-4 h-4" /> In-Silico Interaction Hypothesis
                                 </div>
                                 
                                 <h3 className="text-2xl font-brand font-bold text-white mb-2 leading-tight">
                                     {result.hypothesis}
                                 </h3>
                                 
                                 <div className="mt-4 p-4 bg-white/5 rounded-lg border-l-2 border-violet-500/50 backdrop-blur-md">
                                     <p className="text-slate-300 text-sm leading-relaxed font-mono">
                                         <span className="text-violet-300 font-bold uppercase mr-2">Molecular Rationale:</span>
                                         {result.detailedAnalysis?.dockingDynamics || result.convergenceInsight}
                                     </p>
                                 </div>
                             </div>
                        </div>
                    </MotionDiv>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- HELPER COMPONENTS ---

const SandboxCard: React.FC<any> = ({ title, icon: Icon, color, loading, status, children, analysisText, guideMode, guideText }) => {
    const colors: any = { violet: 'border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.1)]', cyan: 'border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]', amber: 'border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]', emerald: 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' };
    const textColor: any = { violet: 'text-violet-400', cyan: 'text-cyan-400', amber: 'text-amber-400', emerald: 'text-emerald-400' };

    return (
        <div className={`bg-[#050505] rounded-xl border ${colors[color]} relative flex flex-col h-[520px] overflow-hidden group transition-all duration-300`}>
             <div className="p-4 border-b border-white/5 bg-white/5 backdrop-blur-sm flex justify-between items-center z-10">
                 <div className="flex items-center gap-3">
                     <div className={`p-1.5 rounded bg-${color}-900/20 border border-${color}-500/30`}><Icon className={`w-4 h-4 ${textColor[color]}`} /></div>
                     <span className={`text-sm font-bold tracking-widest uppercase font-mono ${textColor[color]}`}>{title}</span>
                 </div>
                 <div className="flex items-center gap-2">
                     {loading && <Loader2 className={`w-3 h-3 animate-spin ${textColor[color]}`} />}
                     <span className="text-[9px] font-mono text-slate-500 bg-black/50 px-2 py-0.5 rounded border border-white/5">{status}</span>
                 </div>
             </div>
             <div className="flex-grow p-4 relative z-0 overflow-hidden flex flex-col">
                 <AnimatePresence>
                      {guideMode && guideText && (
                          <MotionDiv initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute inset-0 z-30 bg-black/90 p-6 flex flex-col justify-center items-center text-center">
                              <HelpCircle className={`w-8 h-8 ${textColor[color]} mb-3`} />
                              <p className="text-sm text-white font-medium leading-relaxed max-w-sm">{guideText}</p>
                          </MotionDiv>
                      )}
                 </AnimatePresence>
                 <div className="flex-grow">{children}</div>
                 {analysisText && !loading && (
                      <div className="mt-4 p-3 bg-slate-900/80 border-l-2 border-white/20 rounded-r text-[10px] text-slate-400 font-mono leading-relaxed relative animate-fade-in">
                          <div className="flex items-center gap-2 mb-1 text-xs font-bold text-white uppercase tracking-wider"><Terminal className="w-3 h-3 text-emerald-500" /> System Analysis</div>
                          {analysisText}
                      </div>
                 )}
             </div>
             <div className={`absolute inset-0 bg-${color}-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-500`}></div>
        </div>
    );
};

const StandbyMode: React.FC<any> = ({ icon: Icon, label, color, loading }) => (
    <div className="h-full flex flex-col items-center justify-center opacity-40 relative">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,black,transparent)]"></div>
        <div className={`p-6 rounded-full border-2 border-dashed border-slate-700 mb-4 ${loading ? 'animate-pulse' : ''}`}><Icon className={`w-12 h-12 text-slate-600`} /></div>
        <h3 className="text-lg font-brand font-bold text-slate-500 tracking-wide uppercase">{loading ? "Initializing..." : label}</h3>
        <p className="text-xs font-mono text-slate-600 mt-2">{loading ? "Accessing Secure Gateway" : "System Ready for Input"}</p>
    </div>
);

// --- VIZ COMPONENTS ---

const CyberNetworkGraph: React.FC<{nodes: NetworkNode[], links: NetworkLink[]}> = ({ nodes, links }) => {
    // Deterministic positions based on node index
    const width = 600;
    const height = 400;
    const centerX = width / 2;
    const centerY = height / 2;

    const positionedNodes = nodes.map((node, i) => {
        const angle = (i / nodes.length) * 2 * Math.PI;
        const radius = node.group === 'GENE' ? 0 : (node.group === 'PROTEIN' ? 100 : 160);
        return {
            ...node,
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
        };
    });

    return (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
            <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>
            {links.map((link, i) => {
                const source = positionedNodes.find(n => n.id === link.source);
                const target = positionedNodes.find(n => n.id === link.target);
                if (!source || !target) return null;
                return (
                    <g key={i}>
                        <line x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke="#1e293b" strokeWidth={1} />
                        <circle r="2" fill="#22d3ee">
                             <animateMotion dur={`${2 + i % 3}s`} repeatCount="indefinite" path={`M${source.x},${source.y} L${target.x},${target.y}`} />
                        </circle>
                    </g>
                );
            })}
            {positionedNodes.map((node, i) => {
                 const color = node.group === 'GENE' ? '#22d3ee' : (node.group === 'PROTEIN' ? '#a78bfa' : '#34d399');
                 return (
                    <g key={i}>
                        <circle cx={node.x} cy={node.y} r={node.group === 'GENE' ? 20 : 6} fill="#000" stroke={color} strokeWidth={2} filter="url(#glow)" />
                        {node.group === 'GENE' && (
                            <circle cx={node.x} cy={node.y} r="10" fill={color} opacity="0.5">
                                <animate attributeName="r" values="10;15;10" dur="2s" repeatCount="indefinite" />
                                <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2s" repeatCount="indefinite" />
                            </circle>
                        )}
                        <text x={node.x} y={node.y + 20} textAnchor="middle" fill={color} fontSize="10" fontFamily="monospace" fontWeight="bold">
                            {node.id}
                        </text>
                    </g>
                 )
            })}
        </svg>
    );
};

const StratificationViz: React.FC<{data: any[]}> = ({ data }) => {
    const sorted = [...data].sort((a, b) => b.predictedEfficacy - a.predictedEfficacy);
    const radiusStep = 25;
    const center = 150;
    
    return (
        <svg width="300" height="300" viewBox="0 0 300 300">
            {sorted.map((item, i) => {
                const r = 40 + (i * radiusStep);
                const circumference = 2 * Math.PI * r;
                const offset = circumference - (item.predictedEfficacy / 100) * circumference;
                const color = item.predictedEfficacy > 80 ? '#10b981' : item.predictedEfficacy > 50 ? '#f59e0b' : '#ef4444';
                
                return (
                    <g key={i}>
                        <circle cx={center} cy={center} r={r} fill="none" stroke="#1e293b" strokeWidth="6" />
                        <circle cx={center} cy={center} r={r} fill="none" stroke={color} strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={circumference} strokeLinecap="round" transform={`rotate(-90 ${center} ${center})`}>
                            <animate attributeName="stroke-dashoffset" from={circumference} to={offset} dur="1.5s" fill="freeze" />
                        </circle>
                        <text x={center + 5} y={center - r - 5} fill="#64748b" fontSize="8" fontFamily="monospace">{item.population}</text>
                        <text x={center + 5} y={center - r + 5} fill="white" fontSize="9" fontWeight="bold" fontFamily="monospace">{item.predictedEfficacy}%</text>
                    </g>
                );
            })}
             <circle cx={center} cy={center} r="10" fill="#334155" />
             <circle cx={center} cy={center} r="4" fill="#10b981"><animate attributeName="opacity" values="1;0.2;1" dur="2s" repeatCount="indefinite" /></circle>
        </svg>
    )
}

export default DiscoveryLab;
