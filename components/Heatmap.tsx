
import React from 'react';
import { CorrelationPoint } from '../types';

interface HeatmapProps {
    data: CorrelationPoint[];
}

export const Heatmap: React.FC<HeatmapProps> = ({ data }) => {
    // 1. Identify unique Axes
    const xLabels = Array.from(new Set(data.map(d => d.x)));
    const yLabels = Array.from(new Set(data.map(d => d.y)));

    const getColor = (value: number) => {
        // Value is -1 to 1
        // 1 = Hot (Red/Violet)
        // 0 = Neutral (Dark)
        // -1 = Cold (Blue)
        
        if (value > 0) {
            // Violet intensity
            const intensity = Math.min(1, value);
            return `rgba(139, 92, 246, ${intensity})`; 
        } else {
            // Cyan intensity
            const intensity = Math.min(1, Math.abs(value));
            return `rgba(6, 182, 212, ${intensity})`;
        }
    };

    return (
        <div className="w-full overflow-x-auto">
            <div className="min-w-[500px] flex flex-col">
                {/* Header Row */}
                <div className="flex">
                    <div className="w-24 shrink-0"></div> {/* Empty corner */}
                    {xLabels.map((label, i) => (
                        <div key={i} className="w-full min-w-[60px] text-[10px] text-slate-500 text-center font-mono rotate-0 truncate px-1">
                            {label}
                        </div>
                    ))}
                </div>

                {/* Rows */}
                {yLabels.map((yLabel, i) => (
                    <div key={i} className="flex items-center h-10 border-b border-white/5 last:border-0">
                        {/* Row Label */}
                        <div className="w-24 shrink-0 text-[10px] text-slate-400 font-mono truncate pr-2 text-right">
                            {yLabel}
                        </div>
                        
                        {/* Cells */}
                        {xLabels.map((xLabel, j) => {
                            const point = data.find(d => d.x === xLabel && d.y === yLabel);
                            const value = point ? point.value : 0;
                            
                            return (
                                <div key={j} className="w-full min-w-[60px] h-full p-0.5 relative group">
                                    <div 
                                        className="w-full h-full rounded hover:border hover:border-white/50 transition-all"
                                        style={{ backgroundColor: getColor(value) }}
                                    ></div>
                                    
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 border border-slate-700 p-2 rounded z-50 whitespace-nowrap shadow-xl">
                                        <div className="text-white font-bold text-xs">Corr: {value.toFixed(2)}</div>
                                        <div className="text-slate-400 text-[10px]">p-val: {point?.significance.toExponential(2)}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
            
            {/* Legend */}
            <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-500">
                <span>Neg. Corr</span>
                <div className="w-24 h-2 rounded bg-gradient-to-r from-cyan-500 via-slate-900 to-violet-500"></div>
                <span>Pos. Corr</span>
            </div>
        </div>
    );
};
