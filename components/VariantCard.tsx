
import React, { useState } from 'react';
import { VariantAnalysis, VariantRiskLevel, AttentionPoint } from '../types';
import { Info, CheckCircle2, Globe, BrainCircuit, Microscope, Sparkles, AlertTriangle, AlertOctagon, UserCheck, Users, Copy, Activity } from 'lucide-react';
import { ProteinViewer } from './ProteinViewer';

interface VariantCardProps {
  variant: VariantAnalysis;
}

const getRiskColor = (level: VariantRiskLevel, clinicalStatus?: string, penetrance?: string) => {
  // Logic Override 1: If status is CARRIER, avoid RED colors
  if (clinicalStatus === 'CARRIER') {
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  }

  // Logic Override 2: If Penetrance is LOW or MODERATE, avoid RED (Mitigating Factor)
  if (penetrance === 'LOW' || penetrance === 'MODERATE') {
      return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
  }

  switch (level) {
    case VariantRiskLevel.PATHOGENIC:
    case VariantRiskLevel.HIGH:
      return 'bg-red-500/10 text-red-400 border-red-500/30';
    case VariantRiskLevel.MODERATE:
      return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    case VariantRiskLevel.UNCERTAIN:
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    case VariantRiskLevel.BENIGN:
    case VariantRiskLevel.LOW:
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    default:
      return 'bg-slate-700/30 text-slate-400 border-slate-600/30';
  }
};

