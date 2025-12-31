import React, { useState, useEffect } from 'react';
import { 
    Box, Network, BookOpen, Globe2, 
    ArrowRight, Microscope, Maximize2, Minimize2, 
    Cpu, ShieldCheck, Zap, Activity, Scan, Dna,
    Share2, Search, Loader2, Database, PlayCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SciFiButton } from './SciFiButton';
import { analyzeDiscoveryData } from '../services/geminiService';
import { SandboxResult, NetworkNode, NetworkLink } from '../types';
import { ProteinViewer } from './ProteinViewer';

// --- DEMO MODELS DATA ---
const DEMO_MODELS = [
    { id: 'KRAS', label: 'KRAS G12C', category: 'ONCOLOGY', color: 'rose' },
    { id: 'ACE2', label: 'ACE2 Receptor', category: 'VIROLOGY', color: 'cyan' },
    { id: 'CFTR', label: 'CFTR (F508del)', category: 'RARE DISEASE', color: 'amber' },
    { id: 'PSEN1', label: 'PSEN1', category: 'NEUROLOGY', color: 'violet' }
];

// --- CUSTOM HOOKS ---
const useScrambleText = (text: string, active: boolean) => {
    const [display, setDisplay] = useState(text);
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    useEffect(() => {
        if (!active) {
            setDisplay(text);
            return;
        }
        let iterations = 0;
        const interval = setInterval(() => {
            setDisplay(prev => 
                text.split("").map((letter, index) => {
                    if (index < iterations) return text[index];
                    return chars[Math.floor(Math.random() * chars.length)];
                }).join("")
            );
            if (iterations >= text.length) clearInterval(interval);
            iterations += 1 / 2;
        }, 30);
        return () => clearInterval(interval);
    }, [text, active]);

    return display;
};

const ScrambleText: React.FC<{ text: string, className?: string }> = ({ text, className }) => {
    const scrambled = useScrambleText(text, true);
    return <span className={className}>{scrambled}</span>;
};

// --- MAIN COMPONENT ---

