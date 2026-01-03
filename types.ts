
export enum VariantRiskLevel {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  PATHOGENIC = 'PATHOGENIC',
  BENIGN = 'BENIGN',
  UNCERTAIN = 'UNCERTAIN'
}

export enum MetabolizerStatus {
  POOR = 'POOR',
  INTERMEDIATE = 'INTERMEDIATE',
  NORMAL = 'NORMAL', // Extensive
  RAPID = 'RAPID',
  ULTRA_RAPID = 'ULTRA_RAPID',
  UNKNOWN = 'UNKNOWN'
}

export type AnalysisFocus = 'COMPREHENSIVE' | 'PHARMA' | 'ONCOLOGY' | 'RARE_DISEASE';

export enum AncestryGroup {
  GLOBAL = 'GLOBAL', 
  LATIN_AMERICAN = 'LATIN_AMERICAN',
  AFRICAN = 'AFRICAN',
  EAST_ASIAN = 'EAST_ASIAN',
  SOUTH_ASIAN = 'SOUTH_ASIAN',
  EUROPEAN = 'EUROPEAN',
  ASHKENAZI_JEWISH = 'ASHKENAZI_JEWISH'
}

export interface DrugInteraction {
  drugName: string;
  implication: string; // e.g., "Requires lower dose", "Avoid use"
  severity: 'INFO' | 'WARNING' | 'DANGER';
  cpicGuidelineUrl?: string; // Link to specific guideline
}

// XAI & Attention Map Structures
export interface AttentionPoint {
  position: number; // Relative or absolute position
  residue: string; // Amino acid code (e.g., "A", "R")
  weight: number; // 0.0 to 1.0 (Attention intensity)
  impactDescription?: string; // e.g. "Hydrophobic Core Contact"
}

export interface XAIAnalysis {
  pathogenicityScore: number; // 0.0 to 1.0 (Continuous scale)
  predictionConfidence: number; // 0.0 to 1.0
  structuralMechanism: string; // e.g., "Destabilizes alpha-helix structure"
  molecularFunction: string; // e.g., "DNA binding domain"
  conservationScore: number; // e.g., PhyloP score simulation (0-10)
  pdbId?: string; // Legacy PDB Structure ID
  uniprotId?: string; // NEW: AlphaFold UniProt ID (e.g. "P04637")
  variantPosition?: number; // Integer position for 3D highlighting
  attentionMap: AttentionPoint[]; // Simulated Transformer Attention Weights
}

export interface VariantAnalysis {
  gene: string;
  variant: string; // e.g., rs123456 or c.123A>G
  rsId?: string; // Standard dbSNP ID
  description: string;
  clinVarSignificance: string; // REAL ClinVar data
  riskLevel: VariantRiskLevel;
  condition?: string; 
  category: 'GENERAL' | 'PHARMA' | 'ONCOLOGY';
  
  // Real Data Fields
  populationFrequency?: string; // gnomAD Real Data
  caddScore?: number; // Real CADD Phred Score
  revelScore?: number; // Real REVEL Score (0-1)
  
  equityAdjustment?: string;
  xai?: XAIAnalysis; // New Field for Explainable AI
}

// Updated Pharma Profile with Grounding Sources
export interface VerifiedSource {
    title: string;
    url: string;
    snippet?: string;
}

export interface PharmaProfile {
  gene: string;
  phenotype: MetabolizerStatus;
  description: string;
  interactions: DrugInteraction[];
  sources?: VerifiedSource[]; // NEW: For Google Search Grounding
}

// Updated Oncology Profile for Molecular Pathology
export interface OncologyProfile {
  gene: string;
  variant: string;
  // AMP/ASCO/CAP Evidence Tiers
  evidenceTier: 'TIER_1_STRONG' | 'TIER_2_POTENTIAL' | 'TIER_3_UNCERTAIN' | 'TIER_4_BENIGN';
  
  // The "Why" - Molecular Mechanism
  mechanismOfAction: string; // e.g. "Loss of Heterozygosity (LOH)", "Constitutive Activation"
  cancerHallmark: string; // e.g. "Genomic Instability", "Sustaining Proliferative Signaling"
  
