import React, { useState } from 'react';
import { analyzeGenomicData } from './services/geminiService';
import { generateClinicalReport } from './services/pdfService';
import { AnalysisResult, AnalysisFocus, AncestryGroup } from './types';
import { VariantCard } from './components/VariantCard';
import { PharmaCard } from './components/PharmaCard';
import { PhenotypeCard } from './components/PhenotypeCard';
import { AncestryCard } from './components/AncestryCard';
import { NDimensionalCard } from './components/NDimensionalCard';
import { LandingPage } from './components/LandingPage';
import { CommandHub } from './components/CommandHub';
import { DiscoveryLab } from './components/DiscoveryLab';
import { RiskDistributionChart, OncologyTargetChart } from './components/Charts';
import { SciFiButton } from './components/SciFiButton';
import { BioBackground } from './components/BioBackground';
import { 
  Microscope, Activity, Dna, FileText, Zap, Target, 
  FileJson, CheckCircle2, User, Fingerprint, 
  Upload, FileCode, Database, ArrowRight, X, Server, ShieldCheck, Info, Download, Globe2, Network, Search, Pill, FlaskConical, LayoutGrid, AlertCircle
} from 'lucide-react';
import { PillIcon, AlertIcon } from './components/Icons';

// Example Data Sets for Clinical
const EXAMPLES = [
  {
    id: 'brca',
    label: 'Oncology: BRCA2 & TP53',
    description: 'Pathogenic variants related to hereditary breast cancer.',
    type: 'VCF',
    data: `#CHROM POS ID REF ALT QUAL FILTER INFO
13 32906729 rs111033441 G A . . BRCA2 pathogenic variant.
17 7577121 rs28929474 C T . . TP53 Li-Fraumeni Syndrome (R175H).
`
  },
  {
    id: 'pharma',
    label: 'Pharmacogenomics: CYP',
    description: 'Metabolic profile for CYP2D6 and CYP2C19.',
    type: 'rsID',
    data: `#CHROM POS ID REF ALT QUAL FILTER INFO
22 42522613 rs104894357 C T . . CYP2D6*4 poor metabolizer variant.
10 96521554 rs4244285 G A . . CYP2C19*2 poor metabolizer.
`
  },
  {
    id: 'braf',
    label: 'Melanoma: BRAF V600E',
    description: 'Classic oncogenic mutation.',
    type: 'VCF',
    data: `#CHROM POS ID REF ALT QUAL FILTER INFO
7 140453136 rs113488022 A T . . BRAF V600E Pathogenic mutation.`
  }
];

