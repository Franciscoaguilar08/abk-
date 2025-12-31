
import React, { useState } from 'react';
import { 
    FlaskConical, Sparkles, Loader2, Search, 
    Box, Network, BookOpen, Globe2, 
    ArrowRight, Microscope, Target, Fingerprint,
    Maximize2, Minimize2, Cpu, Activity
} from 'lucide-react';
import { SciFiButton } from './SciFiButton';
import { analyzeDiscoveryData } from '../services/geminiService';
import { SandboxResult, NetworkNode, NetworkLink } from '../types';
import { ProteinViewer } from './ProteinViewer';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';

export const DiscoveryLab: React.FC = () => {
    const [targetInput, setTargetInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [result, setResult] = useState<SandboxResult | null>(null);
    const [expandedCard, setExpandedCard] = useState<string | null>(null);

    const handleRunSimulation = async () => {
        if (!targetInput) return;
        setLoading(true);
        setResult(null);
        try {
            const res = await analyzeDiscoveryData(targetInput, setStatus);
            setResult(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedCard(expandedCard === id ? null : id);
    };

    return (
        <div className="w-full max-w-7xl mx-auto pb-20 space-y-8">
            
            {/* Header / Input Section */}
            <div className="glass-panel p-8 rounded-2xl border-b-4 border-b-violet-500 relative overflow-hidden animate-fade-in-up">
                <div className="absolute top-0 right-0 p-12 opacity-5">
                    <FlaskConical className="w-64 h-64 text-violet-400" />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-900/30 border border-violet-500/30 text-violet-300 text-xs font-bold uppercase tracking-wider mb-4">
                            <Sparkles className="w-3 h-3" /> Innovation Sandbox
                        </div>
                        <h2 className="text-4xl font-brand font-bold text-white mb-2">Molecular Target Discovery</h2>
                        <p className="text-slate-400">
                            Enter a gene symbol or protein target (e.g., EGFR, KRAS) to activate the 4-module R&D simulation engine.
                        </p>
                    </div>

                    <div className="w-full md:w-auto flex flex-col gap-4">
                        <div className="relative w-full md:w-96">
                            <input 
                                type="text"
                                value={targetInput}
                                onChange={(e) => setTargetInput(e.target.value)}
                                placeholder="Target ID (e.g. EGFR, KRAS, TP53)"
                                className="w-full h-14 bg-slate-900/80 border border-slate-700 text-white rounded-xl px-5 py-3 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none pl-12 font-mono text-lg uppercase placeholder:normal-case placeholder:text-slate-600"
                                onKeyDown={(e) => e.key === 'Enter' && handleRunSimulation()}
                            />
                            <Search className="absolute left-4 top-4.5 w-6 h-6 text-slate-500" />
                        </div>
                        <SciFiButton onClick={handleRunSimulation} disabled={!targetInput || loading} className="w-full justify-center">
                            INITIATE SIMULATION
                            <ArrowRight className="w-4 h-4" />
                        </SciFiButton>
                    </div>
                </div>
            </div>

            {/* LOADING OVERLAY */}
            {loading && (
                 <div className="glass-panel p-20 rounded-2xl flex flex-col items-center justify-center border border-violet-500/30 animate-pulse">
                     <div className="relative mb-8">
                         <div className="absolute inset-0 bg-violet-500 blur-xl opacity-20 animate-pulse"></div>
                         <Loader2 className="w-16 h-16 text-violet-500 animate-spin relative z-10" />
                     </div>
                     <h3 className="text-2xl font-brand font-bold text-white mb-2 tracking-wide">Synthesizing Digital Twin</h3>
                     <div className="flex items-center gap-3">
                        <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce delay-100"></span>
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-200"></span>
                     </div>
                     <p className="text-violet-300 font-mono text-sm mt-4 uppercase tracking-widest">{status}</p>
                 </div>
            )}

            {/* DASHBOARD GRID - ALWAYS VISIBLE */}
            {!loading && (
                <div className="space-y-8 animate-fade-in-up">
                    
                    {/* ROW 1 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* 1. LIGAND ARCHITECT */}
                        <SandboxCard 
                            id="ligand"
                            title="Ligand Architect" 
                            icon={Box} 
                            color="violet"
                            expanded={expandedCard === 'ligand'}
                            onToggle={() => toggleExpand('ligand')}
                        >
                            {result ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end border-b border-white/5 pb-2">
                                        <div>
                                            <div className="text-[10px] uppercase text-slate-500 font-bold">Target Structure</div>
                                            <div className="text-2xl font-mono text-white font-bold">{result.docking.pdbId}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] uppercase text-slate-500 font-bold">Binding Energy</div>
                                            <div className="text-xl font-mono text-emerald-400 font-bold">{result.docking.bindingEnergy} <span className="text-xs text-slate-500">kcal/mol</span></div>
                                        </div>
                                    </div>
                                    <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-black/50">
                                        <ProteinViewer pdbId={result.docking.pdbId} highlightPosition={result.docking.activeSiteResidues[0]} />
                                        <div className="absolute top-4 left-4 bg-black/70 backdrop-blur px-3 py-1 rounded border border-violet-500/30 text-xs text-violet-300">
                                            Ligand: <strong>{result.docking.ligandName}</strong>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 italic">
                                        Active site residues {result.docking.activeSiteResidues.join(', ')} highlighted. Structural stability confirmed.
                                    </p>
                                </div>
                            ) : (
                                <PlaceholderState 
                                    icon={Box} 
                                    title="3D Structural Docking" 
                                    desc="Waiting to initialize PDB retrieval and ligand binding simulation." 
                                />
                            )}
                        </SandboxCard>

                        {/* 2. SYSTEM PERTURBATION */}
                        <SandboxCard 
                            id="network"
                            title="System Perturbation" 
                            icon={Network} 
                            color="cyan"
                            expanded={expandedCard === 'network'}
                            onToggle={() => toggleExpand('network')}
                        >
                            {result ? (
                                <div className="h-full flex flex-col">
                                    <p className="text-xs text-slate-400 mb-4">
                                        Metabolic network impact analysis. Visualizing downstream effects of {result.targetId} modulation.
                                    </p>
                                    <div className="flex-grow bg-slate-900/50 rounded-lg border border-slate-800 relative overflow-hidden min-h-[300px] flex items-center justify-center">
                                        <NetworkGraph nodes={result.network.nodes} links={result.network.links} />
                                    </div>
                                    <div className="mt-3 flex gap-4 text-[10px] text-slate-500 uppercase tracking-wider font-bold justify-center">
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400"></span> Gene</span>
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-400"></span> Protein</span>
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Metabolite</span>
                                    </div>
                                </div>
                            ) : (
                                <PlaceholderState 
                                    icon={Activity} 
                                    title="Network Topology" 
                                    desc="Awaiting target to generate metabolic force-directed graph." 
                                />
                            )}
                        </SandboxCard>
                    </div>

                    {/* ROW 2 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* 3. INSIGHT MINER */}
                        <SandboxCard 
                            id="insight"
                            title="Insight Miner" 
                            icon={BookOpen} 
                            color="amber"
                            expanded={expandedCard === 'insight'}
                            onToggle={() => toggleExpand('insight')}
                        >
                            {result ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                         <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Semantic Literature Search</span>
                                         <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] rounded border border-amber-500/20 font-bold">LIVE AGENT</span>
                                    </div>
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {result.literature.map((paper, idx) => (
                                            <div key={idx} className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 hover:border-amber-500/30 transition-colors group">
                                                <h4 className="text-sm font-bold text-slate-200 group-hover:text-amber-400 transition-colors mb-1">
                                                    {paper.title}
                                                </h4>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-2">
                                                    <span className="uppercase font-semibold">{paper.source}</span>
                                                    <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                                    <span className="text-emerald-500">Relevance: {paper.relevanceScore}%</span>
                                                </div>
                                                <p className="text-xs text-slate-400 leading-relaxed">
                                                    {paper.summary}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <PlaceholderState 
                                    icon={Search} 
                                    title="Literature Agent" 
                                    desc="Semantic search engine standby. Ready to query PubMed corpus." 
                                />
                            )}
                        </SandboxCard>

                        {/* 4. STRATIFICATION ENGINE */}
                        <SandboxCard 
                            id="strat"
                            title="Stratification Engine" 
                            icon={Globe2} 
                            color="emerald"
                            expanded={expandedCard === 'strat'}
                            onToggle={() => toggleExpand('strat')}
                        >
                             {result ? (
                                 <div className="h-full flex flex-col">
                                    <p className="text-xs text-slate-400 mb-4">
                                        Global allele frequency analysis (gnomAD) to predict population-specific therapeutic efficacy.
                                    </p>
                                    <div className="flex-grow min-h-[250px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={result.stratification} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" opacity={0.3} />
                                                <XAxis type="number" domain={[0, 1]} hide />
                                                <YAxis dataKey="population" type="category" width={80} tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                                                <Tooltip 
                                                    contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px'}}
                                                    itemStyle={{color: '#e2e8f0', fontSize: '12px'}}
                                                    cursor={{fill: '#ffffff', opacity: 0.05}}
                                                />
                                                <Bar dataKey="predictedEfficacy" name="Efficacy %" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12}>
                                                    {result.stratification.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.predictedEfficacy > 80 ? '#10b981' : entry.predictedEfficacy > 50 ? '#f59e0b' : '#ef4444'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                 </div>
                             ) : (
                                <PlaceholderState 
                                    icon={Globe2} 
                                    title="Population Data" 
                                    desc="Awaiting target for gnomAD frequency & efficacy stratification." 
                                />
                             )}
                        </SandboxCard>
                    </div>

                    {/* CONVERGENCE PANEL */}
                    {result && (
                        <div className="glass-panel p-8 rounded-2xl border-t-4 border-t-white/10 relative overflow-hidden flex flex-col items-center text-center animate-fade-in-up">
                             <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-cyan-500/5"></div>
                             <div className="relative z-10 max-w-3xl">
                                 <div className="inline-flex items-center gap-2 mb-4 text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">
                                     <Microscope className="w-4 h-4" /> Convergent Analysis
                                 </div>
                                 <h3 className="text-2xl md:text-3xl font-brand font-bold text-white mb-6">
                                     {result.hypothesis}
                                 </h3>
                                 <p className="text-slate-300 leading-loose text-sm md:text-base border-l-2 border-violet-500/50 pl-6 text-left bg-slate-900/30 p-6 rounded-r-xl">
                                     {result.convergenceInsight}
                                 </p>
                                 <div className="mt-8 flex justify-center gap-4">
                                     <button className="px-6 py-2 bg-white text-slate-900 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-200 transition-colors">
                                         Export Protocol
                                     </button>
                                     <button className="px-6 py-2 border border-slate-600 text-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider hover:border-white hover:text-white transition-colors">
                                         Save to R&D Cloud
                                     </button>
                                 </div>
                             </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- SUB-COMPONENTS ---

const PlaceholderState: React.FC<{icon: React.ElementType, title: string, desc: string}> = ({icon: Icon, title, desc}) => (
    <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
        <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-4 relative">
             <div className="absolute inset-0 border border-white/5 rounded-full animate-ping opacity-20"></div>
             <Icon className="w-6 h-6 text-slate-400" />
        </div>
        <h4 className="text-slate-300 font-bold uppercase tracking-widest text-xs mb-2">{title}</h4>
        <p className="text-slate-500 text-xs max-w-[200px]">{desc}</p>
        <div className="mt-4 flex gap-1">
            <div className="w-1 h-1 bg-slate-600 rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-slate-600 rounded-full animate-bounce delay-100"></div>
            <div className="w-1 h-1 bg-slate-600 rounded-full animate-bounce delay-200"></div>
        </div>
    </div>
);

interface SandboxCardProps {
    id: string;
    title: string;
    icon: React.ElementType;
    color: 'violet' | 'cyan' | 'amber' | 'emerald';
    children: React.ReactNode;
    expanded: boolean;
    onToggle: () => void;
}

const SandboxCard: React.FC<SandboxCardProps> = ({ id, title, icon: Icon, color, children, expanded, onToggle }) => {
    
    const colorClasses = {
        violet: 'border-violet-500/20 hover:border-violet-500/50 text-violet-400 bg-violet-500/10',
        cyan: 'border-cyan-500/20 hover:border-cyan-500/50 text-cyan-400 bg-cyan-500/10',
        amber: 'border-amber-500/20 hover:border-amber-500/50 text-amber-400 bg-amber-500/10',
        emerald: 'border-emerald-500/20 hover:border-emerald-500/50 text-emerald-400 bg-emerald-500/10',
    };

    return (
        <div className={`glass-panel rounded-xl transition-all duration-500 flex flex-col ${expanded ? 'lg:col-span-2 row-span-2' : ''} border ${colorClasses[color].split(' ')[0]} hover:shadow-2xl group`}>
            {/* Card Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colorClasses[color].split(' ').slice(2).join(' ')} border border-white/5`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-brand font-bold text-white">{title}</h3>
                </div>
                <button 
                    onClick={onToggle}
                    className="text-slate-500 hover:text-white transition-colors"
                >
                    {expanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
            </div>
            
            {/* Card Content */}
            <div className={`p-6 flex-grow ${expanded ? 'h-[500px]' : 'h-[320px]'} overflow-hidden transition-all duration-500 relative`}>
                {children}
            </div>

            {/* Micro-Animation Border Bottom */}
            <div className={`h-0.5 w-full bg-gradient-to-r from-transparent via-${color}-500 to-transparent opacity-0 group-hover:opacity-50 transition-opacity duration-700`}></div>
        </div>
    );
};

// Simple SVG Network Graph for visualization
const NetworkGraph: React.FC<{nodes: NetworkNode[], links: NetworkLink[]}> = ({ nodes, links }) => {
    // Determine positions deterministically for stability based on node count
    const width = 400;
    const height = 300;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Map nodes to positions in a circle/star layout
    const positionedNodes = nodes.map((node, i) => {
        const angle = (i / nodes.length) * 2 * Math.PI;
        const radius = node.group === 'GENE' ? 0 : (node.group === 'PROTEIN' ? 80 : 140);
        return {
            ...node,
            x: centerX + Math.cos(angle) * radius + (Math.random() * 20 - 10),
            y: centerY + Math.sin(angle) * radius + (Math.random() * 20 - 10)
        };
    });

    const getNodeColor = (group: string) => {
        if (group === 'GENE') return '#22d3ee'; // Cyan
        if (group === 'PROTEIN') return '#8b5cf6'; // Violet
        return '#10b981'; // Emerald
    };

    return (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="22" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
                </marker>
            </defs>
            
            {/* Links */}
            {links.map((link, i) => {
                const source = positionedNodes.find(n => n.id === link.source);
                const target = positionedNodes.find(n => n.id === link.target);
                if (!source || !target) return null;
                
                return (
                    <line 
                        key={i}
                        x1={source.x} y1={source.y}
                        x2={target.x} y2={target.y}
                        stroke="#475569"
                        strokeWidth={1}
                        opacity={0.5}
                        markerEnd="url(#arrowhead)"
                    />
                );
            })}

            {/* Nodes */}
            {positionedNodes.map((node, i) => (
                <g key={i}>
                    <circle 
                        cx={node.x} cy={node.y} 
                        r={node.group === 'GENE' ? 15 : 8 + (node.impactScore * 5)} 
                        fill={getNodeColor(node.group)}
                        stroke="rgba(0,0,0,0.5)"
                        strokeWidth={2}
                        className="transition-all duration-300 hover:r-20 cursor-pointer"
                    >
                        <animate attributeName="r" values={`${8 + (node.impactScore * 5)};${10 + (node.impactScore * 5)};${8 + (node.impactScore * 5)}`} dur={`${2 + Math.random()}s`} repeatCount="indefinite" />
                    </circle>
                    <text 
                        x={node.x} y={node.y + 20} 
                        textAnchor="middle" 
                        fill="#94a3b8" 
                        fontSize="10" 
                        fontWeight="bold"
                        className="select-none pointer-events-none"
                    >
                        {node.id}
                    </text>
                </g>
            ))}
        </svg>
    );
};
