
import React, { useState } from 'react';
import { Scan, Dna, ArrowRight, Activity, ShieldCheck, Cpu, Network, Zap, Globe2, AlertTriangle, FileText, CheckCircle2, X, Lock, Eye, Server, Trash2 } from 'lucide-react';
import { BioBackground } from './BioBackground';

interface LandingPageProps {
  onEnter: () => void;
  language: 'es' | 'en';
  setLanguage: (lang: 'es' | 'en') => void;
}

const TEXTS = {
    es: {
        status: "Sistema Activo v3.0",
        eyebrow: "GÉMELO DIGITAL",
        headline_1: "MEDICINA DE",
        headline_2: "PRECISIÓN",
        subheading: "Plataforma de simulación biológica personalizada. Ingresa tu información genética para acceder a",
        subheading_highlight: "predicciones de salud en tiempo real",
        cta: "INICIAR SIMULACIÓN",
        engine: "Motor Listo",
        compliance: "Protocolo HIPAA",
        privacy: "Política de Privacidad",
        modal_disclaimer_title: "Protocolo Legal",
        modal_privacy_title: "Política de Privacidad",
        btn_cancel: "Cancelar Operación",
        btn_accept: "Aceptar y Entrar",
        footer_processing: "Procesamiento",
        footer_db: "Base de Datos",
        footer_vis: "Visualización"
    },
    en: {
        status: "System Active v3.0",
        eyebrow: "DIGITAL TWIN",
        headline_1: "PRECISION",
        headline_2: "MEDICINE",
        subheading: "Personalized biological simulation platform. Input your genetic data to access",
        subheading_highlight: "real-time health predictions",
        cta: "START SIMULATION",
        engine: "Engine Ready",
        compliance: "HIPAA Compliant",
        privacy: "Privacy Policy",
        modal_disclaimer_title: "Legal Protocol",
        modal_privacy_title: "Privacy Policy",
        btn_cancel: "Cancel Operation",
        btn_accept: "Accept & Enter",
        footer_processing: "Processing",
        footer_db: "Database",
        footer_vis: "Visualization"
    }
};

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, language, setLanguage }) => {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const t = TEXTS[language];

  const handleStartClick = () => {
    setShowDisclaimer(true);
  };

  const handleAccept = () => {
    setShowDisclaimer(false);
    onEnter();
  };

  const toggleLanguage = () => {
      setLanguage(language === 'es' ? 'en' : 'es');
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-[#020617] flex flex-col font-inter selection:bg-cyan-500 selection:text-white">
      
      {/* === 1. DEEP SPACE VISUAL ENGINE === */}
      <div className="absolute inset-0 bg-[#020617] z-0"></div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] left-[20%] w-[60vw] h-[60vw] bg-violet-600/10 rounded-full mix-blend-screen filter blur-[120px] animate-pulse-slow opacity-60"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[70vw] h-[70vw] bg-blue-900/20 rounded-full mix-blend-screen filter blur-[100px] animate-nebula opacity-50"></div>
        <div className="absolute top-[40%] right-[30%] w-[40vw] h-[40vw] bg-cyan-900/10 rounded-full mix-blend-screen filter blur-[80px] animate-float opacity-40"></div>
      </div>
      <div className="absolute inset-0 z-0 opacity-60 pointer-events-none">
          <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full animate-twinkle" style={{animationDelay: '0s'}}></div>
          <div className="absolute top-1/4 left-1/3 w-0.5 h-0.5 bg-white rounded-full animate-twinkle" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-cyan-200 rounded-full animate-twinkle" style={{animationDelay: '2s'}}></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:6rem_6rem] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] pointer-events-none z-0"></div>
      <div className="opacity-50 z-0">
          <BioBackground variant="landing" />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020617_100%)] pointer-events-none z-0"></div>

      {/* === LANGUAGE TOGGLE (Top Right) === */}
      <div className="absolute top-6 right-6 z-50">
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/50 border border-white/10 hover:border-cyan-500/50 hover:bg-slate-800 transition-all text-slate-300 hover:text-white group backdrop-blur-md"
          >
              <Globe2 className="w-3.5 h-3.5 text-cyan-500 group-hover:rotate-180 transition-transform duration-700" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{language === 'es' ? 'English Version' : 'Versión Español'}</span>
          </button>
      </div>

      {/* === 2. CONTENT CONTAINER === */}
      <div className="relative z-20 flex-grow flex flex-col items-center justify-center w-full max-w-7xl mx-auto px-4 py-12 md:py-0">
        
        <div className="flex-grow-[1] hidden md:block"></div>

        {/* --- CENTER HERO --- */}
        <div className="flex flex-col items-center text-center max-w-6xl mx-auto relative">
            
            {/* System Status Pill */}
            <div className="mb-10 animate-fade-in-up flex items-center justify-center">
                <div className="group relative inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-slate-950/50 border border-white/10 backdrop-blur-md hover:border-violet-500/50 transition-all duration-300 cursor-default shadow-lg shadow-violet-900/10">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="relative text-[11px] font-mono text-slate-300 tracking-[0.2em] uppercase group-hover:text-white transition-colors">
                        {t.status}
                    </span>
                </div>
            </div>

            {/* Main Headline */}
            <div className="relative mb-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-violet-500/10 blur-[90px] rounded-full pointer-events-none"></div>
                
                <h1 className="relative text-5xl md:text-7xl lg:text-9xl font-bold text-white tracking-tighter font-brand leading-[0.9] z-10">
                  <span className="block text-slate-400 text-2xl md:text-4xl lg:text-5xl font-light tracking-normal mb-2 opacity-80">
                      {t.eyebrow}
                  </span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-400 drop-shadow-2xl">
                    {t.headline_1}
                  </span>
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-white to-cyan-300 animate-shine drop-shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                    {t.headline_2}
                  </span>
                </h1>
                
                <div className="absolute -left-16 top-1/2 -translate-y-1/2 opacity-20 hidden lg:block mix-blend-screen">
                    <Cpu className="w-24 h-24 text-cyan-500 animate-[spin_60s_linear_infinite]" />
                </div>
                 <div className="absolute -right-16 top-1/2 -translate-y-1/2 opacity-20 hidden lg:block mix-blend-screen">
                    <Network className="w-24 h-24 text-violet-500 animate-[pulse_8s_ease-in-out_infinite]" />
                </div>
            </div>

            {/* Subheading */}
            <div className="mb-14 max-w-2xl mx-auto animate-fade-in-up relative z-20" style={{ animationDelay: '0.2s' }}>
                 <p className="text-slate-300 text-lg md:text-xl font-light leading-relaxed drop-shadow-md">
                   {t.subheading} <br className="hidden md:block"/>
                   <span className="text-white font-medium border-b border-violet-500/30 pb-0.5">{t.subheading_highlight}</span>.
                </p>
            </div>

            {/* Primary Action Button */}
            <div className="w-full max-w-sm animate-fade-in-up relative z-30" style={{ animationDelay: '0.3s' }}>
                <button 
                    onClick={handleStartClick}
                    className="group relative w-full h-20 bg-[#0a0f1e]/80 hover:bg-[#0f172a] rounded-xl border border-white/10 hover:border-violet-500/50 transition-all duration-300 overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                >
                    <div className="absolute top-0 bottom-0 w-[40%] bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 -translate-x-[200%] group-hover:translate-x-[400%] transition-transform duration-1000 ease-in-out"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="absolute inset-0 flex items-center justify-between px-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center justify-center group-hover:bg-violet-500/20 group-hover:scale-110 transition-all duration-300">
                                <Scan className="w-5 h-5 text-violet-400 group-hover:text-white" />
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-white font-bold tracking-widest text-sm uppercase group-hover:text-violet-100 transition-colors">
                                    {t.cta}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono group-hover:text-violet-300 transition-colors flex items-center gap-1.5">
                                    <Activity className="w-3 h-3" /> {t.engine}
                                </span>
                            </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                </button>
                
                <div className="mt-8 flex justify-center gap-6 opacity-60">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono uppercase tracking-wider group cursor-help">
                        <ShieldCheck className="w-3 h-3 text-emerald-500 group-hover:scale-110 transition-transform" />
                        <span>{t.compliance}</span>
                    </div>
                    <button onClick={() => setShowPrivacy(true)} className="flex items-center gap-2 text-[10px] text-slate-400 font-mono uppercase tracking-wider group cursor-pointer hover:text-white transition-colors">
                        <Dna className="w-3 h-3 text-cyan-500 group-hover:scale-110 transition-transform" />
                        <span className="border-b border-transparent group-hover:border-cyan-500">{t.privacy}</span>
                    </button>
                </div>
            </div>

        </div>

        <div className="flex-grow-[1]"></div>
      </div>

      {/* === DISCLAIMER MODAL === */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
            <div className="relative w-full max-w-2xl bg-[#0a0f1e] border border-amber-500/30 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.15)] overflow-hidden flex flex-col animate-fade-in-up transform scale-100">
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-amber-900/20 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-brand font-bold text-white tracking-wide">{t.modal_disclaimer_title}</h2>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowDisclaimer(false)}
                        className="p-2 text-slate-500 hover:text-white transition-colors hover:bg-white/5 rounded-lg"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar bg-[#0a0f1e]">
                    <div className="p-4 bg-amber-950/30 border border-amber-500/20 rounded-xl flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-amber-200/80 text-[11px] leading-relaxed font-medium">
                            {language === 'es' 
                             ? "Al continuar, confirma que entiende que este software es para fines demostrativos y educativos, y exime a los desarrolladores de cualquier responsabilidad por decisiones médicas tomadas basadas en estos datos."
                             : "By continuing, you confirm that you understand this software is for demonstrative and educational purposes only, and you release the developers from any liability for medical decisions made based on this data."}
                        </p>
                    </div>
                </div>

                <div className="p-6 border-t border-white/10 bg-[#050914] flex justify-end gap-4">
                    <button 
                        onClick={() => setShowDisclaimer(false)}
                        className="px-6 py-3 rounded-xl border border-slate-700 text-slate-400 font-bold text-xs hover:bg-slate-800 hover:text-white transition-colors uppercase tracking-wider"
                    >
                        {t.btn_cancel}
                    </button>
                    <button 
                        onClick={handleAccept}
                        className="px-8 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-violet-900/20 hover:shadow-cyan-500/30 transition-all uppercase tracking-wider flex items-center gap-2 transform hover:translate-y-[-1px]"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        {t.btn_accept}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* === PRIVACY POLICY MODAL === */}
      {showPrivacy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
            <div className="relative w-full max-w-3xl bg-[#0a0f1e] border border-cyan-500/30 rounded-2xl shadow-[0_0_60px_rgba(6,182,212,0.1)] overflow-hidden flex flex-col animate-fade-in-up">
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-cyan-900/20 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                            <Lock className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-brand font-bold text-white tracking-wide">{t.modal_privacy_title}</h2>
                            <span className="text-[10px] text-cyan-500 uppercase font-mono tracking-widest font-bold">Zero-Knowledge Architecture</span>
                        </div>
                    </div>
                    <button onClick={() => setShowPrivacy(false)} className="p-2 text-slate-500 hover:text-white transition-colors hover:bg-white/5 rounded-lg"><X className="w-6 h-6" /></button>
                </div>

                <div className="p-8 space-y-8 max-h-[65vh] overflow-y-auto custom-scrollbar bg-[#0a0f1e]">
                   <div className="flex gap-5">
                        <div className="mt-1"><Server className="w-6 h-6 text-emerald-400" /></div>
                        <div>
                            <h3 className="text-base font-bold text-white mb-2">{language === 'es' ? '1. Soberanía Local de Datos' : '1. Local Data Sovereignty'}</h3>
                            <p className="text-sm text-slate-400 leading-relaxed text-justify">
                                {language === 'es' 
                                ? "Esta aplicación opera bajo una filosofía 'Local-First'. El procesamiento de tu archivo genómico ocurre exclusivamente en la memoria de tu navegador."
                                : "This application operates under a 'Local-First' philosophy. Processing of your genomic file occurs exclusively in your browser's memory."}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-white/10 bg-[#050914] flex justify-center">
                    <button onClick={() => setShowPrivacy(false)} className="px-8 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors w-full sm:w-auto">
                        {language === 'es' ? 'Entendido' : 'Understood'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* === FOOTER STATS === */}
      <div className="relative z-20 w-full border-t border-white/5 bg-[#020617]/70 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-wrap justify-center md:justify-between items-center gap-8">
            <div className="flex gap-12">
                <div className="text-center md:text-left">
                    <div className="text-[10px] font-mono text-slate-500 tracking-widest uppercase mb-1">{t.footer_processing}</div>
                    <div className="text-lg font-bold text-white font-brand">Gemini 1.5 <span className="text-violet-500">Pro</span></div>
                </div>
                <div className="text-center md:text-left">
                    <div className="text-[10px] font-mono text-slate-500 tracking-widest uppercase mb-1">{t.footer_db}</div>
                    <div className="text-lg font-bold text-white font-brand">ClinVar <span className="text-cyan-500">Live</span></div>
                </div>
                <div className="text-center md:text-left hidden sm:block">
                     <div className="text-[10px] font-mono text-slate-500 tracking-widest uppercase mb-1">{t.footer_vis}</div>
                     <div className="text-lg font-bold text-white font-brand">AlphaFold <span className="text-emerald-500">3D</span></div>
                </div>
            </div>
            
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-default">
                <Globe2 className="w-3 h-3 text-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono text-slate-300">NODE STATUS: ONLINE</span>
            </div>
        </div>
      </div>

      <style>{`
        .animate-shine {
            background-size: 200% auto;
            animation: shine 4s linear infinite;
        }
        @keyframes shine {
            to { background-position: 200% center; }
        }
        @keyframes nebula-move {
            0% { transform: scale(1); opacity: 0.4; }
            50% { transform: scale(1.1); opacity: 0.6; }
            100% { transform: scale(1); opacity: 0.4; }
        }
        .animate-nebula { animation: nebula-move 15s infinite ease-in-out; }
        
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
            100% { transform: translateY(0px); }
        }
        .animate-float { animation: float 10s infinite ease-in-out; }

        @keyframes twinkle {
            0%, 100% { opacity: 0.2; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
        }
        .animate-twinkle { animation: twinkle 3s infinite ease-in-out; }

        .animate-pulse-slow { animation: pulse 8s infinite ease-in-out; }
      `}</style>
    </div>
  );
};
