
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

export interface MolecularTarget {
  targetName: string; // e.g., "EGFR", "JAK2"
  mechanism: string; // e.g., "Tyrosine Kinase Inhibitor"
  druggabilityScore: number; // 0.0 - 1.0 (Systems Biology metric)
  confidence: number; // AI Confidence
  associatedPathway: string;
  status: 'NOVEL' | 'REPURPOSING' | 'KNOWN';
}

export interface CorrelationPoint {
  x: string; // Variable A (e.g., Gene Expression)
  y: string; // Variable B (e.g., Variant Impact)
  value: number; // -1.0 to 1.0 (Pearson/Spearman correlation)
  significance: number; // p-value simulation
}

export interface DiscoveryAnalysisResult {
  hypothesis: string;
  molecularTargets: MolecularTarget[];
  correlationMatrix: CorrelationPoint[];
  latentSpaceInsight: string;
}
