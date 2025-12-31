import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { VariantAnalysis, VariantRiskLevel, OncologyProfile } from '../types';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

interface RiskChartProps {
  variants: VariantAnalysis[];
}

interface OncologyRiskChartProps {
    profiles: OncologyProfile[];
}

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }: any) => {
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
      
      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-brand font-bold text-white">{total}</span>
        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Total</span>
      </div>

      {/* Legend overlay if needed, or keep it external */}
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

export const OncologyRiskBarChart: React.FC<OncologyRiskChartProps> = ({ profiles }) => {
    const safeProfiles = profiles || [];
    
    // If no data, show "Screening Complete - No High Risks" state
    if (safeProfiles.length === 0) {
        return (
            <div className="h-64 w-full flex flex-col items-center justify-center bg-slate-900/30 rounded-lg border border-white/5 p-6 text-center">
                <ShieldCheck className="w-12 h-12 text-emerald-500 mb-4 opacity-80" />
                <h4 className="text-white font-bold mb-1">Standard Risk Profile</h4>
                <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed">
                    No elevated oncological risks were detected in the provided variants relative to the reference genome.
                </p>
            </div>
        );
    }

    const data = safeProfiles.map(p => ({
        name: p.gene,
        score: p.riskScore,
        fullMark: 100
    }));

    const CustomBarTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl z-50">
                    <p className="text-white font-bold text-sm mb-1">{data.name}</p>
                    <p className="text-xs text-slate-400">Risk Score: <span className={data.score > 50 ? "text-red-400" : "text-emerald-400"}>{data.score}/100</span></p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 5 }} barSize={12}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.3} />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={60} 
                        tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 600, fontFamily: 'Inter'}} 
                        axisLine={false} 
                        tickLine={false} 
                    />
                    <RechartsTooltip content={<CustomBarTooltip />} cursor={{fill: '#ffffff', opacity: 0.05}} />
                    
                    {/* Background Bar for "100%" context */}
                    <Bar dataKey="fullMark" barSize={8} fill="#1e293b" radius={[0, 4, 4, 0]} isAnimationActive={false} />
                    
                    {/* Actual Data Bar */}
                    <Bar dataKey="score" barSize={8} radius={[0, 4, 4, 0]}>
                        {data.map((entry, index) => (
                             <Cell 
                                key={`cell-${index}`} 
                                fill={entry.score > 70 ? '#ef4444' : entry.score > 40 ? '#f97316' : '#10b981'} 
                                style={{ filter: 'drop-shadow(0px 0px 4px rgba(0,0,0,0.5))' }}
                             />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};