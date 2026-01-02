
import React from 'react';
import { VariantAnalysis, VariantRiskLevel, OncologyProfile } from '../types';
import { ShieldCheck, ShieldAlert, AlertTriangle, AlertOctagon, CheckCircle, HelpCircle, Activity } from 'lucide-react';

interface RiskChartProps {
  variants: VariantAnalysis[];
}

interface OncologyRiskChartProps {
    profiles: OncologyProfile[];
}

export const RiskDistributionChart: React.FC<RiskChartProps> = ({ variants }) => {
  const safeVariants = variants || [];
  const total = safeVariants.length;

  // 1. Categorize Data
  const counts = {
    critical: safeVariants.filter(v => v.riskLevel === VariantRiskLevel.PATHOGENIC || v.riskLevel === VariantRiskLevel.HIGH).length,
    moderate: safeVariants.filter(v => v.riskLevel === VariantRiskLevel.MODERATE).length,
    uncertain: safeVariants.filter(v => v.riskLevel === VariantRiskLevel.UNCERTAIN).length,
    benign: safeVariants.filter(v => v.riskLevel === VariantRiskLevel.LOW || v.riskLevel === VariantRiskLevel.BENIGN).length,
  };

  // 2. Calculate Percentages for Bar Widths
  const getPct = (count: number) => total > 0 ? (count / total) * 100 : 0;

  if (total === 0) {
      return (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 border border-dashed border-slate-800 rounded-xl">
              <Activity className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No variants loaded for analysis.</p>
          </div>
      )
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Explanation Header */}
      <div className="mb-6 flex items-start gap-3 bg-slate-900/50 p-3 rounded-lg border border-white/5">
        <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-400 leading-relaxed">
            <strong className="text-indigo-300 block mb-1">Risk Stratification Overview</strong>
            This chart categorizes detected genetic variants by their potential impact on health. 
            It separates <strong>Actionable Findings</strong> (Red) from variants of <strong>Uncertain Significance (VUS)</strong> (Yellow) and benign traits.
        </div>
      </div>

      {/* THE STRATIFICATION BAR (Health Meter) */}
      <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden flex mb-6 shadow-inner relative">
          {/* Critical Segment */}
          <div style={{ width: `${getPct(counts.critical)}%` }} className="h-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all duration-1000 relative group">
              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[size:1rem_1rem] opacity-30"></div>
          </div>
          {/* Moderate Segment */}
          <div style={{ width: `${getPct(counts.moderate)}%` }} className="h-full bg-orange-500 transition-all duration-1000 opacity-90"></div>
          {/* Uncertain Segment */}
          <div style={{ width: `${getPct(counts.uncertain)}%` }} className="h-full bg-yellow-500 transition-all duration-1000 opacity-80"></div>
          {/* Benign Segment */}
          <div style={{ width: `${getPct(counts.benign)}%` }} className="h-full bg-emerald-500 transition-all duration-1000 opacity-60"></div>
      </div>

      {/* DETAILED BREAKDOWN GRID */}
      <div className="grid grid-cols-2 gap-3 flex-grow">
          
          {/* CRITICAL CARD */}
          <div className="bg-red-900/10 border border-red-500/20 rounded-lg p-3 flex flex-col justify-between group hover:bg-red-900/20 transition-colors">
              <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider">
                      <ShieldAlert className="w-4 h-4" /> Pathogenic
                  </div>
                  <span className="text-xl font-mono font-bold text-white">{counts.critical}</span>
              </div>
              <div className="text-[10px] text-red-200/60 leading-tight">
                  High clinical impact. Immediate medical attention advised.
              </div>
          </div>

          {/* MODERATE CARD */}
          <div className="bg-orange-900/10 border border-orange-500/20 rounded-lg p-3 flex flex-col justify-between group hover:bg-orange-900/20 transition-colors">
              <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4" /> Moderate
                  </div>
                  <span className="text-xl font-mono font-bold text-white">{counts.moderate}</span>
              </div>
              <div className="text-[10px] text-orange-200/60 leading-tight">
                  Likely pathogenic or increased risk factor. Monitoring required.
              </div>
          </div>

          {/* UNCERTAIN CARD */}
          <div className="bg-yellow-900/10 border border-yellow-500/20 rounded-lg p-3 flex flex-col justify-between group hover:bg-yellow-900/20 transition-colors">
              <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold uppercase tracking-wider">
                      <HelpCircle className="w-4 h-4" /> Uncertain (VUS)
                  </div>
                  <span className="text-xl font-mono font-bold text-white">{counts.uncertain}</span>
              </div>
              <div className="text-[10px] text-yellow-200/60 leading-tight">
                  Inconclusive data. Requires re-evaluation as evidence evolves.
              </div>
          </div>

          {/* BENIGN CARD */}
          <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-lg p-3 flex flex-col justify-between group hover:bg-emerald-900/20 transition-colors">
              <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                      <CheckCircle className="w-4 h-4" /> Benign
                  </div>
                  <span className="text-xl font-mono font-bold text-white">{counts.benign}</span>
              </div>
              <div className="text-[10px] text-emerald-200/60 leading-tight">
                  Common variations with no known negative health impact.
              </div>
          </div>

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
