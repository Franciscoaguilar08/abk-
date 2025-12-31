import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip } from 'recharts';
import { VariantAnalysis, VariantRiskLevel, OncologyProfile } from '../types';
import { ShieldCheck, Target, AlertOctagon } from 'lucide-react';

interface RiskChartProps {
  variants: VariantAnalysis[];
}

interface OncologyRiskChartProps {
    profiles: OncologyProfile[];
}

// Custom Tooltip for Pie Chart
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl backdrop-blur-md">
        <p className="text-slate-200 font-bold text-xs mb-1">{payload[0].name}</p>
        <p className="text-white font-mono font-bold text-sm">
          {payload[0].value} <span className="text-slate-400 text-xs font-normal">variants</span>
        </p>
      </div>
    );
  }
  return null;
};

export const RiskDistributionChart: React.FC<RiskChartProps> = ({ variants }) => {
  const safeVariants = variants || [];
  
  const data = [
    { name: 'High / Pathogenic', count: safeVariants.filter(v => v.riskLevel === VariantRiskLevel.HIGH || v.riskLevel === VariantRiskLevel.PATHOGENIC).length, color: '#ef4444' }, // Red-500
    { name: 'Moderate Risk', count: safeVariants.filter(v => v.riskLevel === VariantRiskLevel.MODERATE).length, color: '#f97316' }, // Orange-500
    { name: 'Uncertain Sig.', count: safeVariants.filter(v => v.riskLevel === VariantRiskLevel.UNCERTAIN).length, color: '#eab308' }, // Yellow-500
    { name: 'Benign / Low', count: safeVariants.filter(v => v.riskLevel === VariantRiskLevel.LOW || v.riskLevel === VariantRiskLevel.BENIGN).length, color: '#10b981' }, // Emerald-500
  ].filter(d => d.count > 0);

  const total = safeVariants.length;

  if (total === 0) {
      return (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500">
              <p>No variant data loaded.</p>
          </div>
      )
  }

  return (
    <div className="h-64 w-full flex items-center justify-center relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="count"
            stroke="none"
            cornerRadius={4}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <RechartsTooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-brand font-bold text-white">{total}</span>
        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Total</span>
      </div>

      <div className="absolute bottom-0 right-0 flex flex-col gap-1 pointer-events-none">
          {data.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: d.color}}></div>
                  <span className="text-[10px] text-slate-400">{d.name}</span>
              </div>
          ))}
      </div>
    </div>
  );
};

