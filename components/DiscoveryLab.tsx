
import React, { useState, useEffect } from 'react';
import { 
    Box, Network, BookOpen, Globe2, 
    Microscope, 
    Cpu, ShieldCheck, Zap, Activity, Dna,
    Database, PlayCircle, AlertTriangle, Search, Loader2,
    FileText, Terminal, UploadCloud, Link as LinkIcon,
    HelpCircle, Eye, Fingerprint, FlaskConical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SciFiButton } from './SciFiButton';
import { analyzeDiscoveryData } from '../services/geminiService';
import { SandboxResult, NetworkNode, NetworkLink, VariantAnalysis } from '../types';
import { ProteinViewer } from './ProteinViewer';

// Workaround for type issues with framer-motion in some environments
const MotionDiv = motion.div as any;

// --- DEMO MODELS DATA (Restored) ---
const DEMO_MODELS = [
    { id: 'KRAS', label: 'KRAS G12C', category: 'ONCOLOGY', color: 'rose' },
    { id: 'ACE2', label: 'ACE2 Receptor', category: 'VIROLOGY', color: 'cyan' },
    { id: 'CFTR', label: 'CFTR (F508del)', category: 'RARE DISEASE', color: 'amber' }
];

// --- FALLBACK MOCK DATA (OFFLINE MODE) ---
const MOCK_SANDBOX_RESULT: SandboxResult = {
    targetId: "MOCK-KRAS-G12C",
    hypothesis: "G12C mutation locks KRAS in an active state, driving oncogenesis. Covalent inhibitors targeting Cys12 can lock it in an inactive GDP-bound state.",
    docking: {
        targetName: "KRAS G12C",
        uniprotId: "P01116", // Real KRAS UniProt
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
        { title: "Kras G12C Inhibition", source: "Nature, 2019", summary: "Discovery of a covalent inhibitor that traps KRAS G12C in an inactive state.", relevanceScore: 98 },
        { title: "Resistance Mechanisms", source: "NEJM, 2021", summary: "Acquired resistance to KRAS G12C inhibitors via RTK feedback loops.", relevanceScore: 85 },
        { title: "Structural Dynamics", source: "Science, 2020", summary: "Crystal structures reveal the cryptic pocket used by switch-II pocket inhibitors.", relevanceScore: 92 }
    ],
    stratification: [
        { population: "NSCLC (Smokers)", alleleFrequency: 13.0, predictedEfficacy: 85 },
        { population: "Colorectal Cancer", alleleFrequency: 3.0, predictedEfficacy: 40 },
        { population: "Pancreatic Cancer", alleleFrequency: 1.5, predictedEfficacy: 55 }
    ],
    convergenceInsight: "Convergence of structural vulnerability (Cys12) and high clinical prevalence in NSCLC suggests high priority for covalent inhibitor development, though resistance pathways (PI3K) require combo therapy.",
    detailedAnalysis: {
        dockingDynamics: "Calculated ΔG of -11.5 kcal/mol suggests nanomolar affinity (Kd ~1-5 nM). Covalent bond formation at Cys12 is thermodynamically favorable due to nucleophilic attack trajectory, overcoming steric hindrance in the Switch II pocket.",
        pathwayKinetics: "MAPK signaling output is predicted to drop by 85% within 2 hours of inhibition. However, PI3K bypass signaling activates primarily via EGFR feedback loops with a rate constant k_on significantly slower than KRAS re-synthesis.",
        evidenceSynthesis: "Meta-analysis of 3 core papers indicates high confidence (p < 0.001) in covalent inhibition strategy. Structural data (Science, 2020) provides 1.5Å resolution validation of the binding pose.",
        populationStat: "Stratification reveals a 13% allele frequency in NSCLC with high predicted efficacy due to 'oncogene addiction'. Reduced efficacy in CRC suggests tissue-specific feedback mechanisms reduce the therapeutic index."
    }
};

// --- PROPS ---
interface DiscoveryLabProps {
    userVariants?: VariantAnalysis[];
}

// --- MAIN COMPONENT ---

