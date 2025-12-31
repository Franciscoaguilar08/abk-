
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, VariantRiskLevel, MetabolizerStatus, AnalysisFocus, AncestryGroup } from "../types";
import { batchFetchVariantData } from "./bioinformaticsService";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelId = "gemini-3-pro-preview";

/**
 * Utility to yield control back to the main thread.
 * This prevents the UI from freezing during heavy synchronous operations or rapid status updates.
 */
const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

// --- STEP 1: PARSE RAW TEXT TO IDENTIFY VARIANTS ---
const extractVariantsPrompt = async (input: string) => {
    const prompt = `
    Extract genomic variants from the text below. 
    Return a JSON array of objects with fields: 'rsId' (e.g. rs12345), 'gene' (e.g. BRCA1).
    If no rsID is present but HGVS is (e.g. chr1:g.123A>G), try to infer or leave rsId empty.
    
    Input:
    ${input.substring(0, 5000)}
    `;

    const response = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        rsId: { type: Type.STRING },
                        gene: { type: Type.STRING }
                    }
                }
            }
        }
    });
    
    try {
        if(!response.text) return [];
        // Yield before parsing potentially large JSON
        await yieldToMain();
        return JSON.parse(response.text) as { rsId: string, gene: string }[];
    } catch(e) {
        console.error("Extraction failed", e);
        return [];
    }
};

