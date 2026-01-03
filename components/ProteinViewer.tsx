
import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Cuboid, Crosshair, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

declare const $3Dmol: any;

interface ProteinViewerProps {
    pdbId?: string; // Legacy support
    uniprotId?: string; // AlphaFold ID
    highlightPosition?: number;
}

export const ProteinViewer: React.FC<ProteinViewerProps> = ({ pdbId, uniprotId, highlightPosition }) => {
    const viewerRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    
    // HUD State
    const [isHovering, setIsHovering] = useState(false);
    const [resolvedSource, setResolvedSource] = useState<'ALPHAFOLD' | 'RCSB_PDB'>('ALPHAFOLD');
    const [resolvedId, setResolvedId] = useState<string>("");

    useEffect(() => {
        if (!viewerRef.current) return;
        
        // Sanitize Input ID
        let targetId = (uniprotId || pdbId || "").trim().toUpperCase();
        if (!targetId) return;

        // Heuristic: If ID is 4 chars, it's likely PDB, not UniProt
        if (targetId.length === 4 && /^[0-9][A-Z0-9]{3}$/.test(targetId)) {
            setResolvedSource('RCSB_PDB');
        } else {
            setResolvedSource('ALPHAFOLD');
        }
        setResolvedId(targetId);

        if (typeof $3Dmol === 'undefined') {
            console.warn("3Dmol library not loaded");
            setError(true);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(false);

        const fetchStructureData = async (id: string, source: 'ALPHAFOLD' | 'RCSB_PDB') => {
            if (source === 'ALPHAFOLD') {
                // Try v4 first (Standard)
                try {
                    const v4 = await fetch(`https://alphafold.ebi.ac.uk/files/AF-${id}-F1-model_v4.pdb`);
                    if (v4.ok) return await v4.text();
                    
                    // Fallback to v3 (Older entries)
                    console.warn("AF v4 not found, trying v3...");
                    const v3 = await fetch(`https://alphafold.ebi.ac.uk/files/AF-${id}-F1-model_v3.pdb`);
                    if (v3.ok) return await v3.text();
                    
                    // Fallback to v2
                    const v2 = await fetch(`https://alphafold.ebi.ac.uk/files/AF-${id}-F1-model_v2.pdb`);
                    if (v2.ok) return await v2.text();

                    throw new Error("Structure not found in AlphaFold DB");
                } catch (e) {
                    throw e;
                }
            } else {
                // RCSB PDB
                const res = await fetch(`https://files.rcsb.org/download/${id}.pdb`);
                if (!res.ok) throw new Error("Structure not found in RCSB");
                return await res.text();
            }
        };

        const initViewer = async () => {
            try {
                const config = { backgroundColor: '#020617' };
                const viewer = $3Dmol.createViewer(viewerRef.current, config);
                
                // Determine Source Strategy based on heuristics + explicit props
                let source = resolvedSource;
                if(uniprotId) source = 'ALPHAFOLD';
                if(pdbId) source = 'RCSB_PDB';

                // Attempt Fetch
                let pdbData = "";
                try {
                    pdbData = await fetchStructureData(targetId, source);
                    setResolvedSource(source); // Update if successful
                } catch (afError) {
                    // Fallback: If AlphaFold fails, maybe it's a PDB ID?
                    if (source === 'ALPHAFOLD' && targetId.length === 4) {
                        console.log("Fallback to RCSB...");
                        pdbData = await fetchStructureData(targetId, 'RCSB_PDB');
                        setResolvedSource('RCSB_PDB');
                    } else {
                        throw afError;
                    }
                }

                setLoading(false);
                if (!viewer) return;

                viewer.clear();
                viewer.addModel(pdbData, "pdb");
                viewer.setStyle({}, {});

                // Style Logic
                if (resolvedSource === 'ALPHAFOLD') {
                    viewer.setStyle({}, {
                        cartoon: { 
                            colorscheme: {
                                prop: 'b',
                                gradient: 'roygb',
                                min: 50,
                                max: 90
                            }
                        }
                    });
                } else {
                    viewer.setStyle({}, {
                        cartoon: { color: '#64748b' }
                    });
                }

                // Highlight Mutation
                if (highlightPosition) {
                    viewer.setStyle(
                        { resi: highlightPosition }, 
                        { 
                            cartoon: { color: '#ef4444' }, 
                            sphere: { color: '#ef4444', radius: 1.5, opacity: 0.8 },
                            stick: { color: '#f97316', radius: 0.2 } 
                        }
                    );
                    
                    viewer.addLabel(`MUTATION: ${highlightPosition}`, {
                        position: { resi: highlightPosition },
                        backgroundColor: 0xef4444,
                        backgroundOpacity: 0.8,
                        fontColor: '#ffffff',
                        fontSize: 12,
                        useScreen: true,
                        screenOffset: {x: 0, y: -20}
                    });
                }

                viewer.zoomTo();
                viewer.render();
                viewer.spin('y', 0.15);

            } catch (e) {
                console.error("3D Render Error:", e);
                setError(true);
                setLoading(false);
            }
        };

        initViewer();

    }, [uniprotId, pdbId, highlightPosition]);

    const handleMouseMove = (e: React.MouseEvent) => {
        // Optional interaction logic
    };

    if (error) {
        return (
            <div className="w-full h-[300px] rounded-lg border border-slate-800 bg-[#020617] flex flex-col items-center justify-center text-slate-500 gap-3">
                <AlertTriangle className="w-8 h-8 text-amber-500/50" />
                <div className="text-center">
                    <div className="text-xs font-mono uppercase text-amber-500">Structure Unavailable</div>
                    <div className="text-[10px] text-slate-600 mt-1 max-w-[200px]">
                        Could not resolve 3D model for ID: <span className="text-slate-400 font-bold">{resolvedId}</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div 
            ref={containerRef}
            className="relative w-full h-[300px] rounded-lg overflow-hidden border border-slate-800 bg-[#020617] group"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div ref={viewerRef} className="w-full h-full relative z-10" />
            
            <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>

            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#020617] z-20">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                        <div className="flex flex-col items-center">
                            <span className="text-xs text-cyan-400 font-mono font-bold tracking-widest animate-pulse">
                                FETCHING STRUCTURE
                            </span>
                            <span className="text-[9px] text-slate-600 font-mono">
                                {resolvedSource} DATABASE
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <div className="absolute top-3 left-3 z-30 flex items-center gap-2 pointer-events-none">
                <div className={`px-2 py-1 rounded border backdrop-blur-md flex items-center gap-2 text-[9px] font-bold font-mono uppercase shadow-lg ${
                    resolvedSource === 'ALPHAFOLD' 
                    ? 'bg-blue-900/40 border-blue-500/30 text-blue-300' 
                    : 'bg-slate-800/80 border-slate-600 text-slate-300'
                }`}>
                    {resolvedSource === 'ALPHAFOLD' ? <ShieldCheck className="w-3 h-3" /> : <Cuboid className="w-3 h-3" />}
                    <span>{resolvedSource}</span>
                </div>
            </div>

            <div className="absolute bottom-3 left-3 z-30 flex flex-col gap-1 pointer-events-none">
                 <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Accession ID</div>
                 <div className="text-lg font-mono font-bold text-white leading-none tracking-tight">{resolvedId}</div>
            </div>

            {resolvedSource === 'ALPHAFOLD' && (
                <div className="absolute top-3 right-3 z-30 pointer-events-none flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-black/60 rounded border border-white/10 backdrop-blur-sm">
                        <Info className="w-3 h-3 text-slate-400" />
                        <span className="text-[9px] text-slate-300 font-bold uppercase">pLDDT Confidence</span>
                    </div>
                    <div className="flex gap-0.5 h-1.5 w-24 rounded-full overflow-hidden border border-white/10 mt-1">
                        <div className="flex-1 bg-orange-500" title="Very Low (<50)"></div>
                        <div className="flex-1 bg-yellow-400" title="Low (70)"></div>
                        <div className="flex-1 bg-cyan-400" title="High (90)"></div>
                        <div className="flex-1 bg-blue-600" title="Very High (>90)"></div>
                    </div>
                </div>
            )}

            {highlightPosition && !loading && (
                 <div className="absolute bottom-3 right-3 z-30 pointer-events-none">
                    <div className="text-[9px] text-red-400 font-mono bg-red-950/50 px-2 py-1 border border-red-500/30 rounded flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                        VAR_{highlightPosition}
                    </div>
                 </div>
            )}
            
             <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-400/30 shadow-[0_0_15px_#22d3ee] animate-[scan_4s_linear_infinite] pointer-events-none z-10 opacity-50"></div>
        </div>
    );
};