  // The "Action" - Therapeutics
  therapeuticImplications: string[]; // e.g. ["PARP Inhibitors", "Platinum-based chemotherapy"]
  
  riskScore: number; // 0-100 Scientific probability score
  citation: string; // e.g. "NCCN Guidelines v2.2024"
  functionalCategory: 'DNA_REPAIR' | 'CELL_CYCLE' | 'METABOLISM' | 'IMMUNITY' | 'UNKNOWN';
}

export interface EquityAnalysis {
  detectedAncestry: string;
  biasCorrectionApplied: boolean;
  adjustmentFactor: number; 
  explanation: string;
}

// === NEW: PHENOTYPE TRAITS ===
export interface PhenotypeTrait {
  trait: string;
  category: 'APPEARANCE' | 'NUTRITION' | 'FITNESS' | 'SENSORY' | 'OTHER';
  prediction: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  gene: string;
}

// === NEW: ACTIONABLE CLINICAL INTELLIGENCE ===

export interface ActionItem {
    title: string;
    priority: 'IMMEDIATE' | 'HIGH' | 'ROUTINE';
    description: string;
    specialistReferral?: string; // e.g. "Cardiologist", "Genetic Counselor"
}

export interface LifestyleMod {
    category: 'DIET' | 'EXERCISE' | 'ENVIRONMENT' | 'SUPPLEMENTS';
    recommendation: string;
    impactLevel: 'HIGH' | 'MODERATE';
}

export interface MonitoringProtocol {
    procedure: string; // e.g. "MRI Breast Screen"
    frequency: string; // e.g. "Every 6 months"
    startAge: string; // e.g. "Age 30"
}

// Completely Restructured Clinical Analysis
export interface NDimensionalAnalysis {
    clinicalSummary: string; // Concise overview
    overallRiskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    
    // The "What To Do" Sections
    actionPlan: ActionItem[]; 
    lifestyleModifications: LifestyleMod[];
    surveillancePlan: MonitoringProtocol[];
}

export interface AnalysisResult {
  patientSummary: string;
  variants: VariantAnalysis[];
  pharmaProfiles: PharmaProfile[];
  oncologyProfiles: OncologyProfile[];
  phenotypeTraits?: PhenotypeTrait[];
  overallRiskScore: number; 
  equityAnalysis?: EquityAnalysis; 
  nDimensionalAnalysis?: NDimensionalAnalysis; 
}

// === MODULE B: R&D DISCOVERY TYPES ===

export interface DockingSimulation {
    targetName: string;
    pdbId?: string; // Legacy
    uniprotId: string; // New AlphaFold Target
    ligandName: string;
    bindingEnergy: number; 
    activeSiteResidues: number[];
}

export interface NetworkNode {
    id: string;
    group: 'GENE' | 'PROTEIN' | 'METABOLITE';
    impactScore: number; 
}
export interface NetworkLink {
    source: string;
    target: string;
    interactionType: 'ACTIVATION' | 'INHIBITION';
}

export interface LiteratureInsight {
    title: string;
    source: string;
    summary: string;
    relevanceScore: number;
}

export interface PopulationData {
    population: string;
    alleleFrequency: number;
    predictedEfficacy: number; 
}

export interface SandboxResult {
    targetId: string;
    hypothesis: string;
    docking: DockingSimulation;
    network: { nodes: NetworkNode[], links: NetworkLink[] };
    literature: LiteratureInsight[];
    stratification: PopulationData[];
    convergenceInsight: string;
    
    // New Detailed Explanations for Step-by-Step UI
    detailedAnalysis: {
        dockingDynamics: string; // Explains DeltaG, Kd, Steric hindrance
        pathwayKinetics: string; // Explains signal transduction rates
        evidenceSynthesis: string; // Explains confidence intervals / p-values
        populationStat: string; // Explains statistical significance of stratification
    };
}

export interface CorrelationPoint {
    x: string;
    y: string;
    value: number;
    significance: number;
}
