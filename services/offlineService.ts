
import { AnalysisResult, VariantRiskLevel, MetabolizerStatus, AncestryGroup } from '../types';

// === LOCAL KNOWLEDGE BASE (JSON DOCUMENT STORE) ===
// In a real production app, this would be IndexedDB or SQLite (WASM).
// For now, we simulate it with a structured dictionary of known clinically significant variants.

const LOCAL_VARIANT_DB: Record<string, any> = {
    // ONCOLOGY: BRCA & TP53
    "rs111033441": {
        gene: "BRCA2",
        variant: "c.5946delT",
        description: "Pathogenic frameshift mutation associated with Hereditary Breast and Ovarian Cancer syndrome.",
        clinVarSignificance: "Pathogenic",
        riskLevel: VariantRiskLevel.HIGH,
        condition: "Hereditary Breast Ovarian Cancer",
        category: 'ONCOLOGY',
        caddScore: 28.0,
        xai: {
            pathogenicityScore: 0.99,
            structuralMechanism: "Frameshift leading to premature stop codon -> Nonsense Mediated Decay or truncated protein loss of function.",
            molecularFunction: "Homologous Recombination Repair",
            uniprotId: "P51587",
            variantPosition: 1982
        }
    },
    "rs28929474": {
        gene: "TP53",
        variant: "R175H",
        description: "Hotspot mutation in the DNA-binding domain. One of the most common oncogenic drivers.",
        clinVarSignificance: "Pathogenic",
        riskLevel: VariantRiskLevel.HIGH,
        condition: "Li-Fraumeni Syndrome",
        category: 'ONCOLOGY',
        caddScore: 35.4,
        revelScore: 0.95,
        xai: {
            pathogenicityScore: 0.98,
            structuralMechanism: "Arg175His disrupts Zinc binding site, causing global unfolding of the DNA binding domain.",
            molecularFunction: "Tumor Suppression / DNA Binding",
            uniprotId: "P04637",
            variantPosition: 175
        }
    },
    "rs113488022": {
        gene: "BRAF",
        variant: "V600E",
        description: "Activates MAPK signaling pathway. Common in melanoma and papillary thyroid carcinoma.",
        clinVarSignificance: "Pathogenic",
        riskLevel: VariantRiskLevel.HIGH,
        condition: "Melanoma / Colorectal Cancer",
        category: 'ONCOLOGY',
        caddScore: 34.0,
        xai: {
            pathogenicityScore: 0.97,
            structuralMechanism: "Mimics phosphorylation of the activation segment, locking the kinase in a constitutively active conformation.",
            molecularFunction: "Kinase Signaling",
            uniprotId: "P15056",
            variantPosition: 600
        }
    },
    
    // PHARMACOGENOMICS
    "rs104894357": {
        gene: "CYP2D6",
        variant: "*4 (Splicing Defect)",
        description: "Non-functional allele. Homozygotes are Poor Metabolizers.",
        clinVarSignificance: "Drug Response",
        riskLevel: VariantRiskLevel.MODERATE,
        condition: "Adverse Drug Reaction Risk",
        category: 'PHARMA',
        isPharmaMarker: true,
        phenotype: MetabolizerStatus.POOR
    },
    "rs4244285": {
        gene: "CYP2C19",
        variant: "*2",
        description: "Loss of function allele. Affects Clopidogrel and SSRI metabolism.",
        clinVarSignificance: "Drug Response",
        riskLevel: VariantRiskLevel.MODERATE,
        condition: "Adverse Drug Reaction Risk",
        category: 'PHARMA',
        isPharmaMarker: true,
        phenotype: MetabolizerStatus.POOR
    },
    "rs762551": {
        gene: "CYP1A2",
        variant: "*1F",
        description: "Inducibility variant. Fast metabolizers of caffeine.",
        clinVarSignificance: "Benign",
        riskLevel: VariantRiskLevel.LOW,
        condition: "Caffeine Metabolism",
        category: 'TRAIT',
        isTrait: true,
        traitData: {
            trait: "Caffeine Metabolism",
            category: "NUTRITION",
            prediction: "Rapid Metabolizer",
            confidence: "HIGH",
            description: "Likely to process caffeine quickly. Lower risk of jitters."
        }
    }
};

// === ENGINE ===

