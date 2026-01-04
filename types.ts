
export type AnalysisFocus = 'COMPREHENSIVE' | 'PHARMA' | 'ONCOLOGY' | 'RARE_DISEASE';

export enum AncestryGroup {
    GLOBAL = 'GLOBAL',
    LATIN_AMERICAN = 'LATIN_AMERICAN',
    AFRICAN = 'AFRICAN',
    EAST_ASIAN = 'EAST_ASIAN',
    SOUTH_ASIAN = 'SOUTH_ASIAN',
    EUROPEAN = 'EUROPEAN'
}

export type GenomeBuild = 'GRCh37' | 'GRCh38';

export enum VariantRiskLevel {
    PATHOGENIC = 'PATHOGENIC',
    HIGH = 'HIGH',
    MODERATE = 'MODERATE',
    UNCERTAIN = 'UNCERTAIN',
    BENIGN = 'BENIGN',
    LOW = 'LOW'
}

export enum MetabolizerStatus {
    POOR = 'POOR',
    RAPID = 'RAPID',
    ULTRA_RAPID = 'ULTRA_RAPID',
    NORMAL = 'NORMAL'
}

export interface AttentionPoint {
    residueIndex: number;
    significance: number;
    description: string;
}

export interface XAIAnalysis {
    pathogenicityScore: number;
    structuralMechanism: string;
    molecularFunction: string;
    uniprotId?: string;
    pdbId?: string;
    variantPosition?: number;
    attentionPoints?: AttentionPoint[];
}

export interface VariantAnalysis {
    gene: string;
    variant: string;
    rsId?: string;
    description: string;
    clinVarSignificance: string;
    riskLevel: VariantRiskLevel;
    condition?: string;
    populationFrequency?: string;
    equityAdjustment?: string;
    caddScore?: number;
    revelScore?: number;
    zygosity?: string;
    inheritanceMode?: string;
    clinicalStatus?: string;
    penetrance?: string;
    penetranceDescription?: string;
    xai?: XAIAnalysis;
}

export interface PharmaInteraction {
    drugName: string;
    implication: string;
    severity: 'INFO' | 'WARNING' | 'DANGER';
}

export interface PharmaSource {
    title: string;
    url: string;
}

export interface PharmaProfile {
    gene: string;
    phenotype: MetabolizerStatus;
    description: string;
    interactions: PharmaInteraction[];
    sources?: PharmaSource[];
}

export interface OncologyProfile {
    gene: string;
    variant: string;
    evidenceTier: string;
    mechanismOfAction: string;
    cancerHallmark: string;
    therapeuticImplications: string[];
    riskScore: number;
    citation: string;
    functionalCategory: string;
    predisposition?: string;
    notes?: string;
}

export interface PhenotypeTrait {
    trait: string;
    category: string;
    prediction: string;
    confidence: string;
    description: string;
    gene: string;
}

export interface ActionItem {
    title: string;
    priority: string;
    description: string;
    specialistReferral?: string;
}

export interface LifestyleMod {
    category: string;
    recommendation: string;
    impactLevel: string;
}

export interface MonitoringProtocol {
    procedure: string;
    frequency: string;
    startAge: string;
}

export interface NDimensionalAnalysis {
    clinicalSummary: string;
    overallRiskLevel: string;
    actionPlan: ActionItem[];
    lifestyleModifications: LifestyleMod[];
    surveillancePlan: MonitoringProtocol[];
}

export interface EquityAnalysis {
    detectedAncestry: string;
    biasCorrectionApplied: boolean;
    adjustmentFactor: number;
    explanation: string;
}

export interface AnalysisResult {
    patientSummary: string;
    overallRiskScore: number;
    nDimensionalAnalysis: NDimensionalAnalysis;
    equityAnalysis: EquityAnalysis;
    variants: VariantAnalysis[];
    pharmaProfiles: PharmaProfile[];
    oncologyProfiles: OncologyProfile[];
    phenotypeTraits: PhenotypeTrait[];
}

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

// Replaced PopulationData with DiseaseRisk
export interface DiseaseRisk {
    condition: string;
    associationPercentage: number; // e.g. 85 for "85% Association"
    severity: 'HIGH' | 'MODERATE' | 'LOW';
}

// NEW: Holds real data from UniProt to display in UI
export interface ProteinRealData {
    geneName: string;
    functionDescription: string;
    structuralFeatures: string[];
}

// NEW: Clinical Data for Discovery Lab
export interface LabClinicalData {
    significance: 'PATHOGENIC' | 'LIKELY_PATHOGENIC' | 'UNCERTAIN' | 'BENIGN';
    acmgCriteria: string[]; // e.g. ["PVS1", "PM2"]
    associatedCondition: string;
    clinVarId?: string;
}

export interface SandboxResult {
    targetId: string;
    hypothesis: string;
    docking: DockingSimulation;
    network: { nodes: NetworkNode[], links: NetworkLink[] };
    literature: LiteratureInsight[];
    diseaseRisks: DiseaseRisk[]; // Renamed from stratification
    convergenceInsight: string;
    
    // New: The raw biological data
    proteinMetaData?: ProteinRealData;
    
    // New: Clinical Data in the Lab
    clinical?: LabClinicalData;

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
