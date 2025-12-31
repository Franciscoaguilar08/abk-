import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Cuboid, Scan, Crosshair } from 'lucide-react';

declare const $3Dmol: any;

interface ProteinViewerProps {
    pdbId: string;
    highlightPosition?: number;
}

export const ProteinViewer: React.FC<ProteinViewerProps> = ({ pdbId, highlightPosition }) => {
    const viewerRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [viewerInstance, setViewerInstance] = useState<any>(null);
    
    // HUD State
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [simulatedCoords, setSimulatedCoords] = useState({ x: 0, y: 0, z: 0 });
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        if (!viewerRef.current || !pdbId) return;

        setLoading(true);

        // Initialize Viewer
        // Using a darker, pure black background for the terminal look
        const config = { backgroundColor: '#000000' }; 
        const viewer = $3Dmol.createViewer(viewerRef.current, config);
        setViewerInstance(viewer);

        // Download PDB from RCSB
        $3Dmol.download(`pdb:${pdbId}`, viewer, {
            multimodel: true,
            frames: true
        }, function() {
            setLoading(false);
            
            // 1. Clear Style
            viewer.setStyle({}, {});

            // 2. Set General Style (Wireframe + Cartoon hybrid for Tech look)
            viewer.setStyle({}, {
                cartoon: { color: '#334155', opacity: 0.4 }, // Slate-700
                line: { color: '#475569', opacity: 0.2 }
            });

            // 3. Highlight specific residue (Attention Map Logic)
            if (highlightPosition) {
                // Highlight the mutated residue in Neon Red/Orange
                viewer.setStyle(
                    { resi: highlightPosition }, 
                    { 
                        cartoon: { color: '#ef4444' }, 
                        sphere: { color: '#ef4444', radius: 1.5, opacity: 0.6 },
                        stick: { color: '#f97316', radius: 0.2 } 
                    }
                );

                // Add label with tech styling
                viewer.addLabel(`RES_${highlightPosition}::MUT`, {
                    position: { resi: highlightPosition },
                    backgroundColor: 0x000000,
                    borderColor: 0x8b5cf6,
                    borderThickness: 1,
                    fontColor: '#8b5cf6',
                    fontSize: 10,
                    useScreen: true
                });
            }

            // 4. Render
            viewer.zoomTo();
            viewer.render();
            // Continuous slow rotation for "scanning" feel
            viewer.spin('y', 0.2); 
        });

        return () => {
             // Cleanup if needed
        };
    }, [pdbId, highlightPosition]);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        setCursorPos({ x, y });
        
        // Simulate 3D coordinates changing based on mouse position + random jitter
        setSimulatedCoords({
            x: parseFloat(((x / rect.width) * 100).toFixed(2)),
            y: parseFloat(((y / rect.height) * 100).toFixed(2)),
            z: parseFloat((Math.random() * 50 + 10).toFixed(2))
        });
    };

    return (
        <div 
            ref={containerRef}
            className="relative w-full h-[300px] rounded-lg overflow-hidden border border-slate-800 bg-black group"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div ref={viewerRef} className="w-full h-full relative z-10" />
            
            {/* Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none z-0"></div>

            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                        <span className="text-xs text-violet-400 font-mono animate-pulse">ESTABLISHING LINK...</span>
                    </div>
                </div>
            )}

            {/* Tech HUD Overlay */}
            <div className="absolute bottom-2 left-2 z-30 flex items-center gap-2 pointer-events-none">
                <div className="px-2 py-1 bg-black/80 rounded border border-violet-500/30 flex items-center gap-2 text-[10px] text-violet-300 font-mono">
                    <Cuboid className="w-3 h-3" />
                    <span>PDB ID: {pdbId}</span>
                </div>
            </div>

            <div className="absolute top-2 right-2 z-30 pointer-events-none flex flex-col items-end gap-1">
                <div className="flex items-center gap-1 text-[9px] text-emerald-500 font-mono">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    LIVE RENDER
                </div>
                {highlightPosition && (
                    <div className="text-[9px] text-red-400 font-mono bg-red-900/20 px-1 border border-red-500/30">
                        ATTN: RES_{highlightPosition}
                    </div>
                )}
            </div>

            {/* Interactive Cursor HUD */}
            {isHovering && !loading && (
                <div 
                    className="absolute z-40 pointer-events-none flex flex-col gap-1 transition-opacity duration-75"
                    style={{ left: cursorPos.x + 15, top: cursorPos.y + 15 }}
                >
                    <div className="flex items-center gap-1 text-[9px] font-mono text-cyan-400 bg-black/90 px-2 py-1 border border-cyan-500/50 rounded-bl-none">
                        <Crosshair className="w-3 h-3" />
                        X: {simulatedCoords.x} Y: {simulatedCoords.y} Z: {simulatedCoords.z} Å
                    </div>
                    {/* Decorative lines connecting to cursor */}
                    <div className="h-px w-4 bg-cyan-500/50 absolute -left-4 top-3"></div>
                    <div className="w-px h-4 bg-cyan-500/50 absolute left-0 -top-4"></div>
                </div>
            )}
            
            {/* Scan Line Animation */}
             <div className="absolute top-0 left-0 w-full h-[2px] bg-violet-500/50 shadow-[0_0_10px_#8b5cf6] animate-[scan_3s_linear_infinite] pointer-events-none z-10 opacity-30"></div>
        </div>
    );
};