export const VariantCard: React.FC<VariantCardProps> = ({ variant }) => {
  const clinVarText = variant.clinVarSignificance || "Not Reported";
  const xai = variant.xai;

  // Is it truly high risk? (Must be affected AND High Penetrance)
  // If Penetrance is LOW, we treat it as non-critical
  const isLowPenetrance = variant.penetrance === 'LOW' || variant.penetrance === 'MODERATE';
  const isHighRisk = (variant.riskLevel === VariantRiskLevel.HIGH || variant.riskLevel === VariantRiskLevel.PATHOGENIC) 
                      && variant.clinicalStatus !== 'CARRIER' 
                      && !isLowPenetrance;
  const isCarrier = variant.clinicalStatus === 'CARRIER';

  return (
    <div className={`glass-panel rounded-xl p-6 transition-all hover:bg-slate-800/50 flex flex-col h-full group border-l-4 relative overflow-hidden ${
        isHighRisk 
        ? 'border-l-red-500 shadow-[0_0_30px_rgba(239,68,68,0.15)] bg-red-900/5' 
        : isCarrier
          ? 'border-l-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.1)]'
          : isLowPenetrance
            ? 'border-l-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.1)]'
            : 'border-l-transparent hover:border-l-violet-500 hover:shadow-lg hover:shadow-violet-900/10'
    }`}>
      
      {/* Background decoration for High Risk */}
      {isHighRisk && (
          <>
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[50px] pointer-events-none rounded-full -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
            <div className="absolute inset-0 border border-red-500/10 rounded-xl pointer-events-none"></div>
          </>
      )}

      {/* Standard XAI decoration (if not already high risk to avoid clutter) */}
      {!isHighRisk && xai && xai.pathogenicityScore > 0.8 && (
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-[100px] pointer-events-none rounded-full -translate-y-1/2 translate-x-1/2"></div>
      )}

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight break-all flex items-center gap-2">
             {variant.gene}
             {isHighRisk && (
                 <span className="relative flex h-3 w-3" title="Critical Variant">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                 </span>
             )}
             {isCarrier && (
                 <span className="bg-blue-900/30 text-blue-300 text-[10px] px-2 py-0.5 rounded border border-blue-500/30 font-mono flex items-center gap-1">
                     <UserCheck className="w-3 h-3" /> CARRIER
                 </span>
             )}
             {isLowPenetrance && !isCarrier && (
                 <span className="bg-teal-900/30 text-teal-300 text-[10px] px-2 py-0.5 rounded border border-teal-500/30 font-mono flex items-center gap-1">
                     <Activity className="w-3 h-3" /> REDUCED PENETRANCE
                 </span>
             )}
          </h3>
          <p className="text-sm text-violet-400 font-mono break-all">{variant.variant} {variant.rsId && <span className="text-slate-500 text-xs">({variant.rsId})</span>}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
            <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider border ${getRiskColor(variant.riskLevel, variant.clinicalStatus, variant.penetrance)} whitespace-nowrap ml-2 shrink-0 flex items-center gap-1.5 shadow-sm`}>
                {isHighRisk && <AlertOctagon className="w-3 h-3 animate-pulse" />}
                {isCarrier && <Users className="w-3 h-3" />}
                {isCarrier ? "CARRIER STATUS" : isLowPenetrance ? "LOWER RISK" : variant.riskLevel}
            </span>
        </div>
      </div>
      
      {/* ZYGOSITY & INHERITANCE & PENETRANCE INFO */}
      {(variant.zygosity || variant.inheritanceMode || variant.penetrance) && (
          <div className="flex gap-2 mb-3 relative z-10 flex-wrap">
              {variant.zygosity && (
                  <div className="text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-400 font-mono flex items-center gap-1.5" title="Genotype">
                      <Copy className="w-3 h-3 text-slate-500" />
                      {variant.zygosity === 'HETEROZYGOUS' ? '0/1 HETERO' : variant.zygosity === 'HOMOZYGOUS' ? '1/1 HOMO' : variant.zygosity}
                  </div>
              )}
              {variant.inheritanceMode && (
                  <div className="text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-400 font-mono flex items-center gap-1.5" title="Inheritance Pattern">
                      <Globe className="w-3 h-3 text-slate-500" />
                      {variant.inheritanceMode.replace('AUTOSOMAL_', '').replace('_', ' ')}
                  </div>
              )}
              {variant.penetrance && (
                  <div className={`text-[10px] px-2 py-1 rounded border font-mono flex items-center gap-1.5 ${isLowPenetrance ? 'bg-teal-900/20 border-teal-500/30 text-teal-300' : 'bg-slate-900 border-slate-700 text-slate-400'}`} title="Penetrance Probability">
                      <Activity className="w-3 h-3" />
                      PENETRANCE: {variant.penetrance}
                  </div>
              )}
          </div>
      )}
      
      {variant.condition && (
        <div className="mb-4 bg-slate-900/50 p-2 rounded-lg border border-white/5 relative z-10">
          <span className="text-[10px] uppercase tracking-wide text-slate-400 block mb-0.5">Associated Condition</span>
          <p className="text-slate-200 text-sm font-medium leading-tight">{variant.condition}</p>
        </div>
      )}

      {/* Description */}
      <p className="text-slate-300 text-sm mb-6 leading-relaxed relative z-10">
          {variant.description}
          {variant.penetranceDescription && (
              <span className="block mt-2 text-xs text-teal-200 bg-teal-900/10 border-l-2 border-teal-500/50 pl-2 py-1">
                  <strong>Penetrance Note:</strong> {variant.penetranceDescription}
              </span>
          )}
      </p>
      
      {/* REAL DATA METRICS */}
      <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
          {variant.caddScore !== undefined && (
             <div className="bg-slate-900/50 p-2 rounded border border-white/5 text-center">
                <span className="block text-[9px] text-slate-500 uppercase font-bold">CADD Phred</span>
                <span className={`font-mono font-bold ${variant.caddScore > 20 ? 'text-red-400' : 'text-slate-200'}`}>
                    {variant.caddScore}
                </span>
             </div>
          )}
          {variant.revelScore !== undefined && (
             <div className="bg-slate-900/50 p-2 rounded border border-white/5 text-center">
                <span className="block text-[9px] text-slate-500 uppercase font-bold">REVEL Score</span>
                <span className={`font-mono font-bold ${variant.revelScore > 0.5 ? 'text-orange-400' : 'text-slate-200'}`}>
                    {variant.revelScore.toFixed(3)}
                </span>
             </div>
          )}
      </div>

      {/* --- XAI SECTION (UPDATED FOR ALPHAMISSENSE VISIBILITY) --- */}
      {xai && (
        <div className="mb-6 relative z-10 bg-gradient-to-br from-violet-900/20 to-slate-900/40 rounded-xl p-4 border border-violet-500/30">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-violet-400" />
                    AlphaMissense Prediction
                </h4>
                <div className="flex items-center gap-1 text-[10px] text-violet-300 border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 rounded-full">
                    <Microscope className="w-3 h-3" />
                    <span>DeepMind Logic</span>
                </div>
            </div>

            {/* Gradual Pathogenicity Slider */}
            <div className="mb-5">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5 uppercase">
                    <span>Benign</span>
                    <span className="text-white">Pathogenicity: {xai.pathogenicityScore.toFixed(3)}</span>
                    <span>Pathogenic</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full relative overflow-hidden">
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500 opacity-30"></div>
                    {/* Marker */}
                    <div 
                        className="absolute top-0 bottom-0 w-1.5 bg-white shadow-[0_0_8px_rgba(255,255,255,1)] z-10 transition-all duration-1000"
                        style={{ left: `${xai.pathogenicityScore * 100}%` }}
                    ></div>
                </div>
            </div>

            {/* Structural Mechanism Explanation */}
            <div className="text-xs text-slate-300 leading-relaxed italic mb-4 border-l-2 border-violet-500 pl-3">
                "{xai.structuralMechanism}"
            </div>

            {/* REAL 3D Protein Viewer or Fallback */}
            {(xai.uniprotId || xai.pdbId) && xai.variantPosition ? (
                <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                        <BrainCircuit className="w-3 h-3 text-red-400" />
                        <span className="text-[10px] font-bold text-red-300 uppercase tracking-wider">AlphaFold Structure</span>
                    </div>
                    <ProteinViewer 
                        pdbId={xai.pdbId} 
                        uniprotId={xai.uniprotId} 
                        highlightPosition={xai.variantPosition} 
                    />
                    <p className="text-[10px] text-slate-500 mt-2 text-center">
                        Red sphere indicates exact mutation site ({xai.variantPosition}) on {xai.uniprotId ? `AlphaFold Model ${xai.uniprotId}` : `structure ${xai.pdbId}`}.
                    </p>
                </div>
            ) : (
                <div className="mt-4 p-4 bg-slate-800/50 rounded text-center text-xs text-slate-500 italic">
                    3D Structural data unavailable for this variant context.
                </div>
            )}
        </div>
      )}

      {/* Equity/Population Adjustment Display */}
      {(variant.populationFrequency || variant.equityAdjustment) && (
        <div className="mb-6 p-3 bg-indigo-900/20 border-l-2 border-indigo-400 rounded-r-lg relative z-10">
            <div className="flex items-center gap-2 mb-1">
                <Globe className="w-3 h-3 text-indigo-400" />
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Population Context (gnomAD)</span>
            </div>
            {variant.populationFrequency && (
                <div className="text-xs text-slate-300 mb-1">
                    Frequency: <span className="text-white font-mono">{variant.populationFrequency}</span>
                </div>
            )}
            {variant.equityAdjustment && (
                <div className="text-xs text-indigo-200 italic">
                    Note: {variant.equityAdjustment}
                </div>
            )}
        </div>
      )}

      <div className="pt-4 border-t border-white/5 space-y-5 mt-auto relative z-10">
        {/* ClinVar Section */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 group relative w-fit mb-1">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold cursor-help border-b border-dashed border-slate-600 pb-0.5">ClinVar Consensus</span>
          </div>
          <span className="text-sm font-medium text-slate-200 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-md self-start inline-flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${variant.clinVarSignificance.toLowerCase().includes('pathogenic') ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
            {clinVarText}
          </span>
        </div>
      </div>
    </div>
  );
};
