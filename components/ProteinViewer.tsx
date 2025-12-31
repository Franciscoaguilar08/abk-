import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Cuboid } from 'lucide-react';

declare const $3Dmol: any;

interface ProteinViewerProps {
    pdbId: string;
    highlightPosition?: number;
}

export const ProteinViewer: React.FC<ProteinViewerProps> = ({ pdbId, highlightPosition }) => {
    const viewerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [viewerInstance, setViewerInstance] = useState<any>(null);

    useEffect(() => {
        if (!viewerRef.current || !pdbId) return;

        setLoading(true);

        // Initialize Viewer
        const config = { backgroundColor: '0x1e293b' }; // Slate-800 to match glass panel
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

            // 2. Set General Style (Cartoon, White/Grey)
            // Using a slightly transparent grey to let the highlight pop
            viewer.setStyle({}, {
                cartoon: { color: 'white', opacity: 0.8 }
            });

            // 3. Highlight specific residue (Attention Map Logic)
            if (highlightPosition) {
                // Highlight the mutated residue in RED
                viewer.setStyle(
                    { resi: highlightPosition }, 
                    { 
                        cartoon: { color: '#ef4444' }, // Red-500
                        sphere: { color: '#ef4444', radius: 1.5, opacity: 0.8 }, // Sphere to show volume
                        stick: { color: '#ef4444', radius: 0.2 } // Stick to show side chains
                    }
                );

                // Highlight neighbors slightly (Orange) for context
                viewer.setStyle(
                    { resi: [highlightPosition - 1, highlightPosition + 1] },
                    { cartoon: { color: '#f97316' } } // Orange-500
                );
                
                // Add label
                viewer.addLabel(`Mut: ${highlightPosition}`, {
                    position: { resi: highlightPosition },
                    backgroundColor: 0x000000,
                    backgroundOpacity: 0.8,
                    fontColor: 'white',
                    fontSize: 12
                });
            }

            // 4. Render
            viewer.zoomTo();
            viewer.render();
            viewer.zoom(1.2, 1000); // Slight zoom in animation
        });

        // Cleanup
        return () => {
            if (viewerInstance) {
                // simple cleanup if library supports it, otherwise just unmounting div handles it
            }
        };
    }, [pdbId, highlightPosition]);

    return (
        <div className="relative w-full h-[300px] rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shadow-inner">
            <div ref={viewerRef} className="w-full h-full relative z-10" />
            
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-20">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                        <span className="text-xs text-slate-400 font-mono">Fetching RCSB Structure: {pdbId}</span>
                    </div>
                </div>
            )}

            <div className="absolute bottom-2 left-2 z-30 flex items-center gap-2 pointer-events-none">
                <div className="px-2 py-1 bg-black/60 rounded text-[10px] text-white font-mono border border-white/10">
                    PDB: <span className="text-violet-400 font-bold">{pdbId}</span>
                </div>
                {highlightPosition && (
                    <div className="px-2 py-1 bg-red-900/60 rounded text-[10px] text-white font-mono border border-red-500/30 flex items-center gap-1">
                        <Cuboid className="w-3 h-3" />
                        Residue: {highlightPosition}
                    </div>
                )}
            </div>
            <div className="absolute top-2 right-2 z-30 pointer-events-none">
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Interactive 3D</span>
            </div>
        </div>
    );
};