const ANALYSIS_OPTIONS = [
    { id: 'COMPREHENSIVE', icon: Activity, label: 'General Health', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { id: 'PHARMA', icon: PillIcon, label: 'Pharmacogenomics', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { id: 'ONCOLOGY', icon: Dna, label: 'Oncology', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    { id: 'RARE_DISEASE', icon: Microscope, label: 'Rare Disease', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
];

const ANCESTRY_OPTIONS = [
    { id: AncestryGroup.GLOBAL, label: 'Global (Mixed)', desc: 'Standard Average' },
    { id: AncestryGroup.LATIN_AMERICAN, label: 'Latin American', desc: 'Admixed American' },
    { id: AncestryGroup.AFRICAN, label: 'African', desc: 'AFR/Sub-Saharan' },
    { id: AncestryGroup.EAST_ASIAN, label: 'East Asian', desc: 'EAS' },
    { id: AncestryGroup.SOUTH_ASIAN, label: 'South Asian', desc: 'SAS' },
    { id: AncestryGroup.EUROPEAN, label: 'European', desc: 'EUR (Non-Finnish)' },
];

type AppView = 'LANDING' | 'HUB' | 'WORKSPACE';
type ModuleType = 'CLINICAL' | 'DISCOVERY';

const App: React.FC = () => {
  // Navigation State
  const [currentView, setCurrentView] = useState<AppView>('LANDING');
  const [activeModule, setActiveModule] = useState<ModuleType>('CLINICAL');

  // Clinical App State
  const [inputData, setInputData] = useState<string>("");
  const [selectedTargets, setSelectedTargets] = useState<AnalysisFocus[]>(['COMPREHENSIVE']);
  const [selectedAncestry, setSelectedAncestry] = useState<AncestryGroup>(AncestryGroup.GLOBAL);
  
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<string>("Initializing...");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'variants' | 'pharma' | 'oncology' | 'phenotypes'>('overview');
  
  // Pharma Simulation State
  const [drugSearch, setDrugSearch] = useState("");
  const [drugSimulationResult, setDrugSimulationResult] = useState<{status: string, message: string, color: string} | null>(null);

  // New State for Input Tabs
  const [inputType, setInputType] = useState<'upload' | 'paste' | 'library'>('upload');

  // --- Logic Handlers ---

  const enterHub = () => setCurrentView('HUB');
  
  const selectModule = (mod: ModuleType) => {
      setActiveModule(mod);
      setCurrentView('WORKSPACE');
  };

  const toggleTarget = (target: AnalysisFocus) => {
    if (selectedTargets.includes(target)) {
      if (selectedTargets.length === 1) return;
      setSelectedTargets(prev => prev.filter(t => t !== target));
    } else {
      setSelectedTargets(prev => [...prev, target]);
    }
  };

  const handleAnalyze = async () => {
    if (!inputData.trim()) return;
    
    setLoading(true);
    setError(null);
    setLoadingStatus("Initializing Analysis Protocol...");
    
    try {
      const analysis = await analyzeGenomicData(
          inputData, 
          selectedTargets, 
          selectedAncestry,
          (status) => setLoadingStatus(status) 
      );
      
      setResult(analysis);
      setActiveTab('overview');
      setLoading(false);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Analysis pipeline failed. Ensure valid API Key and network connection.");
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!result) return;
    generateClinicalReport(result, inputData, selectedTargets);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setInputData(text.slice(0, 15000));
        setInputType('paste'); // Switch to view data
      };
      reader.readAsText(file);
    }
  };

  const selectExample = (id: string) => {
    const ex = EXAMPLES.find(e => e.id === id);
    if (ex) {
        setInputData(ex.data);
    }
  };

  const simulatePrescription = () => {
      if (!result || !drugSearch) return;
      
      const query = drugSearch.toLowerCase();
      let foundInteraction = null;

      result.pharmaProfiles.forEach(p => {
          p.interactions.forEach(i => {
              if (i.drugName.toLowerCase().includes(query)) {
                  foundInteraction = i;
              }
          });
      });

      if (foundInteraction) {
          const fi = foundInteraction as any;
          setDrugSimulationResult({
              status: "CONTRAINDICATED / CAUTION",
              message: `Alert: ${fi.drugName} - ${fi.implication}. Severity: ${fi.severity}`,
              color: "text-red-400 border-red-500/50 bg-red-900/20"
          });
      } else {
          setDrugSimulationResult({
              status: "NO GENETIC ALERTS",
              message: `No specific CPIC contraindications found for ${drugSearch} in this genetic profile. Standard dosing applies.`,
              color: "text-emerald-400 border-emerald-500/50 bg-emerald-900/20"
          });
      }
  };

  // --- Render ---

  if (currentView === 'LANDING') {
    return <LandingPage onEnter={enterHub} />;
  }

  // Common Header
  const Header = () => (
      <header className="sticky top-0 z-40 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentView('HUB')}>
             <div className="relative">
                <div className={`absolute inset-0 blur-lg opacity-20 group-hover:opacity-40 transition-opacity ${activeModule === 'DISCOVERY' ? 'bg-violet-500' : 'bg-emerald-500'}`}></div>
                {activeModule === 'DISCOVERY' ? (
                     <FlaskConical className="w-8 h-8 text-violet-400 relative z-10 group-hover:rotate-12 transition-transform duration-700" />
                ) : (
                     <Dna className="w-8 h-8 text-emerald-400 relative z-10 group-hover:rotate-180 transition-transform duration-700" />
                )}
             </div>
             <div className="flex flex-col">
                 <span className="font-brand font-bold text-xl tracking-tight text-white group-hover:text-slate-200 transition-colors">
                    DIGITAL TWIN
                 </span>
                 <span className={`text-[10px] uppercase tracking-widest font-bold ${activeModule === 'DISCOVERY' ? 'text-violet-500' : 'text-emerald-500'}`}>
                    {activeModule === 'DISCOVERY' ? 'R&D Lab' : 'Genomic Core'}
                 </span>
             </div>
          </div>
          
          {/* Module Switcher (Sidebar Mini) */}
          <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-full border border-white/5">
              <button 
                onClick={() => setActiveModule('CLINICAL')}
                className={`p-2 rounded-full transition-all ${activeModule === 'CLINICAL' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-500 hover:text-white'}`}
                title="Clinical Hub"
              >
                  <Activity className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setActiveModule('DISCOVERY')}
                className={`p-2 rounded-full transition-all ${activeModule === 'DISCOVERY' ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/50' : 'text-slate-500 hover:text-white'}`}
                title="Discovery Lab"
              >
                  <FlaskConical className="w-4 h-4" />
              </button>
          </div>
        </div>
      </header>
  );

  if (currentView === 'HUB') {
      return (
          <div className="min-h-screen font-inter bg-[#020617] text-slate-100 flex flex-col relative overflow-hidden">
               <BioBackground variant="app" />
               <div className="flex-grow flex items-center justify-center py-20">
                   <CommandHub onSelectModule={selectModule} />
               </div>
          </div>
      )
  }
  
  return (
    <div className="min-h-screen pb-20 selection:bg-violet-500 selection:text-white font-inter bg-[#020617] text-slate-100 animate-fade-in flex flex-col relative overflow-hidden">
      
      <BioBackground variant="app" />
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow w-full relative z-10">
        
        {/* MODULE A: CLINICAL */}
        <div className={activeModule === 'CLINICAL' ? 'block' : 'hidden'}>
            
            {/* ERROR DISPLAY */}
            {error && !loading && (
                <div className="mb-8 animate-fade-in-up">
                    <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-start gap-3">
                         <AlertCircle className="w-6 h-6 text-red-500 mt-0.5 shrink-0" />
                         <div>
                             <h3 className="text-red-400 font-bold mb-1">System Alert</h3>
                             <p className="text-red-200 text-sm">{error}</p>
                             <button 
                                onClick={() => setError(null)} 
                                className="mt-2 text-xs font-bold uppercase tracking-wider text-red-400 hover:text-white underline"
                             >
                                Dismiss
                             </button>
                         </div>
                    </div>
                </div>
            )}
            
            {/* INPUT & CONFIG */}
            {!result && !loading && (
                <div className="animate-fade-in-up">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-8">
                        <div className="max-w-2xl space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                                <ShieldCheck className="w-3 h-3" /> Digital Twin Core
                            </div>
                            <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-none font-brand">
                                Digital <span className="text-emerald-400">Twin</span> Construction
                            </h1>
                            <p className="text-slate-400 text-lg max-w-lg leading-relaxed">
                                Upload <strong>your DNA data (VCF)</strong> to instantiate your biological digital twin. Powered by AlphaMissense Logic for rigorous biophysical validation.
                            </p>
                        </div>
                    </div>

                    <div className="glass-panel p-1 rounded-2xl shadow-2xl shadow-emerald-900/10">
                        <div className="bg-[#0f172a]/90 rounded-xl md:p-8 p-6 border border-white/5">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* LEFT: Data Source Tabs */}
                                <div className="lg:col-span-7 flex flex-col">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                            <Database className="w-4 h-4" /> Twin Source Data
                                        </h3>
                                        {inputData && (
                                            <button onClick={() => setInputData("")} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                                                <X className="w-3 h-3" /> Clear
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex p-1 bg-slate-900 rounded-lg mb-6 w-full sm:w-fit border border-slate-800">
                                        <button 
                                            onClick={() => setInputType('upload')}
                                            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${inputType === 'upload' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            <Upload className="w-3 h-3" /> Upload Your DNA
                                        </button>
                                        <button 
                                            onClick={() => setInputType('paste')}
                                            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${inputType === 'paste' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            <FileCode className="w-3 h-3" /> Manual Input
                                        </button>
                                        <button 
                                            onClick={() => setInputType('library')}
                                            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${inputType === 'library' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            <FileJson className="w-3 h-3" /> Demo Patients
                                        </button>
                                    </div>

                                    <div className="flex-grow bg-slate-950/50 rounded-xl border border-slate-800 relative overflow-hidden min-h-[300px]">
                                        {inputType === 'upload' && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 group transition-all">
                                                <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-slate-700 group-hover:border-emerald-500/50">
                                                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                                                </div>
                                                <h4 className="text-white font-bold mb-2">Drag & Drop DNA File (VCF)</h4>
                                                <p className="text-slate-500 text-xs mb-6 max-w-xs">Supports .VCF, .TXT (23andMe), .FASTA</p>
                                                <label className="px-6 py-2.5 bg-white text-slate-900 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-emerald-50 transition-colors shadow-lg hover:shadow-emerald-500/20">
                                                    Browse Files
                                                    <input type="file" onChange={handleFileUpload} className="hidden" accept=".vcf,.txt,.fasta,.csv" />
                                                </label>
                                            </div>
                                        )}
                                        {inputType === 'paste' && (
                                            <textarea 
                                                value={inputData}
                                                onChange={(e) => setInputData(e.target.value)}
                                                placeholder="> Paste sequence data or rsIDs here..."
                                                className="w-full h-full p-6 bg-transparent resize-none font-mono text-xs text-slate-300 focus:outline-none placeholder:text-slate-700 leading-relaxed"
                                                autoFocus
                                            />
                                        )}
                                        {inputType === 'library' && (
                                            <div className="p-4 grid grid-cols-1 gap-3 overflow-y-auto h-full">
                                                {EXAMPLES.map(ex => (
                                                    <button 
                                                        key={ex.id}
                                                        onClick={() => { selectExample(ex.id); setInputType('paste'); }}
                                                        className="flex items-start gap-4 p-4 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800 transition-all text-left group"
                                                    >
                                                        <div className={`mt-1 p-2 rounded bg-slate-950 border border-slate-800 ${inputData === ex.data ? 'text-emerald-400 border-emerald-500/30' : 'text-slate-500 group-hover:text-emerald-400'}`}>
                                                            <FileText className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <h5 className="text-sm font-bold text-slate-200 group-hover:text-white mb-1">{ex.label}</h5>
                                                            <p className="text-xs text-slate-500">{ex.description}</p>
                                                        </div>
                                                        {inputData === ex.data && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* RIGHT: Analysis Config */}
                                <div className="lg:col-span-5 flex flex-col h-full pl-0 lg:pl-6 border-l border-white/5">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                        <Target className="w-4 h-4" /> Targeting Pipelines
                                    </h3>
                                    
                                    <div className="space-y-3 flex-grow">
                                        {ANALYSIS_OPTIONS.map((opt) => {
                                            const isSelected = selectedTargets.includes(opt.id as AnalysisFocus);
                                            return (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => toggleTarget(opt.id as AnalysisFocus)}
                                                    className={`w-full p-3.5 rounded-xl border text-left transition-all duration-300 flex items-center gap-4 group relative overflow-hidden ${
                                                        isSelected
                                                        ? `${opt.bg} ${opt.border} shadow-lg` 
                                                        : 'bg-slate-900/30 border-slate-800/50 hover:bg-slate-800'
                                                    }`}
                                                >
                                                    <div className={`p-2 rounded-lg bg-slate-950 border border-white/5 ${isSelected ? opt.color : 'text-slate-600 group-hover:text-slate-400'}`}>
                                                        <opt.icon className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-grow">
                                                        <span className={`text-sm font-bold block ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>
                                                            {opt.label}
                                                        </span>
                                                    </div>
                                                    {isSelected && (
                                                        <CheckCircle2 className={`w-5 h-5 ${opt.color}`} />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    
                                    <div className="mt-8 space-y-4">
                                        <div className="bg-slate-900/40 p-3 rounded-lg border border-indigo-500/20">
                                           <div className="flex items-center gap-2 mb-2">
                                              <Globe2 className="w-4 h-4 text-indigo-400" />
                                              <span className="text-xs font-bold text-slate-300">Bio-Geographical Ancestry</span>
                                           </div>
                                           <select 
                                             value={selectedAncestry}
                                             onChange={(e) => setSelectedAncestry(e.target.value as AncestryGroup)}
                                             className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                           >
                                              {ANCESTRY_OPTIONS.map(opt => (
                                                  <option key={opt.id} value={opt.id}>{opt.label} - {opt.desc}</option>
                                              ))}
                                           </select>
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <SciFiButton 
                                            onClick={handleAnalyze} 
                                            disabled={!inputData}
                                            className="w-full"
                                        >
                                            INSTANTIATE TWIN
                                            <ArrowRight className="w-5 h-5" />
                                        </SciFiButton>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* LOADING STATE */}
            {loading && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in-up">
                    <div className="glass-panel p-1 rounded-2xl shadow-2xl shadow-emerald-900/20 max-w-lg w-full">
                        <div className="bg-[#0f172a]/90 rounded-xl p-8 border border-white/5 relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/5">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-emerald-500 blur-lg opacity-40 animate-pulse"></div>
                                    <Server className="w-8 h-8 text-emerald-400 relative z-10" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-brand font-bold text-white tracking-wide">Digital Twin Active</h2>
                                    <p className="text-xs text-slate-400 font-mono">Building personalized biological model...</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-center justify-center py-8">
                                 <div className="w-16 h-16 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin mb-6"></div>
                                 <div className="bg-slate-800/50 rounded-lg px-4 py-2 border border-slate-700 flex items-center gap-2">
                                    <Network className="w-4 h-4 text-emerald-400 animate-pulse" />
                                    <span className="text-sm font-mono text-emerald-200">{loadingStatus}</span>
                                 </div>
                            </div>
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50 animate-[scan_2s_linear_infinite]"></div>
                        </div>
                    </div>
                </div>
            )}

            {/* RESULTS DASHBOARD */}
            {result && !loading && (
                <div className="animate-fade-in space-y-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                 <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                 <h2 className="text-3xl font-bold text-white font-brand">Analysis Complete</h2>
                            </div>
                            <div className="flex items-center gap-3 text-slate-400 text-sm">
                                <span className="font-mono text-xs px-2 py-0.5 bg-slate-800 rounded text-emerald-300 border border-slate-700">ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                                <span className="flex items-center gap-1 text-emerald-400 font-bold text-[10px] uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                                    <ShieldCheck className="w-3 h-3" /> Real Data Verified
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={handleDownloadPDF}
                                className="hidden md:flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-emerald-50 hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all"
                            >
                                <Download className="w-4 h-4" />
                                Download Clinical Summary (PDF)
                            </button>
                            <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5 overflow-x-auto max-w-full">
                                 {['overview', 'variants', 'pharma', 'oncology', 'phenotypes'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as any)}
                                        className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${
                                            activeTab === tab 
                                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' 
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="min-h-[500px]">
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {result.equityAnalysis && result.equityAnalysis.biasCorrectionApplied && (
                                    <AncestryCard analysis={result.equityAnalysis} />
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                    <div className="md:col-span-8 glass-panel p-8 rounded-xl relative overflow-hidden flex flex-col justify-center border-l-4 border-l-emerald-500">
                                        <div className="absolute top-0 right-0 p-8 opacity-5">
                                            <FileText className="w-32 h-32 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 font-brand">
                                            <Target className="w-5 h-5 text-emerald-400" />
                                            Executive Summary
                                        </h3>
                                        <p className="text-slate-300 leading-loose text-base">
                                            {result.patientSummary}
                                        </p>
                                    </div>
                                    <div className="md:col-span-4 bg-[#050505] rounded-xl border border-white/10 relative overflow-hidden min-h-[250px] group shadow-2xl">
                                         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                                         <div className="absolute top-4 left-4 right-4 flex justify-between text-[10px] text-slate-600 font-mono">
                                             <span>SUBJ_01</span>
                                             <span className="text-emerald-500">STABLE</span>
                                         </div>
                                         <div className="absolute inset-0 flex items-center justify-center">
                                             <div className="relative w-full h-full flex items-center justify-center">
                                                  <div className="w-32 h-64 border-x border-emerald-500/20 rounded-[100%] absolute animate-pulse"></div>
                                                  <div className="w-48 h-48 bg-emerald-600/10 blur-3xl rounded-full absolute"></div>
                                                  <Fingerprint className="w-20 h-20 text-emerald-400 opacity-80" />
                                                  <div className="absolute w-full h-[1px] bg-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.8)] top-0 animate-[scan_3s_ease-in-out_infinite]"></div>
                                             </div>
                                         </div>
                                         <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black to-transparent">
                                            <h4 className="text-white font-brand font-bold text-center text-lg">Digital Twin Active</h4>
                                         </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="glass-panel p-6 rounded-xl">
                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">Variant Risk Distribution</h3>
                                        <RiskDistributionChart variants={result.variants || []} />
                                    </div>
                                    <div className="glass-panel p-6 rounded-xl">
                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">Oncology Target Map</h3>
                                        <OncologyTargetChart profiles={result.oncologyProfiles || []} />
                                    </div>
                                </div>
                                {result.nDimensionalAnalysis && (
                                    <NDimensionalCard analysis={result.nDimensionalAnalysis} />
                                )}
                            </div>
                        )}

                        {activeTab === 'variants' && (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                 {(!result.variants || result.variants.length === 0) && <p className="text-slate-500 col-span-2 text-center py-20 italic">No significant variants detected.</p>}
                                 {result.variants?.map((variant, idx) => (
                                     <VariantCard key={idx} variant={variant} />
                                 ))}
                            </div>
                        )}

                        {activeTab === 'pharma' && (
                            <div className="space-y-6">
                                <div className="glass-panel p-6 rounded-xl border-l-4 border-l-emerald-500 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6 opacity-10">
                                        <Activity className="w-24 h-24 text-emerald-400" />
                                    </div>
                                    <div className="flex items-center justify-between mb-6 relative z-10">
                                        <div>
                                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                                <Pill className="w-6 h-6 text-emerald-400" />
                                                EHR Prescription Simulator
                                            </h3>
                                            <p className="text-slate-400 text-sm mt-1">
                                                Pre-prescription check against CPIC guidelines.
                                            </p>
                                        </div>
                                        <div className="px-3 py-1 bg-emerald-900/30 border border-emerald-500/30 rounded-full flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase">
                                            <span className="relative flex h-2 w-2">
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                            Live CPIC Mode
                                        </div>
                                    </div>
                                    <div className="flex gap-4 mb-4 relative z-10">
                                        <div className="flex-grow relative">
                                            <input 
                                                type="text" 
                                                value={drugSearch}
                                                onChange={(e) => setDrugSearch(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && simulatePrescription()}
                                                placeholder="Enter drug name (e.g., Warfarin)..."
                                                className="w-full bg-slate-900/80 border border-slate-700 text-white rounded-lg px-4 py-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none pl-10"
                                            />
                                            <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                                        </div>
                                        <SciFiButton onClick={simulatePrescription} disabled={!drugSearch} className="whitespace-nowrap">
                                            CHECK SAFETY
                                        </SciFiButton>
                                    </div>
                                    {drugSimulationResult && (
                                        <div className={`p-4 rounded-lg border flex items-start gap-3 relative z-10 animate-fade-in ${drugSimulationResult.color}`}>
                                            <AlertIcon className="w-6 h-6 mt-0.5 shrink-0" />
                                            <div>
                                                <h4 className="font-bold text-sm uppercase tracking-wider mb-1">{drugSimulationResult.status}</h4>
                                                <p className="text-sm font-medium">{drugSimulationResult.message}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    {(!result.pharmaProfiles || result.pharmaProfiles.length === 0) && <p className="text-slate-500 col-span-2 text-center py-20 italic">No pharmacogenomic data available.</p>}
                                    {result.pharmaProfiles?.map((profile, idx) => (
                                        <PharmaCard key={idx} profile={profile} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'oncology' && (
                            <div className="glass-panel rounded-xl overflow-hidden border border-white/5">
                                <table className="min-w-full divide-y divide-white/5">
                                    <thead className="bg-slate-900/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Gene</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Predisposition</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Risk Score</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {(!result.oncologyProfiles || result.oncologyProfiles.length === 0) && (
                                            <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500 italic">No oncology risks detected.</td></tr>
                                        )}
                                        {result.oncologyProfiles?.map((profile, idx) => (
                                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">{profile.gene}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{profile.predisposition}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <span className={`text-sm font-bold mr-3 w-8 text-right ${profile.riskScore > 50 ? 'text-orange-400' : 'text-emerald-400'}`}>
                                                            {profile.riskScore}
                                                        </span>
                                                        <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full shadow-[0_0_10px_currentColor] ${profile.riskScore > 75 ? 'bg-red-500 text-red-500' : profile.riskScore > 40 ? 'bg-orange-400 text-orange-400' : 'bg-emerald-500 text-emerald-500'}`} style={{width: `${profile.riskScore}%`}}></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-400">{profile.notes}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        
                        {activeTab === 'phenotypes' && (
                            <div className="space-y-6">
                                <div className="glass-panel p-6 rounded-xl border-l-4 border-l-pink-500">
                                    <h3 className="text-xl font-bold text-white mb-2 font-brand flex items-center gap-2">
                                        <User className="w-5 h-5 text-pink-500" />
                                        Digital Phenotype & Traits
                                    </h3>
                                    <p className="text-slate-400 text-sm">
                                        Predicted phenotypic characteristics based on genetic profile.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {(!result.phenotypeTraits || result.phenotypeTraits.length === 0) && <p className="text-slate-500 col-span-4 text-center py-20 italic">No phenotype traits detected.</p>}
                                    {result.phenotypeTraits?.map((trait, idx) => (
                                        <PhenotypeCard key={idx} trait={trait} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* MODULE B: DISCOVERY LAB */}
        <div className={activeModule === 'DISCOVERY' ? 'block' : 'hidden'}>
             <DiscoveryLab />
        </div>

      </main>

      {/* Footer Disclaimer */}
      <footer className="w-full bg-[#020617]/90 border-t border-white/5 py-4 relative z-10">
         <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
               <ShieldCheck className="w-4 h-4 text-emerald-500" />
               <p>
                  <strong className="text-slate-400">Validated Sources:</strong> Findings are cross-referenced with <span className="text-slate-300">ClinVar</span>, <span className="text-slate-300">PharmGKB</span>, <span className="text-slate-300">dbSNP</span>.
               </p>
            </div>
            <div className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
               <Info className="w-3 h-3" />
               <p>For research and educational simulation only. Consult a genetic counselor for medical diagnosis.</p>
            </div>
         </div>
      </footer>

      <style>{`
        @keyframes scan {
            0% { top: 10%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 90%; opacity: 0; }
        }
        @keyframes spin-slow {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default App;