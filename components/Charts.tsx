
import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip } from 'recharts';
import { VariantAnalysis, VariantRiskLevel, OncologyProfile } from '../types';
import { ShieldCheck, Target, AlertOctagon, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';

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

// --- NEW COMPONENT: System Integrity Grid (Replaces Radar Chart) ---
export const OncologyTargetChart: React.FC<OncologyRiskChartProps> = ({ profiles }) => {
    const safeProfiles = profiles || [];
    
    // Define Categories
    const categories = [
        { id: 'DNA_REPAIR', label: 'DNA Repair Mechanism' },
        { id: 'CELL_CYCLE', label: 'Cell Cycle Control' },
        { id: 'METABOLISM', label: 'Metabolic Stability' },
        { id: 'IMMUNITY', label: 'Immune Response' }
    ];

    // Helper to get profiles for a category
    const getProfilesForCat = (catId: string) => safeProfiles.filter(p => p.functionalCategory === catId);

    const getSystemStatus = (catProfiles: OncologyProfile[]) => {
        if (catProfiles.length === 0) return { label: 'INTACT', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle };
        const maxScore = Math.max(...catProfiles.map(p => p.riskScore));
        if (maxScore > 75) return { label: 'CRITICAL', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: ShieldAlert };
        if (maxScore > 40) return { label: 'WARNING', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: AlertTriangle };
        return { label: 'OBSERVE', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: AlertOctagon };
    };

    return (
        <div className="w-full h-full min-h-[300px] flex flex-col justify-center">
            <div className="grid grid-cols-1 gap-3">
                {categories.map((cat) => {
                    const activeProfiles = getProfilesForCat(cat.id);
                    const status = getSystemStatus(activeProfiles);
                    const StatusIcon = status.icon;

                    return (
                        <div key={cat.id} className={`p-3 rounded-lg border ${status.border} ${status.bg} flex items-center justify-between transition-all hover:bg-opacity-20`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full bg-slate-900/50 ${status.color}`}>
                                    <StatusIcon className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cat.label}</div>
                                    <div className={`text-sm font-bold font-mono ${status.color}`}>{status.label}</div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                {activeProfiles.length > 0 ? (
                                    activeProfiles.map((p, i) => (
                                        <div key={i} className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[10px] text-white font-bold" title={`Risk Score: ${p.riskScore}`}>
                                            {p.gene}
                                        </div>
                                    ))
                                ) : (
                                    <span className="text-[10px] text-slate-600 font-mono">No variants</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {safeProfiles.length === 0 && (
                <div className="mt-4 p-3 bg-emerald-900/20 border border-emerald-500/20 rounded-lg flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <p className="text-xs text-emerald-200">
                        System integrity check complete. No known oncogenic drivers detected in the provided panel.
                    </p>
                </div>
            )}
        </div>
    );
};