export const performOfflineAnalysis = (inputData: string): AnalysisResult => {
    // 1. Scan input for rsIDs
    const regex = /rs\d+/g;
    const foundIds = [...new Set(inputData.match(regex) || [])];
    
    // 2. Query Local DB
    const variants: any[] = [];
    const pharmaProfiles: any[] = [];
    const oncologyProfiles: any[] = [];
    const phenotypeTraits: any[] = [];
    
    let riskAccumulator = 0;

    foundIds.forEach(id => {
        const record = LOCAL_VARIANT_DB[id];
        if (record) {
            // Add to Variants List
            variants.push({
                ...record,
                rsId: id
            });

            // Route to Sub-profiles
            if (record.isPharmaMarker) {
                pharmaProfiles.push({
                    gene: record.gene,
                    phenotype: record.phenotype,
                    description: record.description,
                    interactions: getPharmaInteractions(record.gene, record.phenotype)
                });
            } else if (record.category === 'ONCOLOGY') {
                oncologyProfiles.push({
                    gene: record.gene,
                    variant: record.variant,
                    evidenceTier: record.riskLevel === 'PATHOGENIC' ? 'TIER_1_STRONG' : 'TIER_2_POTENTIAL',
                    mechanismOfAction: record.xai?.structuralMechanism || "Unknown mechanism",
                    cancerHallmark: "Genomic Instability",
                    therapeuticImplications: getOncoTherapies(record.gene),
                    riskScore: record.xai?.pathogenicityScore ? record.xai.pathogenicityScore * 100 : 50,
                    citation: "Internal Knowledge Base (Offline)",
                    functionalCategory: "CELL_CYCLE"
                });
                riskAccumulator += 30;
            } else if (record.isTrait) {
                phenotypeTraits.push({
                    ...record.traitData,
                    gene: record.gene
                });
            }
        }
    });

    // 3. Generate Summary based on findings
    const patientSummary = generateDynamicSummary(variants, pharmaProfiles);
    const overallRisk = Math.min(99, Math.max(10, riskAccumulator + (variants.length * 5)));
    const overallLevel = overallRisk > 80 ? "CRITICAL" : overallRisk > 50 ? "HIGH" : "LOW";

    return {
        patientSummary,
        overallRiskScore: overallRisk,
        variants,
        pharmaProfiles,
        oncologyProfiles,
        phenotypeTraits,
        nDimensionalAnalysis: {
            clinicalSummary: `Offline analysis detected ${variants.length} known significant variants in the local database.`,
            overallRiskLevel: overallLevel as any,
            actionPlan: variants.length > 0 
                ? [{ title: "Verify with Clinical Lab", priority: "HIGH", description: "Offline findings are preliminary projections based on local library." }] 
                : [{ title: "No Action Required", priority: "ROUTINE", description: "No variants from the local critical list were found in the input." }],
            lifestyleModifications: [],
            surveillancePlan: []
        },
        equityAnalysis: {
            detectedAncestry: "UNKNOWN (OFFLINE)",
            biasCorrectionApplied: false,
            adjustmentFactor: 1.0,
            explanation: "Ancestry inference requires online cloud computing."
        }
    };
};

// === HELPERS ===

function getPharmaInteractions(gene: string, status: string) {
    if (gene === "CYP2D6" && status === "POOR") {
        return [
            { drugName: "Codeine", implication: "Lack of efficacy (prodrug failure).", severity: "WARNING" },
            { drugName: "Tramadol", implication: "Reduced pain relief.", severity: "WARNING" }
        ];
    }
    if (gene === "CYP2C19" && status === "POOR") {
        return [
            { drugName: "Clopidogrel", implication: "Increased risk of cardiovascular events.", severity: "DANGER" }
        ];
    }
    return [];
}

function getOncoTherapies(gene: string) {
    if (gene === "BRCA2") return ["PARP Inhibitors (Olaparib)", "Platinum Chemotherapy"];
    if (gene === "TP53") return ["Clinical Trials (APR-246)"];
    if (gene === "BRAF") return ["Vemurafenib", "Dabrafenib"];
    return ["Standard of Care"];
}

function generateDynamicSummary(variants: any[], pharma: any[]) {
    if (variants.length === 0) {
        return "[OFFLINE MODE] No critical variants from the internal database were found in your provided file. This does not rule out all risks, but your specific input did not trigger any flags in our offline library.";
    }

    const genes = variants.map(v => v.gene).join(", ");
    return `[OFFLINE MODE] Analysis detected ${variants.length} significant matches in the local database. Primary drivers identified: ${genes}. ${pharma.length > 0 ? 'Pharmacogenomic alerts are present.' : ''} Please consult a specialist to validate these offline projections.`;
}