export const DiscoveryLab: React.FC = () => {
    const [targetInput, setTargetInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [result, setResult] = useState<SandboxResult | null>(null);

    const handleRunSimulation = async (overrideInput?: string) => {
        const inputToUse = overrideInput || targetInput;
        if (!inputToUse) return;
        
        if (overrideInput) setTargetInput(overrideInput);

        setLoading(true);
        setResult(null); // Clear previous to show scanning effect
        try {
            const res = await analyzeDiscoveryData(inputToUse, setStatus);
            setResult(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-[1400px] mx-auto pb-20 space-y-6 text-slate-200 font-sans">
            
            {/* 1. HEADER & SEARCH CORE */}
            <div className="relative z-10 bg-[#020617]/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-2xl">
                 <div className="flex flex-col md:flex-row items-end gap-6 justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-violet-400 mb-2">
                             <Microscope className="w-5 h-5" />
                             <span className="text-xs font-bold tracking-[0.2em] uppercase font-mono">R&D Innovation Sandbox</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-brand font-bold text-white tracking-tight">
                            Target <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Discovery Engine</span>
                        </h1>
                    </div>
                    
                    <div className="w-full md:w-[500px] flex gap-2">
                         <div className="relative flex-grow group">
                             <div className="absolute inset-0 bg-violet-600/20 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                             <input 
                                type="text"
                                value={targetInput}
                                onChange={(e) => setTargetInput(e.target.value)}
                                placeholder="ENTER GENE OR PROTEIN ID (e.g. KRAS)"
                                className="relative w-full h-12 bg-[#0a0a0a] border border-slate-700 text-white rounded-lg px-4 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none font-mono text-sm uppercase tracking-wider placeholder:text-slate-600"
                                onKeyDown={(e) => e.key === 'Enter' && handleRunSimulation()}
                             />
                         </div>
                         <SciFiButton onClick={() => handleRunSimulation()} disabled={!targetInput || loading} className="h-12 px-6">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                         </SciFiButton>
                    </div>
                 </div>

                 {/* NEW: PRE-LOADED MODELS BAR */}
                 <div className="mt-6 pt-4 border-t border-white/5 flex flex-col md:flex-row items-start md:items-center gap-4">
                     <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono uppercase tracking-widest shrink-0">
                        <Database className="w-3 h-3" />
                        <span>Load Demo Model:</span>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {DEMO_MODELS.map((demo) => {
                            // Dynamic color mapping for button styles
                            const colorStyles: any = {
                                rose: 'border-rose-500/30 text-rose-400 hover:bg-rose-900/20',
                                cyan: 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/20',
                                amber: 'border-amber-500/30 text-amber-400 hover:bg-amber-900/20',
                                violet: 'border-violet-500/30 text-violet-400 hover:bg-violet-900/20'
                            };
                            return (
                                <button
                                    key={demo.id}
                                    onClick={() => handleRunSimulation(demo.id)}
                                    disabled={loading}
                                    className={`group px-3 py-1.5 rounded bg-slate-900/50 border ${colorStyles[demo.color]} transition-all flex items-center gap-2 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    <div className="flex flex-col text-left">
                                        <span className="text-xs font-bold">{demo.label}</span>
                                        <span className="text-[8px] font-mono text-slate-500 group-hover:text-slate-300">{demo.category}</span>
                                    </div>
                                    <PlayCircle className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity -ml-2 group-hover:ml-0" />
                                </button>
                            );
                        })}
                     </div>
                 </div>
            </div>

            {/* 2. THE GRID (4 CARDS) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px]">
                
                {/* CARD 1: LIGAND DESIGN (3D) */}
                <SandboxCard 
                    title="Ligand Architect" 
                    icon={Box} 
                    color="violet"
                    loading={loading}
                    status={loading ? "DOCKING SIMULATION..." : (result ? "MODEL RENDERED" : "STANDBY")}
                >
                    {result ? (
                        <div className="h-full flex flex-col">
                            <div className="relative flex-grow rounded-lg overflow-hidden border border-slate-800 bg-black shadow-inner min-h-[300px]">
                                <ProteinViewer pdbId={result.docking.pdbId} highlightPosition={result.docking.activeSiteResidues[0]} />
                                {/* Overlay Metrics */}
                                <div className="absolute top-4 left-4 z-20">
                                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Target Structure</div>
                                    <div className="text-2xl font-mono text-white font-bold">{result.docking.pdbId}</div>
                                </div>
                                <div className="absolute bottom-4 right-4 z-20 text-right">
                                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Binding Energy</div>
                                    <div className="text-xl font-mono text-emerald-400 font-bold">{result.docking.bindingEnergy} kcal/mol</div>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between text-xs font-mono text-slate-500">
                                <div className="flex items-center gap-2">
                                    <Cpu className="w-4 h-4 text-violet-500" />
                                    <span>Active Sites: {result.docking.activeSiteResidues.join(', ')}</span>
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
                    title="Cell Simulation" 
                    icon={Network} 
                    color="cyan"
                    loading={loading}
                    status={loading ? "TRACING PATHWAYS..." : (result ? "NETWORK ACTIVE" : "STANDBY")}
                >
                    {result ? (
                        <div className="h-full flex flex-col">
                            <div className="flex-grow bg-[#020202] rounded-lg border border-slate-800 relative overflow-hidden flex items-center justify-center min-h-[300px] group">
                                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#22d3ee_1px,transparent_1px)] [background-size:20px_20px]"></div>
                                <CyberNetworkGraph nodes={result.network.nodes} links={result.network.links} />
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
                    title="Literature Miner" 
                    icon={BookOpen} 
                    color="amber"
                    loading={loading}
                    status={loading ? "SEMANTIC SEARCH..." : (result ? `${result.literature.length} SOURCES FOUND` : "STANDBY")}
                >
                     {result ? (
                        <div className="h-full flex flex-col">
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
                    title="Stratification Hub" 
                    icon={Globe2} 
                    color="emerald"
                    loading={loading}
                    status={loading ? "CALCULATING ALLELE FREQ..." : (result ? "POPULATION MAPPED" : "STANDBY")}
                >
                    {result ? (
                        <div className="h-full flex flex-col items-center justify-center relative">
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
                {result && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="bg-gradient-to-r from-violet-900/20 via-cyan-900/20 to-violet-900/20 border border-white/10 rounded-2xl p-8 relative overflow-hidden"
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
                                     {result.hypothesis}
                                 </h3>
                                 <p className="text-slate-300 text-sm leading-relaxed max-w-4xl">
                                     {result.convergenceInsight}
                                 </p>
                             </div>
                        </div>
                    </motion.div>
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
    children: React.ReactNode 
}> = ({ title, icon: Icon, color, loading, status, children }) => {
    
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
        <div className={`bg-[#050505] rounded-xl border ${colors[color]} relative flex flex-col h-[450px] overflow-hidden group`}>
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
             <div className="flex-grow p-4 relative z-0 overflow-hidden">
                 {children}
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