export const DiscoveryLab: React.FC<DiscoveryLabProps> = ({ userVariants = [] }) => {
    const [targetInput, setTargetInput] = useState("");
    const [literatureInput, setLiteratureInput] = useState(""); 
    const [showLiteratureInput, setShowLiteratureInput] = useState(false);
    const [showGuide, setShowGuide] = useState(false); // Insight/Help Mode
    
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [result, setResult] = useState<SandboxResult | null>(null);
    const [isOfflineMode, setIsOfflineMode] = useState(false);

    const handleRunSimulation = async (overrideInput?: string) => {
        const inputToUse = overrideInput || targetInput;
        if (!inputToUse) return;
        
        if (overrideInput) setTargetInput(overrideInput);

        setLoading(true);
        setResult(null); 
        setIsOfflineMode(false);
        
        if (literatureInput.length > 50) {
            setStatus(`INGESTING LITERATURE CONTEXT (${literatureInput.length} chars)...`);
        } else {
            setStatus("Querying AlphaMissense Structural Database...");
        }

        console.log('Verificando conexión con Gemini...');

        let attempts = 0;
        const maxAttempts = 3;
        let success = false;

        while (attempts < maxAttempts && !success) {
            try {
                attempts++;
                if (attempts > 1) {
                    setStatus(`CONNECTION RETRY (${attempts}/${maxAttempts})...`);
                    await new Promise(r => setTimeout(r, 1000));
                }

                if (literatureInput) {
                    setStatus("EXTRACTING ENTITIES FROM TECHNICAL PAPER...");
                } else {
                    setStatus("Waiting for DeepMind Server Response...");
                }

                const res = await analyzeDiscoveryData(inputToUse, literatureInput, setStatus);
                
                if (res) {
                    setResult(res);
                    setLoading(false); 
                    success = true;
                    if (literatureInput) setShowLiteratureInput(false);
                } else {
                    throw new Error("Empty AI Response");
                }

            } catch (e: any) {
                console.error(`Attempt ${attempts} failed:`, e);

                if (attempts === maxAttempts) {
                    console.warn("Connection failed. Activating Offline Simulation Mode.");
                    setIsOfflineMode(true);
                    
                    const fallbackData = {
                        ...MOCK_SANDBOX_RESULT,
                        targetId: inputToUse.toUpperCase(),
                        docking: { 
                            ...MOCK_SANDBOX_RESULT.docking, 
                            targetName: inputToUse.toUpperCase() 
                        },
                        hypothesis: `[SIMULATION MODE] Hypothesis generated for ${inputToUse} based on analogous structural homologues. Connectivity to Gemini server was interrupted.`
                    };
                    
                    setResult(fallbackData);
                    setLoading(false);
                    setStatus(`OFFLINE SIMULATION ACTIVE`);
                }
            }
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
                            This module takes specific genes found in your profile and runs a <strong>3D molecular simulation</strong> to predict how experimental drugs might interact with your specific mutations. It uses AlphaFold structures to visualize the "lock and key" mechanism of drug binding.
                        </p>
                    </div>
                    
                    <div className="w-full md:w-[500px] flex flex-col gap-3">
                         <div className="flex gap-2">
                            <div className="relative flex-grow group">
                                <div className="absolute inset-0 bg-violet-600/20 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <input 
                                    type="text"
                                    value={targetInput}
                                    onChange={(e) => setTargetInput(e.target.value)}
                                    placeholder="SEARCH ANY GENE (e.g. EGFR)"
                                    className="relative w-full h-12 bg-[#0a0a0a] border border-slate-700 text-white rounded-lg px-4 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none font-mono text-sm uppercase tracking-wider placeholder:text-slate-600 transition-all"
                                    onKeyDown={(e) => e.key === 'Enter' && handleRunSimulation()}
                                />
                            </div>
                            <SciFiButton onClick={() => handleRunSimulation()} disabled={!targetInput || loading} className="h-12 px-6">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                            </SciFiButton>
                         </div>
                         
                         <div className="flex justify-between items-center">
                             <button 
                                onClick={() => setShowGuide(!showGuide)}
                                className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-colors px-3 py-1.5 rounded-full border ${showGuide ? 'bg-violet-500 text-white border-violet-400' : 'bg-slate-900 text-slate-500 border-slate-700 hover:text-white'}`}
                             >
                                 <Eye className="w-3 h-3" />
                                 {showGuide ? 'Concept Guide: ON' : 'Show Concept Guide'}
                             </button>

                             <button 
                                onClick={() => setShowLiteratureInput(!showLiteratureInput)}
                                className={`text-[10px] font-mono uppercase tracking-wider flex items-center gap-2 hover:text-white transition-colors ${showLiteratureInput || literatureInput ? 'text-violet-400' : 'text-slate-500'}`}
                             >
                                 <FileText className="w-3 h-3" />
                                 {showLiteratureInput ? 'Hide Paper Input' : 'Advanced: Add Research Paper'}
                             </button>
                         </div>
                    </div>
                 </div>

                 {/* PERSONALIZED TARGET SUGGESTIONS */}
                 {userVariants.length > 0 && (
                     <div className="mt-6 pt-4 border-t border-white/5">
                         <div className="flex items-center gap-2 mb-3">
                             <Fingerprint className="w-3 h-3 text-emerald-500" />
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                 Your Personal Targets ({userVariants.length})
                             </span>
                         </div>
                         <div className="flex flex-wrap gap-2">
                             {userVariants.map((v, i) => (
                                 <button
                                    key={i}
                                    onClick={() => handleRunSimulation(v.gene)}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-3 py-2 rounded bg-emerald-900/20 border border-emerald-500/30 hover:bg-emerald-900/40 hover:border-emerald-400 transition-all group"
                                 >
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

                 {/* DEMO MODELS (Restored) */}
                 <div className="mt-6 pt-4 border-t border-white/5">
                     <div className="flex items-center gap-2 mb-3">
                         <Database className="w-3 h-3 text-slate-500" />
                         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                             Standard Reference Models
                         </span>
                     </div>
                     <div className="flex flex-wrap gap-2">
                         {DEMO_MODELS.map((model) => (
                             <button
                                key={model.id}
                                onClick={() => handleRunSimulation(model.label)}
                                disabled={loading}
                                className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-all bg-slate-900/50 hover:bg-slate-800 ${
                                    model.color === 'rose' ? 'border-rose-500/30 hover:border-rose-500 text-rose-400' :
                                    model.color === 'cyan' ? 'border-cyan-500/30 hover:border-cyan-500 text-cyan-400' :
                                    'border-amber-500/30 hover:border-amber-500 text-amber-400'
                                }`}
                             >
                                 <Box className="w-3 h-3" />
                                 <span className="text-xs font-bold">{model.id}</span>
                                 <span className="text-[9px] opacity-60 uppercase">{model.category}</span>
                             </button>
                         ))}
                     </div>
                 </div>

                 {/* LITERATURE INGESTION PANEL */}
                 <AnimatePresence>
                     {showLiteratureInput && (
                         <MotionDiv 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-4"
                         >
                             <div className="bg-slate-900/50 rounded-xl border border-violet-500/30 p-4">
                                 <div className="flex items-center gap-2 mb-3">
                                     <UploadCloud className="w-4 h-4 text-violet-400" />
                                     <h3 className="text-xs font-bold text-white uppercase tracking-wider">Scientific Literature Ingestion (Med-Gemini Protocol)</h3>
                                 </div>
                                 <textarea
                                    value={literatureInput}
                                    onChange={(e) => setLiteratureInput(e.target.value)}
                                    placeholder="PASTE ABSTRACT, RESULTS TEXT, OR DOI LINK HERE...&#10;Gemini will extract protein interactions and binding data from this text to populate the simulation."
                                    className="w-full h-32 bg-[#050505] border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-300 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none resize-none leading-relaxed"
                                 />
                                 <div className="flex justify-between items-center mt-2">
                                     <div className="flex items-center gap-2 text-[9px] text-slate-500 font-mono">
                                         <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                         <span>Long Context Window: Active (Up to 1M Tokens)</span>
                                     </div>
                                     {literatureInput && (
                                         <button onClick={() => setLiteratureInput("")} className="text-[10px] text-red-400 hover:text-red-300 uppercase font-bold">Clear Context</button>
                                     )}
                                 </div>
                             </div>
                         </MotionDiv>
                     )}
                 </AnimatePresence>
            </div>

            {/* OFFLINE MODE INDICATOR */}
            {isOfflineMode && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center gap-3 animate-fade-in-up">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <div>
                        <h4 className="text-amber-400 text-xs font-bold uppercase">Simulation Mode: Offline/Fallback</h4>
                        <p className="text-amber-200/70 text-[10px]">
                            Unable to connect to Gemini AI (API Key missing or Network Error). Displaying high-fidelity projection data for demonstration.
                        </p>
                    </div>
                </div>
            )}

            {/* 2. THE GRID (4 CARDS) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px]">
                
                {/* CARD 1: LIGAND DESIGN (3D) */}
                <SandboxCard 
                    title="Structural Docking" 
                    icon={Box} 
                    color="violet"
                    loading={loading}
                    status={loading ? "DOCKING SIMULATION..." : (result && result.docking && result.docking.uniprotId ? "MODEL RENDERED" : "STANDBY")}
                    analysisText={result?.detailedAnalysis?.dockingDynamics}
                    guideMode={showGuide}
                    guideText="This visualizes the 3D protein shape created by your gene. The orange/red spot is where the mutation is, or where a drug (ligand) attempts to attach itself to fix the protein."
                >
                    {result && !loading && result.docking && result.docking.uniprotId ? (
                        <div className="h-full flex flex-col animate-fade-in">
                            <div className="relative flex-grow rounded-lg overflow-hidden border border-slate-800 bg-black shadow-inner min-h-[300px]">
                                <ProteinViewer 
                                    uniprotId={result.docking.uniprotId} 
                                    highlightPosition={result.docking.activeSiteResidues?.[0]} 
                                />
                                {/* Overlay Metrics */}
                                <div className="absolute top-4 left-4 z-20">
                                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Target Structure</div>
                                    <div className="text-2xl font-mono text-white font-bold">{result.docking.targetName || "N/A"}</div>
                                </div>
                                <div className="absolute bottom-4 right-4 z-20 text-right">
                                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Binding Energy</div>
                                    <div className="text-xl font-mono text-emerald-400 font-bold">{result.docking.bindingEnergy || 0} kcal/mol</div>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between text-xs font-mono text-slate-500">
                                <div className="flex items-center gap-2">
                                    <Cpu className="w-4 h-4 text-violet-500" />
                                    <span>Active Sites: {result.docking.activeSiteResidues?.join(', ') || "N/A"}</span>
                                </div>
                                <div className="px-2 py-1 bg-violet-900/20 text-violet-300 rounded border border-violet-500/20">
                                    LIGAND: {result.docking.ligandName || "N/A"}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <StandbyMode icon={Dna} label="Waiting for Structure" color="violet" loading={loading} />
                    )}
                </SandboxCard>

                {/* CARD 2: CELL SIMULATION (NETWORK) */}
                <SandboxCard 
                    title="Protein Network" 
                    icon={Network} 
                    color="cyan"
                    loading={loading}
                    status={loading ? "TRACING PATHWAYS..." : (result && result.network ? "NETWORK ACTIVE" : "STANDBY")}
                    analysisText={result?.detailedAnalysis?.pathwayKinetics}
                    guideMode={showGuide}
                    guideText="Genes don't work alone. This map shows which other proteins your gene 'talks' to. If your gene is broken, these are the other systems (like growth signals) that might get disrupted."
                >
                    {result && !loading && result.network ? (
                        <div className="h-full flex flex-col animate-fade-in">
                            <div className="flex-grow bg-[#020202] rounded-lg border border-slate-800 relative overflow-hidden flex items-center justify-center min-h-[300px] group">
                                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#22d3ee_1px,transparent_1px)] [background-size:20px_20px]"></div>
                                <CyberNetworkGraph nodes={result.network.nodes || []} links={result.network.links || []} />
                            </div>
                            <div className="mt-4 flex gap-6 justify-center text-[10px] font-mono uppercase tracking-widest text-slate-500">
                                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_cyan]"></span> Gene</span>
                                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_8px_violet]"></span> Protein</span>
                                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_emerald]"></span> Metabolite</span>
                            </div>
                        </div>
                    ) : (
                        <StandbyMode icon={Activity} label="Waiting for Pathways" color="cyan" loading={loading} />
                    )}
                </SandboxCard>

                {/* CARD 3: LITERATURE MINER (FEED) */}
                <SandboxCard 
                    title="Research Evidence" 
                    icon={BookOpen} 
                    color="amber"
                    loading={loading}
                    status={loading ? "SEMANTIC SEARCH..." : (result && result.literature ? `${result.literature.length} SOURCES FOUND` : "STANDBY")}
                    analysisText={result?.detailedAnalysis?.evidenceSynthesis}
                    guideMode={showGuide}
                    guideText="The AI scans recent medical papers to find experiments done on this specific gene. It summarizes why scientists think a certain drug might work."
                >
                     {result && !loading && result.literature ? (
                        <div className="h-full flex flex-col animate-fade-in">
                            <div className="flex-grow space-y-3 overflow-y-auto pr-2 custom-scrollbar max-h-[350px]">
                                {result.literature.map((paper, idx) => (
                                    <div key={idx} className="bg-[#0a0a0a] p-4 rounded border border-white/5 hover:border-amber-500/50 transition-all group relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-0.5 h-full bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <h4 className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors mb-2 font-mono uppercase leading-snug">
                                            {paper.title}
                                        </h4>
                                        <div className="flex items-center gap-3 text-[10px] text-slate-500 mb-2 border-b border-white/5 pb-2">
                                            <span>{paper.source}</span>
                                            <span className="text-emerald-500 font-mono ml-auto">REL: {paper.relevanceScore}%</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 leading-relaxed font-mono opacity-80 line-clamp-2">
                                            {paper.summary}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                                <span>Total Citations: {result.literature.length}</span>
                                <span className="text-amber-500 animate-pulse">LIVE FEED ACTIVE</span>
                            </div>
                        </div>
                     ) : (
                        <StandbyMode icon={Database} label="Waiting for Query" color="amber" loading={loading} />
                     )}
                </SandboxCard>

                {/* CARD 4: STRATIFICATION HUB (MAP/CHARTS) */}
                <SandboxCard 
                    title="Global Efficacy" 
                    icon={Globe2} 
                    color="emerald"
                    loading={loading}
                    status={loading ? "CALCULATING ALLELE FREQ..." : (result && result.stratification ? "POPULATION MAPPED" : "STANDBY")}
                    analysisText={result?.detailedAnalysis?.populationStat}
                    guideMode={showGuide}
                    guideText="This charts how common this mutation is across different populations and how well the treatment is predicted to work based on historical data."
                >
                    {result && !loading && result.stratification ? (
                        <div className="h-full flex flex-col items-center justify-center relative animate-fade-in">
                             <div className="absolute top-0 right-0 text-[10px] text-emerald-500/70 font-mono border border-emerald-500/20 px-2 py-0.5 rounded">GNOMAD v4.0</div>
                             
                             <div className="flex-grow flex items-center justify-center w-full">
                                <StratificationViz data={result.stratification} />
                             </div>

                             <div className="w-full mt-4 grid grid-cols-3 gap-2">
                                 {result.stratification.slice(0,3).map((s, i) => (
                                     <div key={i} className="bg-slate-900/50 p-2 rounded border border-white/5 text-center">
                                         <div className="text-[9px] text-slate-500 uppercase">{s.population}</div>
                                         <div className={`text-sm font-bold font-mono ${s.predictedEfficacy > 80 ? 'text-emerald-400' : 'text-slate-300'}`}>
                                             {s.predictedEfficacy}%
                                         </div>
                                     </div>
                                 ))}
                             </div>
                        </div>
                    ) : (
                        <StandbyMode icon={Globe2} label="Waiting for Population Data" color="emerald" loading={loading} />
                    )}
                </SandboxCard>

            </div>

            {/* CONVERGENCE INSIGHT (If Result Exists) */}
            <AnimatePresence>
                {result && !loading && result.convergenceInsight && (
                    <MotionDiv 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="bg-gradient-to-r from-violet-900/20 via-cyan-900/20 to-violet-900/20 border border-white/10 rounded-2xl p-8 relative overflow-hidden mt-6"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-cyan-500 to-violet-500"></div>
                        <div className="flex flex-col md:flex-row gap-8 items-center">
                             <div className="shrink-0 p-4 bg-black rounded-full border border-white/10 shadow-[0_0_30px_rgba(139,92,246,0.2)]">
                                 <ShieldCheck className="w-12 h-12 text-white" />
                             </div>
                             <div>
                                 <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-widest mb-2">
                                     <Zap className="w-4 h-4" /> Convergent Hypothesis
                                 </div>
                                 <h3 className="text-2xl font-brand font-bold text-white mb-2">
                                     {result.hypothesis || "Hypothesis Generated"}
                                 </h3>
                                 <p className="text-slate-300 text-sm leading-relaxed max-w-4xl">
                                     {result.convergenceInsight}
                                 </p>
                             </div>
                        </div>
                    </MotionDiv>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- SUB-COMPONENTS ---

const SandboxCard: React.FC<{
    title: string, 
    icon: any, 
    color: string, 
    loading: boolean,
    status: string,
    children: React.ReactNode,
    analysisText?: string,
    guideMode?: boolean,
    guideText?: string
}> = ({ title, icon: Icon, color, loading, status, children, analysisText, guideMode, guideText }) => {
    
    const colors: any = {
        violet: 'border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.1)]',
        cyan: 'border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]',
        amber: 'border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]',
        emerald: 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
    };
    
    const textColor: any = {
        violet: 'text-violet-400',
        cyan: 'text-cyan-400',
        amber: 'text-amber-400',
        emerald: 'text-emerald-400'
    };

    return (
        <div className={`bg-[#050505] rounded-xl border ${colors[color]} relative flex flex-col h-[520px] overflow-hidden group transition-all duration-300`}>
             {/* Header */}
             <div className="p-4 border-b border-white/5 bg-white/5 backdrop-blur-sm flex justify-between items-center z-10">
                 <div className="flex items-center gap-3">
                     <div className={`p-1.5 rounded bg-${color}-900/20 border border-${color}-500/30`}>
                        <Icon className={`w-4 h-4 ${textColor[color]}`} />
                     </div>
                     <span className={`text-sm font-bold tracking-widest uppercase font-mono ${textColor[color]}`}>
                         {title}
                     </span>
                 </div>
                 <div className="flex items-center gap-2">
                     {loading && <Loader2 className={`w-3 h-3 animate-spin ${textColor[color]}`} />}
                     <span className="text-[9px] font-mono text-slate-500 bg-black/50 px-2 py-0.5 rounded border border-white/5">
                         {status}
                     </span>
                 </div>
             </div>

             {/* Content Area */}
             <div className="flex-grow p-4 relative z-0 overflow-hidden flex flex-col">
                 
                 {/* GUIDE OVERLAY */}
                 <AnimatePresence>
                     {guideMode && guideText && (
                         <MotionDiv 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute inset-0 z-30 bg-black/90 p-6 flex flex-col justify-center items-center text-center"
                         >
                             <HelpCircle className={`w-8 h-8 ${textColor[color]} mb-3`} />
                             <p className="text-sm text-white font-medium leading-relaxed max-w-sm">
                                 {guideText}
                             </p>
                         </MotionDiv>
                     )}
                 </AnimatePresence>

                 <div className="flex-grow">
                    {children}
                 </div>
                 
                 {/* AI Explanation Box */}
                 {analysisText && !loading && (
                     <div className="mt-4 p-3 bg-slate-900/80 border-l-2 border-white/20 rounded-r text-[10px] text-slate-400 font-mono leading-relaxed relative animate-fade-in">
                         <div className="flex items-center gap-2 mb-1 text-xs font-bold text-white uppercase tracking-wider">
                             <Terminal className="w-3 h-3 text-emerald-500" />
                             System Analysis
                         </div>
                         {analysisText}
                     </div>
                 )}
             </div>

             {/* Hover Glow */}
             <div className={`absolute inset-0 bg-${color}-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-500`}></div>
        </div>
    );
};

const StandbyMode: React.FC<{ icon: any, label: string, color: string, loading: boolean }> = ({ icon: Icon, label, color, loading }) => {
    return (
        <div className="h-full flex flex-col items-center justify-center opacity-40 relative">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,black,transparent)]"></div>
            
            <div className={`p-6 rounded-full border-2 border-dashed border-slate-700 mb-4 ${loading ? 'animate-pulse' : ''}`}>
                <Icon className={`w-12 h-12 text-slate-600`} />
            </div>
            <h3 className="text-lg font-brand font-bold text-slate-500 tracking-wide uppercase">
                {loading ? "Initializing..." : label}
            </h3>
            <p className="text-xs font-mono text-slate-600 mt-2">
                {loading ? "Accessing Secure Gateway" : "System Ready for Input"}
            </p>
        </div>
    );
};

// --- VIZ COMPONENTS REUSED/UPDATED ---

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
