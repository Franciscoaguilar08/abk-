import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, VariantRiskLevel, MetabolizerStatus, AnalysisFocus, AncestryGroup } from "../types";
import { batchFetchVariantData } from "./bioinformaticsService";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelId = "gemini-3-pro-preview";

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
  const extractedVariants = await extractVariantsPrompt(genomicInput);
  
  // 2. Real Data Fetching Phase
  if(onStatusUpdate) onStatusUpdate("Querying MyVariant.info, ClinVar & gnomAD...");
  const rsIds = extractedVariants.map(v => v.rsId).filter(id => id && id.startsWith('rs'));
  
  // Fetch real data
  const realDataMap = new Map();
  if (rsIds.length > 0) {
      const realDataResults = await batchFetchVariantData(rsIds);
      realDataResults.forEach(d => realDataMap.set(d.rsId, d));
  }

  // 3. Construct Context for Gemini
  // We feed the REAL data back into the prompt so Gemini doesn't hallucinate scores.
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

  if(onStatusUpdate) onStatusUpdate("Synthesizing Biophysical XAI & 3D Structure...");

  // 4. Final Prompt
  const systemInstruction = `
    You are ABK Genomics AI, a scientific Clinical Decision Support engine.
    
    INPUT CONTEXT:
    You have been provided with REAL-TIME API DATA from MyVariant.info and ClinVar.
    You MUST use the provided CADD scores, ClinVar status, and Frequency data exactly as given. DO NOT HALLUCINATE SCORES.
    
    TASK 1: BIOPHYSICAL EXPLANATION (XAI)
    - Explain *why* the variant is pathogenic based on the provided CADD/REVEL scores.
    - If a Protein Change is provided (e.g. p.Val600Glu), analyze the structural impact (e.g. "Hydrophobic Valine replaced by charged Glutamate").
    
    TASK 2: 3D STRUCTURE MAPPING
    - For the genes identified, identify the BEST Representative PDB ID (Protein Data Bank) for visualization.
    - Example: TP53 -> '4IBQ', BRAF -> '4MNE'.
    - Extract the integer residue position from the protein change (e.g. Val600Glu -> 600) for the 'variantPosition' field.

    TASK 3: ANCESTRY & PHARMA
    - Apply pharmacogenomic guidelines (CPIC) if relevant genes (CYP2D6, etc.) are present.
    - Ancestry: ${ancestry} context active.

    Return valid JSON matching the schema.
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
                            severity: { type: Type.STRING }
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

  const parsed = JSON.parse(response.text);
  
  // Map Parsed Data to Types (ensuring defaults)
  return {
      patientSummary: parsed.patientSummary,
      overallRiskScore: parsed.overallRiskScore || 0,
      equityAnalysis: parsed.equityAnalysis,
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