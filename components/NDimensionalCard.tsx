

import React from 'react';
import { NDimensionalAnalysis, ActionItem, LifestyleMod, MonitoringProtocol } from '../types';
import { 
    Activity, ClipboardCheck, Calendar, Apple, 
    Stethoscope, AlertCircle, CheckCircle2, ArrowRight,
    HeartPulse, ShieldAlert, Zap
} from 'lucide-react';

interface NDimensionalCardProps {
    analysis: NDimensionalAnalysis;
}

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'IMMEDIATE': return 'text-red-400 bg-red-900/20 border-red-500/50';
        case 'HIGH': return 'text-orange-400 bg-orange-900/20 border-orange-500/50';
        default: return 'text-blue-400 bg-blue-900/20 border-blue-500/50';
    }
};

const ActionRow: React.FC<{ item: ActionItem }> = ({ item }) => (
    <div className="flex flex-col md:flex-row gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-600 transition-all mb-3 group">
        <div className="shrink-0">
             <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${getPriorityColor(item.priority)}`}>
                 {item.priority}
             </span>
        </div>
        <div className="flex-grow">
            <h4 className="text-white font-bold text-sm mb-1 group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                {item.title}
                {item.specialistReferral && (
                    <span className="text-[9px] text-slate-500 font-normal border border-slate-700 px-1.5 rounded-full flex items-center gap-1">
                        <Stethoscope className="w-2.5 h-2.5" /> Refer: {item.specialistReferral}
                    </span>
                )}
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed">{item.description}</p>
        </div>
        <div className="shrink-0 flex items-center justify-end">
             <button className="p-2 rounded-full bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 transition-all text-slate-500">
                 <CheckCircle2 className="w-5 h-5" />
             </button>
        </div>
    </div>
);

const MonitoringCard: React.FC<{ proto: MonitoringProtocol }> = ({ proto }) => (
    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
        <div>
            <div className="text-white font-bold text-sm mb-0.5">{proto.procedure}</div>
            <div className="text-slate-500 text-xs">Start: {proto.startAge}</div>
        </div>
        <div className="text-right">
            <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold uppercase tracking-wider bg-indigo-900/10 px-2 py-1 rounded border border-indigo-500/20">
                <Calendar className="w-3 h-3" />
                {proto.frequency}
            </div>
        </div>
    </div>
);

const LifestyleCard: React.FC<{ mod: LifestyleMod }> = ({ mod }) => (
    <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-emerald-500/30 transition-all">
        <div className="flex justify-between items-start mb-2">
            <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mb-1">{mod.category}</div>
            {mod.impactLevel === 'HIGH' && <Zap className="w-3 h-3 text-amber-400" />}
        </div>
        <p className="text-slate-300 text-sm font-medium leading-snug">{mod.recommendation}</p>
    </div>
);

export const NDimensionalCard: React.FC<NDimensionalCardProps> = ({ analysis }) => {
    if (!analysis) return null;

    return (
        <div className="mt-8 space-y-6">
            
            {/* 1. Header & Summary */}
            <div className="glass-panel p-6 rounded-xl border-l-4 border-l-emerald-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                    <Activity className="w-24 h-24 text-white" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400 border border-emerald-500/30">
                            <ClipboardCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white font-brand">Actionable Clinical Protocol</h3>
                            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                                Risk Level: <span className={analysis.overallRiskLevel === 'HIGH' || analysis.overallRiskLevel === 'CRITICAL' ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>{analysis.overallRiskLevel}</span>
                            </div>
                        </div>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed max-w-4xl border-l-2 border-slate-700 pl-4">
                        {analysis.clinicalSummary}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 2. Priority Action Plan (Left Col) */}
                <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                         <AlertCircle className="w-4 h-4 text-emerald-400" />
                         <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Medical Next Steps</h4>
                    </div>
                    {analysis.actionPlan && analysis.actionPlan.length > 0 ? (
                        analysis.actionPlan.map((item, i) => <ActionRow key={i} item={item} />)
                    ) : (
                        <div className="p-6 rounded-xl border border-dashed border-slate-700 text-center text-slate-500 text-sm">
                            No immediate medical actions required based on this profile.
                        </div>
                    )}

                    <div className="mt-6">
                        <div className="flex items-center gap-2 mb-3">
                             <HeartPulse className="w-4 h-4 text-indigo-400" />
                             <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Surveillance & Monitoring</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {analysis.surveillancePlan && analysis.surveillancePlan.length > 0 ? (
                                analysis.surveillancePlan.map((proto, i) => <MonitoringCard key={i} proto={proto} />)
                            ) : (
                                <div className="col-span-2 p-4 rounded-xl border border-dashed border-slate-700 text-center text-slate-500 text-xs">
                                    Standard monitoring applies.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Lifestyle Modifications (Right Col) */}
                <div className="lg:col-span-5">
                    <div className="bg-slate-900/30 p-6 rounded-xl border border-white/5 h-full">
                        <div className="flex items-center gap-2 mb-5">
                             <Apple className="w-4 h-4 text-emerald-400" />
                             <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Lifestyle Prescription</h4>
                        </div>
                        
                        <div className="space-y-3">
                            {analysis.lifestyleModifications && analysis.lifestyleModifications.length > 0 ? (
                                analysis.lifestyleModifications.map((mod, i) => <LifestyleCard key={i} mod={mod} />)
                            ) : (
                                <p className="text-slate-500 text-sm italic">No specific genetic-based lifestyle adjustments.</p>
                            )}
                        </div>

                        <div className="mt-6 p-4 bg-emerald-900/10 border border-emerald-500/20 rounded-lg">
                            <h5 className="text-emerald-400 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                                <ShieldAlert className="w-3 h-3" /> Note
                            </h5>
                            <p className="text-[10px] text-emerald-200/70 leading-relaxed">
                                These recommendations are derived from gene-environment interaction data. Please consult a nutritionist or genetic counselor before making drastic changes.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
