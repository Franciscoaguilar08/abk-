
import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { Loader2, Cuboid, Crosshair, AlertTriangle, ShieldCheck, Info, Layers, RefreshCw, Box, Circle, Hexagon, Download, MousePointer2, ExternalLink, Dna, Activity, ScanLine } from 'lucide-react';

declare const $3Dmol: any;

interface ProteinViewerProps {
    pdbId?: string; // Legacy/Fallback (RCSB)
    uniprotId?: string; // Primary (AlphaFold)
    highlightPosition?: number;
}

type VisualStyle = 'cartoon' | 'stick' | 'sphere' | 'surface';

export const ProteinViewer: React.FC<ProteinViewerProps> = ({ pdbId, uniprotId, highlightPosition }) => {
    const viewerRef = useRef<HTMLDivElement>(null);
    const glRef = useRef<any>(null); // Reference to the 3Dmol instance
    const containerRef = useRef<HTMLDivElement>(null);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    
    // Viewer State
    const [style, setStyle] = useState<VisualStyle>('cartoon');
    const [isSpinning, setIsSpinning] = useState(true);
    const [resolvedSource, setResolvedSource] = useState<'ALPHAFOLD' | 'RCSB_PDB'>('ALPHAFOLD');
    const [resolvedId, setResolvedId] = useState<string>("");
    const [modelMetadata, setModelMetadata] = useState<{atoms: number, residues: number} | null>(null);

    // --- RESIZE OBSERVER TO PREVENT WEBGL CRASHES ---
    useLayoutEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                     if (glRef.current) {
                         glRef.current.resize();
                     }
                }
            }
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // --- INITIALIZATION & DATA FETCHING ---
    useEffect(() => {
        let isMounted = true;
        const currentViewerRef = viewerRef.current;

        // Cleanup function for WebGL context
        const cleanup = () => {
             if (glRef.current) {
                 try {
                     // 3Dmol doesn't have a strict destroy, but we can clear
                     glRef.current.clear();
                 } catch (e) {
                     // ignore cleanup errors
                 }
             }
        };

        const fetchAlphaFold = async (uid: string) => {
            // AlphaFold Fetch Strategy: Try v4, if 404 then try v2 (skipping v3/v1 to save requests)
            const versions = [4, 2]; 
            for (const v of versions) {
                try {
                    const url = `https://alphafold.ebi.ac.uk/files/AF-${uid}-F1-model_v${v}.pdb`;
                    const res = await fetch(url, { method: 'HEAD' }); // Check existence first to avoid console error spam
                    if (res.ok) {
                        const dataRes = await fetch(url);
                        return await dataRes.text();
                    }
                } catch (e) {
                    continue;
                }
            }
            throw new Error(`AF-${uid} not found`);
        };

        const fetchPDB = async (pid: string) => {
            const res = await fetch(`https://files.rcsb.org/download/${pid}.pdb`);
            if (!res.ok) throw new Error(`PDB ${pid} not found`);
            return await res.text();
        };

        const initViewer = async () => {
            // WAIT FOR DOM LAYOUT (Fixes Framebuffer Incomplete Error)
            await new Promise(resolve => requestAnimationFrame(resolve));
            
            if (!currentViewerRef || !isMounted) return;
            if (currentViewerRef.clientWidth === 0 || currentViewerRef.clientHeight === 0) {
                 // Retry once if size is 0
                 await new Promise(resolve => setTimeout(resolve, 200));
                 if (!currentViewerRef || currentViewerRef.clientWidth === 0) {
                     console.warn("Viewer container has 0 size, skipping render.");
                     return; 
                 }
            }

            let targetId = (uniprotId || pdbId || "").trim().toUpperCase().split('.')[0];
            if (!targetId) {
                if(isMounted) setLoading(false);
                return;
            }

            if (typeof $3Dmol === 'undefined') {
                console.warn("3Dmol library not loaded");
                if(isMounted) setError(true);
                if(isMounted) setLoading(false);
                return;
            }

            if(isMounted) setLoading(true);
            if(isMounted) setError(false);

            try {
                // Initialize 3Dmol Viewer
                if (!glRef.current) {
                    const config = { backgroundColor: '#020617', antialias: true };
                    glRef.current = $3Dmol.createViewer(currentViewerRef, config);
                }
                const viewer = glRef.current;
                viewer.clear();

                let pdbData = "";
                let finalSource: 'ALPHAFOLD' | 'RCSB_PDB' = 'ALPHAFOLD';
                let finalId = targetId;

                // --- SMART FETCH STRATEGY ---
                if (uniprotId) {
                    try {
                        pdbData = await fetchAlphaFold(uniprotId);
                        finalSource = 'ALPHAFOLD';
                        finalId = uniprotId;
                    } catch (afError) {
                        if (pdbId) {
                            try {
                                pdbData = await fetchPDB(pdbId);
                                finalSource = 'RCSB_PDB';
                                finalId = pdbId;
                            } catch (pdbError) {
                                throw new Error("Structure not found in AlphaFold or PDB.");
                            }
                        } else {
                            throw afError;
                        }
                    }
                } else if (pdbId) {
                    try {
                        pdbData = await fetchPDB(pdbId);
                        finalSource = 'RCSB_PDB';
                        finalId = pdbId;
                    } catch (e) {
                         throw new Error("PDB ID not found.");
                    }
                }

                if (!isMounted) return;

                setResolvedSource(finalSource);
                setResolvedId(finalId);
                
                // Load Model
                viewer.addModel(pdbData, "pdb");
                
                // Extract Metadata for UI
                const model = viewer.getModel();
                if (model) {
                    const atoms = model.selectedAtoms({});
                    setModelMetadata({
                        atoms: atoms.length,
                        residues: new Set(atoms.map((a: any) => a.resi)).size
                    });

                    // Initial Render
                    applyStyle(viewer, 'cartoon', highlightPosition, finalSource); // Default style
                    viewer.zoomTo();
                    viewer.render();
                } else {
                    throw new Error("Parsed model is empty");
                }
                
                setLoading(false);

            } catch (e: any) {
                console.warn(`3D Viewer Error: ${e.message}`);
                if(isMounted) setError(true);
                if(isMounted) setLoading(false);
            }
        };

        initViewer();

        return cleanup;
    }, [uniprotId, pdbId]);

    // --- STYLE & RENDER LOGIC ---
    const applyStyle = (viewer: any, visualStyle: VisualStyle, highlightPos?: number, source?: string) => {
        if (!viewer) return;
        
        try {
            viewer.removeAllSurfaces();
            viewer.setStyle({}, {}); // Clear previous styles

            const colorScheme = source === 'ALPHAFOLD' 
                ? { prop: 'b', gradient: 'roygb', min: 50, max: 90 } // pLDDT Confidence
                : { color: '#64748b' }; // Standard Slate

            // 1. Base Protein Style
            switch (visualStyle) {
                case 'cartoon':
                    viewer.setStyle({}, { cartoon: { ...colorScheme, style: 'oval', thickness: 0.3 } });
                    break;
                case 'stick':
                    viewer.setStyle({}, { stick: { radius: 0.15, colorscheme: 'Jmol' } });
                    break;
                case 'sphere':
                    viewer.setStyle({}, { sphere: { scale: 0.8, colorscheme: 'Jmol' } });
                    break;
                case 'surface':
                    viewer.setStyle({}, { cartoon: { ...colorScheme, opacity: 0.5 } });
                    viewer.addSurface($3Dmol.SurfaceType.VDW, { opacity: 0.4, color: 'white' });
                    break;
            }

            // 2. Highlight Specific Mutation (Active Site / Variant)
            if (highlightPos) {
                const selection = { resi: highlightPos };
                viewer.addStyle(selection, { stick: { color: '#ef4444', radius: 0.3 } });
                viewer.addStyle(selection, { sphere: { color: '#ef4444', opacity: 0.5, radius: 1.5 } });
                
                viewer.addLabel(`MUT: ${highlightPos}`, {
                    position: selection,
                    backgroundColor: 0x000000,
                    backgroundOpacity: 0.7,
                    borderColor: 0xef4444,
                    borderThickness: 1,
                    fontColor: '#ffffff',
                    fontSize: 12,
                    useScreen: true,
                    screenOffset: {x: 20, y: -20}
                });
            }

            viewer.render();
        } catch(e) {
            console.warn("Error applying style", e);
        }
    };

    // --- EFFECT: HANDLE STYLE CHANGES ---
    useEffect(() => {
        if (!glRef.current || loading || error) return;
        applyStyle(glRef.current, style, highlightPosition, resolvedSource);
    }, [style, highlightPosition, loading, error]);

    // --- EFFECT: SPIN LOGIC ---
    useEffect(() => {
        if (!glRef.current || loading) return;
        const viewer = glRef.current;
        if (isSpinning) {
            viewer.spin('y', 0.2);
        } else {
            viewer.spin(false);
        }
    }, [isSpinning, loading]);


    // --- UI HANDLERS ---
    
    const handleReset = () => {
        if (glRef.current) {
            glRef.current.zoomTo();
            setIsSpinning(true);
        }
    };

    const downloadPDB = () => {
        if (!resolvedId) return;
        const url = resolvedSource === 'ALPHAFOLD' 
            ? `https://alphafold.ebi.ac.uk/files/AF-${resolvedId}-F1-model_v4.pdb`
            : `https://files.rcsb.org/download/${resolvedId}.pdb`;
        window.open(url, '_blank');
    };


    // --- FALLBACK RENDER: LINEAR SEQUENCE PROJECTOR ---
    if (error) {
        // Approximate visual mapping
        const pos = highlightPosition || 50;
        const totalLen = Math.max(pos * 1.5, 500); 
        const markerPct = Math.min(Math.max((pos / totalLen) * 100, 5), 95); 

        return (
            <div ref={containerRef} className="relative w-full h-full min-h-[300px] rounded-xl overflow-hidden border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col group shadow-2xl">
                
                {/* Background Tech Grid & Noise */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-50"></div>
                
                {/* Subtle Radial Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-violet-900/10 rounded-full blur-3xl pointer-events-none"></div>

                {/* Header */}
                <div className="p-4 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md relative z-10">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-amber-500/10 rounded border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                            <Cuboid className="w-4 h-4 text-amber-500" />
                        </div>
                        <div>
                            <span className="block text-xs font-bold text-amber-200 uppercase tracking-wider leading-none mb-0.5">Structure Unavailable</span>
                            <span className="block text-[8px] text-amber-500/60 font-mono">ERR_404_PDB_MISSING</span>
                        </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 bg-slate-900/50 px-2 py-1 rounded border border-white/5">
                        <Activity className="w-3 h-3 text-cyan-500" />
                        2D PROJECTION
                    </span>
                </div>

                {/* Central Content: Linear Visualizer */}
                <div className="flex-grow flex flex-col items-center justify-center p-8 relative z-10">
                    
                    <div className="mb-8 text-center space-y-2">
                        <h4 className="text-white font-bold text-lg flex items-center justify-center gap-2 drop-shadow-md">
                            <ScanLine className="w-5 h-5 text-cyan-400 animate-pulse" />
                            Linear Sequence Map
                        </h4>
                        <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
                            3D Model not available. Visualizing variant position on primary polypeptide chain.
                        </p>
                    </div>

                    {/* The Linear Track */}
                    <div className="w-full max-w-md relative h-20 flex items-center">
                        {/* The Bar */}
                        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden relative border border-slate-800 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]">
                            {/* Scanning Laser */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent w-1/3 animate-[shimmer_2.5s_infinite]"></div>
                            {/* Ruler Ticks */}
                            <div className="absolute inset-0 flex justify-between px-2 opacity-30">
                                {[...Array(20)].map((_, i) => (
                                    <div key={i} className="w-px h-full bg-slate-500"></div>
                                ))}
                            </div>
                        </div>

                        {/* The Mutation Marker */}
                        <div 
                            className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center z-20 group/marker"
                            style={{ left: `${markerPct}%`, transform: 'translate(-50%, -50%)' }}
                        >
                            {/* Label Bubble */}
                            <div className="mb-2 bg-red-500/90 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm shadow-[0_0_15px_rgba(239,68,68,0.6)] whitespace-nowrap border border-red-400/50">
                                POS {highlightPosition}
                            </div>
                            
                            {/* The Pin */}
                            <div className="w-1.5 h-10 bg-gradient-to-b from-red-400 via-red-500 to-transparent rounded-full shadow-[0_0_10px_rgba(239,68,68,1)]"></div>
                            
                            {/* Base Glow */}
                            <div className="absolute bottom-0 w-8 h-2 bg-red-500/50 blur-md rounded-full"></div>
                        </div>
                    </div>

                    {/* Footer Labels */}
                    <div className="w-full max-w-md flex justify-between text-[9px] text-slate-500 font-mono uppercase tracking-wider font-bold">
                        <span>N-Terminus (Start)</span>
                        <span>C-Terminus (End)</span>
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="p-4 bg-black/40 border-t border-white/5 flex justify-center gap-3 relative z-10 backdrop-blur-md">
                    <a 
                        href={`https://www.uniprot.org/uniprotkb/${uniprotId || ''}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-violet-600 hover:text-white rounded-lg text-xs font-bold text-slate-300 transition-all border border-white/10 hover:border-violet-500/50 hover:shadow-lg"
                    >
                        <ExternalLink className="w-3 h-3" /> Check UniProt
                    </a>
                    <a 
                        href={`https://www.ncbi.nlm.nih.gov/structure/?term=${uniprotId || pdbId || ''}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-cyan-600 hover:text-white rounded-lg text-xs font-bold text-slate-300 transition-all border border-white/10 hover:border-cyan-500/50 hover:shadow-lg"
                    >
                        <Activity className="w-3 h-3" /> Search NCBI
                    </a>
                </div>
                
                <style>{`
                    @keyframes shimmer {
                        0% { transform: translateX(-200%); }
                        100% { transform: translateX(400%); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative w-full h-full min-h-[300px] rounded-lg overflow-hidden border border-slate-800 bg-[#020617] group flex flex-col">
            
            {/* 3D CANVAS */}
            <div 
                ref={viewerRef} 
                className="w-full flex-grow relative z-10 cursor-grab active:cursor-grabbing"
                onMouseDown={() => setIsSpinning(false)} // Stop spin on interact
                onTouchStart={() => setIsSpinning(false)}
            />
            
            {/* GRID OVERLAY DECORATION */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.02)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none z-0"></div>

            {/* LOADING STATE */}
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#020617]/90 z-40 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
                        <div className="flex flex-col items-center text-center">
                            <span className="text-sm text-cyan-400 font-mono font-bold tracking-widest animate-pulse">
                                INITIALIZING RENDERER
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono mt-1">
                                Resolving Structure...
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CONTROLS HUD --- */}
            <div className="absolute top-4 right-4 z-30 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                
                {/* View Styles */}
                <div className="flex flex-col gap-1 bg-black/60 p-1.5 rounded-lg border border-white/10 backdrop-blur-md">
                    <button onClick={() => setStyle('cartoon')} className={`p-2 rounded transition-all ${style === 'cartoon' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`} title="Cartoon View">
                        <Layers className="w-4 h-4" />
                    </button>
                    <button onClick={() => setStyle('stick')} className={`p-2 rounded transition-all ${style === 'stick' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`} title="Stick View">
                        <Box className="w-4 h-4" />
                    </button>
                    <button onClick={() => setStyle('sphere')} className={`p-2 rounded transition-all ${style === 'sphere' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`} title="Van der Waals">
                        <Circle className="w-4 h-4" />
                    </button>
                    <button onClick={() => setStyle('surface')} className={`p-2 rounded transition-all ${style === 'surface' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`} title="Surface (Electrostatic)">
                        <Hexagon className="w-4 h-4" />
                    </button>
                </div>

                {/* Utils */}
                <div className="flex flex-col gap-1 bg-black/60 p-1.5 rounded-lg border border-white/10 backdrop-blur-md">
                     <button onClick={() => setIsSpinning(!isSpinning)} className={`p-2 rounded transition-all ${isSpinning ? 'text-cyan-400' : 'text-slate-500 hover:text-white'}`} title="Toggle Spin">
                        <RefreshCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={handleReset} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-all" title="Reset Camera">
                        <Crosshair className="w-4 h-4" />
                    </button>
                    <button onClick={downloadPDB} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-all" title="Download Source File">
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* --- INFO HUD --- */}
            <div className="absolute top-4 left-4 z-30 flex items-center gap-3 pointer-events-none">
                <div className={`px-2.5 py-1.5 rounded border backdrop-blur-md flex items-center gap-2 text-[10px] font-bold font-mono uppercase shadow-lg ${
                    resolvedSource === 'ALPHAFOLD' 
                    ? 'bg-blue-950/80 border-blue-500/40 text-blue-300' 
                    : 'bg-slate-900/80 border-slate-600 text-slate-300'
                }`}>
                    {resolvedSource === 'ALPHAFOLD' ? <ShieldCheck className="w-3 h-3" /> : <Cuboid className="w-3 h-3" />}
                    <span>{resolvedSource}</span>
                </div>
                {modelMetadata && (
                    <div className="hidden md:flex gap-2">
                        <span className="px-2 py-1 bg-black/50 rounded text-[9px] text-slate-400 border border-white/10 font-mono">
                            {modelMetadata.atoms} Atoms
                        </span>
                        <span className="px-2 py-1 bg-black/50 rounded text-[9px] text-slate-400 border border-white/10 font-mono">
                            {modelMetadata.residues} Residues
                        </span>
                    </div>
                )}
            </div>

            {/* --- FOOTER LEGEND --- */}
            {resolvedSource === 'ALPHAFOLD' && !loading && (
                <div className="absolute bottom-4 left-4 z-30 pointer-events-none bg-black/70 backdrop-blur-md border border-white/10 rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <Info className="w-3 h-3 text-slate-400" />
                        <span className="text-[9px] text-slate-300 font-bold uppercase">pLDDT Confidence</span>
                    </div>
                    <div className="flex gap-0.5 h-1.5 w-32 rounded-full overflow-hidden border border-white/10">
                        <div className="flex-1 bg-orange-500" title="Very Low (<50)"></div>
                        <div className="flex-1 bg-yellow-400" title="Low (70)"></div>
                        <div className="flex-1 bg-cyan-400" title="High (90)"></div>
                        <div className="flex-1 bg-blue-600" title="Very High (>90)"></div>
                    </div>
                    <div className="flex justify-between w-full mt-1 text-[8px] text-slate-500 font-mono">
                        <span>Low</span>
                        <span>High</span>
                    </div>
                </div>
            )}
        </div>
    );
};