// --- STEP 3: FINAL SYNTHESIS WITH REAL DATA ---
export const analyzeGenomicData = async (
  genomicInput: string, 
  focusList: AnalysisFocus[] = ['COMPREHENSIVE'],
  ancestry: AncestryGroup = AncestryGroup.GLOBAL,
  onStatusUpdate?: (status: string) => void
): Promise<AnalysisResult> => {

  // 1. Extraction Phase
  if(onStatusUpdate) onStatusUpdate("Parsing input for variant identifiers...");
  await yieldToMain(); // Allow UI to render the status change
  
  const extractedVariants = await extractVariantsPrompt(genomicInput);
  
  // 2. Real Data Fetching Phase
  if(onStatusUpdate) onStatusUpdate("Querying MyVariant.info, ClinVar & gnomAD...");
  await yieldToMain();

  const rsIds = extractedVariants.map(v => v.rsId).filter(id => id && id.startsWith('rs'));
  
  // Fetch real data
  const realDataMap = new Map();
  if (rsIds.length > 0) {
      const realDataResults = await batchFetchVariantData(rsIds);
      realDataResults.forEach(d => realDataMap.set(d.rsId, d));
  }

  // 3. Construct Context for Gemini
  // Heavy string mapping operation - yield first
  await yieldToMain();
  
  const realDataContext = extractedVariants.map(v => {
      const real = realDataMap.get(v.rsId);
      if (real) {
          return `
          Variant: ${v.rsId} (Gene: ${real.geneSymbol || v.gene})
          REAL DATA SOURCE: MyVariant.info / ClinVar
          - Clinical Significance: ${real.clinVarSignificance}
          - Condition: ${real.clinVarCondition}
          - CADD Score (Pathogenicity Prediction): ${real.caddPhred || 'N/A'}
          - REVEL Score: ${real.revelScore || 'N/A'}
          - gnomAD Frequency (Global): ${real.gnomadFreq || 'N/A'}
          - Protein Change: ${real.proteinChange || 'Unknown'}
          `;
      } else {
          return `Variant: ${v.rsId || 'Unknown'} (Gene: ${v.gene}) - No external API data found.`;
      }
  }).join("\n---\n");

  if(onStatusUpdate) onStatusUpdate("Running N-Dimensional Convergence Neural Net...");
  // CRITICAL YIELD: Maintained to fix the "freeze" during heavy processing, 
  // but removed the artificial 50ms delay for the animation that was removed.
  await yieldToMain();

  // 4. Final Prompt
  const systemInstruction = `
    You are ABK Genomics AI, a scientific Clinical Decision Support engine linked to simulated EHR data.
    
    INPUT CONTEXT:
    You have REAL-TIME API DATA. Use it exactly.
    
    TASK 1: PHARMACOGENOMICS "PRE-PRESCRIPTION" (CPIC)
    - If pharmacogenes (CYP2D6, CYP2C19, SLCO1B1, etc.) are present, define the Metabolizer Status.
    - CRITICAL: List SPECIFIC drugs that should be flagged in an EHR *before* prescription (e.g., "Alert: Do not prescribe Codeine", "Alert: Reduce Warfarin dose").
    - Cite CPIC guidelines logic implicitly.

    TASK 2: N-DIMENSIONAL CONVERGENCE (The "Hidden" Biomarker)
    - Don't just list variants. Perform a "Multi-Omics" convergence.
    - Combine: [Ancestry: ${ancestry}] + [Variants Identified] + [Metabolic Status].
    - Output a "Composite Biomarker" (e.g., "Cardio-Inflammatory Susceptibility" or "Neuro-Metabolic Resistance").
    - Generate a network of nodes (Genes, Clinical Factors) and links to visualize this convergence.

    TASK 3: BIOPHYSICAL XAI & 3D
    - Explain *why* variants are pathogenic using structural biology logic.
    - Identify PDB IDs.

    Return valid JSON.
  `;

  const prompt = `
    Analyze these variants based on the fetched API data below:
    
    ${realDataContext}
    
    Original Input Snippet: ${genomicInput.substring(0, 200)}
  `;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          patientSummary: { type: Type.STRING },
          overallRiskScore: { type: Type.NUMBER },
          nDimensionalAnalysis: {
            type: Type.OBJECT,
            properties: {
                compositeBiomarker: { type: Type.STRING },
                convergenceScore: { type: Type.NUMBER },
                riskLevel: { type: Type.STRING },
                factors: { type: Type.ARRAY, items: { type: Type.STRING } },
                clinicalInsight: { type: Type.STRING },
                networkNodes: { 
                    type: Type.ARRAY, 
                    items: { type: Type.OBJECT, properties: { id: {type: Type.STRING}, label: {type: Type.STRING}, group: {type: Type.STRING} } }
                },
                networkLinks: {
                    type: Type.ARRAY,
                    items: { type: Type.OBJECT, properties: { source: {type: Type.STRING}, target: {type: Type.STRING}, value: {type: Type.NUMBER} } }
                }
            }
          },
          equityAnalysis: {
            type: Type.OBJECT,
            properties: {
                detectedAncestry: { type: Type.STRING },
                biasCorrectionApplied: { type: Type.BOOLEAN },
                adjustmentFactor: { type: Type.NUMBER },
                explanation: { type: Type.STRING }
            }
          },
          variants: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                gene: { type: Type.STRING },
                variant: { type: Type.STRING },
                description: { type: Type.STRING },
                clinVarSignificance: { type: Type.STRING },
                riskLevel: { type: Type.STRING, enum: Object.values(VariantRiskLevel) },
                condition: { type: Type.STRING },
                populationFrequency: { type: Type.STRING },
                caddScore: { type: Type.NUMBER },
                revelScore: { type: Type.NUMBER },
                xai: {
                    type: Type.OBJECT,
                    description: "Biophysical explanation",
                    properties: {
                        pathogenicityScore: { type: Type.NUMBER, description: "Normalized 0-1 score" },
                        structuralMechanism: { type: Type.STRING },
                        pdbId: { type: Type.STRING },
                        variantPosition: { type: Type.NUMBER },
                        attentionMap: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    position: { type: Type.NUMBER },
                                    residue: { type: Type.STRING },
                                    weight: { type: Type.NUMBER },
                                    impactDescription: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
              }
            }
          },
          pharmaProfiles: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                gene: { type: Type.STRING },
                phenotype: { type: Type.STRING, enum: Object.values(MetabolizerStatus) },
                description: { type: Type.STRING },
                interactions: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            drugName: { type: Type.STRING },
                            implication: { type: Type.STRING },
                            severity: { type: Type.STRING },
                            cpicGuidelineUrl: { type: Type.STRING }
                        }
                    }
                }
              }
            }
          },
          oncologyProfiles: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    gene: { type: Type.STRING },
                    predisposition: { type: Type.STRING },
                    riskScore: { type: Type.NUMBER },
                    notes: { type: Type.STRING }
                }
            }
          },
          phenotypeTraits: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    trait: { type: Type.STRING },
                    prediction: { type: Type.STRING },
                    gene: { type: Type.STRING },
                    confidence: { type: Type.STRING },
                    category: { type: Type.STRING },
                    description: { type: Type.STRING }
                }
            }
          }
        }
      }
    }
  });

  if (!response.text) {
    throw new Error("No response from Gemini");
  }

  // Final yield before parsing output
  await yieldToMain();
  const parsed = JSON.parse(response.text);
  
  // Map Parsed Data to Types (ensuring defaults)
  return {
      patientSummary: parsed.patientSummary,
      overallRiskScore: parsed.overallRiskScore || 0,
      equityAnalysis: parsed.equityAnalysis,
      nDimensionalAnalysis: parsed.nDimensionalAnalysis,
      variants: (parsed.variants || []).map((v: any) => ({
          ...v,
          riskLevel: v.riskLevel || VariantRiskLevel.UNCERTAIN,
          category: 'GENERAL'
      })),
      pharmaProfiles: parsed.pharmaProfiles || [],
      oncologyProfiles: parsed.oncologyProfiles || [],
      phenotypeTraits: parsed.phenotypeTraits || []
  } as AnalysisResult;
};