// --- NEW COMPONENT: Oncology Target Plot (Radar) ---
export const OncologyTargetChart: React.FC<OncologyRiskChartProps> = ({ profiles }) => {
    const safeProfiles = profiles || [];
    
    // Fallback for empty data
    if (safeProfiles.length === 0) {
        return (
            <div className="h-full min-h-[300px] w-full flex flex-col items-center justify-center bg-slate-900/30 rounded-lg border border-white/5 p-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 border-[0.5px] border-emerald-500/10 rounded-full scale-[0.8]"></div>
                <div className="absolute inset-0 border-[0.5px] border-emerald-500/5 rounded-full scale-[0.5]"></div>
                <ShieldCheck className="w-12 h-12 text-emerald-500 mb-4 opacity-80 relative z-10" />
                <h4 className="text-white font-bold mb-1 relative z-10">System Clear</h4>
                <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed relative z-10">
                    No oncogenic drivers detected above standard threshold.
                </p>
            </div>
        );
    }

    // Chart Configuration
    const size = 300;
    const center = size / 2;
    const maxRadius = size / 2 - 20;

    return (
        <div className="w-full h-full min-h-[320px] flex items-center justify-center relative select-none">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
                {/* 1. ZONES (Background Rings) */}
                {/* Safe Zone (0-40%) */}
                <circle cx={center} cy={center} r={maxRadius * 0.4} fill="#10b981" fillOpacity="0.05" stroke="#10b981" strokeOpacity="0.2" strokeDasharray="4 4" />
                {/* Warning Zone (40-70%) */}
                <circle cx={center} cy={center} r={maxRadius * 0.7} fill="none" stroke="#f59e0b" strokeOpacity="0.2" strokeWidth="1" />
                {/* Danger Zone (70-100%) */}
                <circle cx={center} cy={center} r={maxRadius} fill="#ef4444" fillOpacity="0.05" stroke="#ef4444" strokeOpacity="0.3" strokeWidth="1" />
                
                {/* Crosshairs */}
                <line x1={center} y1={center - maxRadius} x2={center} y2={center + maxRadius} stroke="#334155" strokeWidth="0.5" />
                <line x1={center - maxRadius} y1={center} x2={center + maxRadius} y2={center} stroke="#334155" strokeWidth="0.5" />

                {/* Radar Scan Effect */}
                <circle cx={center} cy={center} r={maxRadius} fill="none" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="0.5">
                     <animate attributeName="opacity" values="0.1;0.5;0.1" dur="4s" repeatCount="indefinite" />
                </circle>

                {/* 2. DATA POINTS */}
                {safeProfiles.map((profile, i) => {
                    // Distribute points around the circle based on index
                    const angle = (i / safeProfiles.length) * 2 * Math.PI - (Math.PI / 2);
                    // Distance from center is the Risk Score
                    const distance = (profile.riskScore / 100) * maxRadius;
                    
                    const x = center + Math.cos(angle) * distance;
                    const y = center + Math.sin(angle) * distance;
                    
                    const color = profile.riskScore > 70 ? '#ef4444' : profile.riskScore > 40 ? '#f59e0b' : '#10b981';
                    
                    return (
                        <g key={i} className="group cursor-pointer hover:z-50">
                            {/* Connector Line to Center */}
                            <line 
                                x1={center} y1={center} x2={x} y2={y} 
                                stroke={color} strokeWidth="1" strokeOpacity="0.3" 
                            />
                            
                            {/* Pulse Effect for High Risk */}
                            {profile.riskScore > 70 && (
                                <circle cx={x} cy={y} r="8" fill={color} fillOpacity="0.3">
                                    <animate attributeName="r" values="4;12;4" dur="2s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                                </circle>
                            )}

                            {/* The Node */}
                            <circle cx={x} cy={y} r="4" fill="#020617" stroke={color} strokeWidth="2" />

                            {/* Label */}
                            <text 
                                x={x} 
                                y={y - 10} 
                                textAnchor="middle" 
                                fill={color} 
                                fontSize="10" 
                                fontWeight="bold" 
                                fontFamily="monospace"
                                className="drop-shadow-md"
                            >
                                {profile.gene}
                            </text>

                            {/* Hover Tooltip (SVG based) */}
                            <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                <rect x={x + 10} y={y - 20} width="120" height="50" rx="4" fill="#0f172a" stroke={color} strokeWidth="1" />
                                <text x={x + 18} y={y - 5} fill="#fff" fontSize="10" fontWeight="bold">{profile.gene}</text>
                                <text x={x + 18} y={y + 8} fill="#94a3b8" fontSize="9">Risk Score: {profile.riskScore}/100</text>
                                <text x={x + 18} y={y + 20} fill="#94a3b8" fontSize="8">{profile.predisposition.substring(0, 18)}...</text>
                            </g>
                        </g>
                    );
                })}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-2 left-2 flex flex-col gap-1">
                 <div className="flex items-center gap-1.5">
                     <div className="w-2 h-2 rounded-full border border-red-500 bg-red-500/20"></div>
                     <span className="text-[9px] text-red-400 uppercase tracking-wider">High Impact ({'>'}70)</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                     <div className="w-2 h-2 rounded-full border border-amber-500 bg-amber-500/20"></div>
                     <span className="text-[9px] text-amber-400 uppercase tracking-wider">Monitor ({'>'}40)</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                     <div className="w-2 h-2 rounded-full border border-emerald-500 bg-emerald-500/20"></div>
                     <span className="text-[9px] text-emerald-400 uppercase tracking-wider">Benign</span>
                 </div>
            </div>
        </div>
    );
};