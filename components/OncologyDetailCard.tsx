
import React from 'react';
import { OncologyProfile } from '../types';
import { ShieldAlert, Crosshair, BookOpen, Dna, Microscope, AlertTriangle, CheckCircle2, Activity } from 'lucide-react';

interface OncologyDetailCardProps {
    profile: OncologyProfile;
}

const getTierInfo = (tier: string) => {
    switch(tier) {
        case 'TIER_1_STRONG': return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'TIER I: STRONG CLINICAL SIGNIFICANCE' };
        case 'TIER_2_POTENTIAL': return { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', label: 'TIER II: POTENTIAL CLINICAL SIGNIFICANCE' };
        case 'TIER_3_UNCERTAIN': return { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'TIER III: UNCERTAIN SIGNIFICANCE' };
        default: return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'TIER IV: BENIGN / LIKELY BENIGN' };
    }
};

const getRiskVisuals = (score: number) => {
    if (score >= 75) return { color: 'bg-red-500', text: 'text-red-400', label: 'HIGH RISK' };
    if (score >= 40) return { color: 'bg-orange-400', text: 'text-orange-400', label: 'MODERATE RISK' };
    return { color: 'bg-emerald-500', text: 'text-emerald-400', label: 'LOW RISK' };
};

export const OncologyDetailCard: React.FC<OncologyDetailCardProps> = ({ profile }) => {
    const tier = getTierInfo(profile.evidenceTier);
    const risk = getRiskVisuals(profile.riskScore);

    return (
        <div className={`glass-panel rounded-xl overflow-hidden border-l-4 ${tier.border} relative group transition-all hover:bg-slate-900/50`}>
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${tier.bg} border border-white/5`}>
                        <Dna className={`w-6 h-6 ${tier.color}`} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold text-white tracking-tight font-brand">{profile.gene}</h3>
                            <span className="text-sm text-slate-400 font-mono">{profile.variant}</span>
                        </div>
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${tier.border} ${tier.color} bg-black/30`}>
                            <ShieldAlert className="w-3 h-3" />
                            {tier.label}
                        </div>
                    </div>
                </div>

                <div className="text-right min-w-[140px]">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 flex justify-end items-center gap-1">
                        <Activity className="w-3 h-3" /> Oncogenic Score
                    </div>
                    
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 rounded bg-slate-950 border border-slate-800 ${risk.text}`}>
                                {risk.label}
                            </span>
                            <span className="font-mono text-xl font-bold text-white">{profile.riskScore}%</span>
                        </div>
                        
                        {/* Custom Progress Bar */}
                        <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
                            {/* Background ticks */}
                            <div className="absolute inset-0 flex justify-between px-1 z-10">
                                <div className="w-px h-full bg-slate-900/50"></div>
                                <div className="w-px h-full bg-slate-900/50"></div>
                                <div className="w-px h-full bg-slate-900/50"></div>
                            </div>
                            <div 
                                className={`h-full rounded-full shadow-[0_0_10px_currentColor] transition-all duration-1000 ${risk.color}`} 
                                style={{ width: `${profile.riskScore}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Left Column: Mechanism */}
                <div className="space-y-6">
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Microscope className="w-4 h-4" /> Molecular Mechanism
                        </h4>
                        <div className="bg-slate-900/50 rounded-lg p-4 border border-white/5">
                            <p className="text-sm text-slate-200 leading-relaxed font-medium">
                                {profile.mechanismOfAction}
                            </p>
                            <div className="mt-3 flex items-center gap-2">
                                <span className="text-[10px] text-slate-500 uppercase">Hallmark:</span>
                                <span className="text-xs text-indigo-400 font-mono border border-indigo-500/30 px-2 py-0.5 rounded bg-indigo-900/10">
                                    {profile.cancerHallmark}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" /> Clinical Evidence
                        </h4>
                        <p className="text-xs text-slate-400 italic border-l-2 border-slate-700 pl-3">
                            "{profile.citation}"
                        </p>
                    </div>
                </div>

                {/* Right Column: Therapeutics */}
                <div>
                     <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Crosshair className="w-4 h-4" /> Therapeutic Implications
                    </h4>
                    <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg border border-white/5 p-1">
                        {profile.therapeuticImplications && profile.therapeuticImplications.length > 0 ? (
                            <ul className="space-y-1">
                                {profile.therapeuticImplications.map((therapy, i) => (
                                    <li key={i} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded transition-colors group cursor-default">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                                        <span className="text-sm text-slate-300 group-hover:text-white">{therapy}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-4 text-center text-xs text-slate-500 italic">
                                No direct targeted therapies currently established for this specific variant.
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-4 flex items-start gap-2 p-3 bg-amber-900/10 border border-amber-500/20 rounded text-amber-200/80 text-[10px]">
                        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                        <p>Therapeutic associations are based on current databases (NCCN, FDA) and require clinical validation by an oncologist.</p>
                    </div>
                </div>

            </div>
        </div>
    );
};
