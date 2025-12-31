

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
  pdbId?: string; // REAL PDB Structure ID (e.g. "4IBQ")
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

export interface PharmaProfile {
  gene: string;
  phenotype: MetabolizerStatus;
  description: string;
  interactions: DrugInteraction[];
}

export interface OncologyProfile {
  gene: string;
  predisposition: string;
  riskScore: number; // 0-100
  notes: string;
}

export interface PhenotypeTrait {
  trait: string; 
  prediction: string; 
  gene: string; 
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'APPEARANCE' | 'NUTRITION' | 'FITNESS' | 'SENSORY';
  description: string;
}

export interface EquityAnalysis {
  detectedAncestry: string;
  biasCorrectionApplied: boolean;
  adjustmentFactor: number; 
  explanation: string;
}

// NEW: N-Dimensional Analysis (Convergence)
export interface NDimensionalAnalysis {
    compositeBiomarker: string; // e.g. "Inflammo-Metabolic Axis"
    convergenceScore: number; // 0-100
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    factors: string[]; // List of genes/factors involved (e.g. ["CYP2D6", "Ancestry", "Inflammation"])
    clinicalInsight: string; // The "Hidden" insight
    networkNodes: { id: string, label: string, group: 'GENE' | 'CLINICAL' | 'LIFESTYLE' }[];
    networkLinks: { source: string, target: string, value: number }[];
}

export interface CorrelationPoint {
  x: string;
  y: string;
  value: number;
  significance: number;
}

export interface AnalysisResult {
  patientSummary: string;
  variants: VariantAnalysis[];
  pharmaProfiles: PharmaProfile[];
  oncologyProfiles: OncologyProfile[];
  phenotypeTraits: PhenotypeTrait[];
  overallRiskScore: number; 
  equityAnalysis?: EquityAnalysis; 
  nDimensionalAnalysis?: NDimensionalAnalysis; 
}

// === MODULE B: R&D DISCOVERY TYPES ===

// 1. Ligand Architect
export interface DockingSimulation {
    targetName: string;
    pdbId: string; // The protein structure
    ligandName: string;
    bindingEnergy: number; // kcal/mol
    activeSiteResidues: number[];
}

// 2. System Perturbation
export interface NetworkNode {
    id: string;
    group: 'GENE' | 'PROTEIN' | 'METABOLITE';
    impactScore: number; // 0-1, influences radius
}
export interface NetworkLink {
    source: string;
    target: string;
    interactionType: 'ACTIVATION' | 'INHIBITION';
}

// 3. Insight Miner
export interface LiteratureInsight {
    title: string;
    source: string; // e.g. "Nature Medicine, 2024"
    summary: string;
    relevanceScore: number; // 0-100
}

// 4. Stratification
export interface PopulationData {
    population: string; // e.g. "East Asian", "European"
    alleleFrequency: number;
    predictedEfficacy: number; // 0-100%
}

export interface SandboxResult {
    targetId: string;
    hypothesis: string;
    docking: DockingSimulation;
    network: { nodes: NetworkNode[], links: NetworkLink[] };
    literature: LiteratureInsight[];
    stratification: PopulationData[];
    convergenceInsight: string;
}