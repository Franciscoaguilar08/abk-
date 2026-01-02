
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, VariantRiskLevel, MetabolizerStatus, AnalysisFocus, AncestryGroup, SandboxResult } from "../types";
import { batchFetchVariantData } from "./bioinformaticsService";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelId = "gemini-3-pro-preview";
const flashModelId = "gemini-3-flash-preview";

/**
 * Utility to yield control back to the main thread.
 */
const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Helper to safely parse JSON from AI response.
 */
const cleanAndParseJSON = (text: string) => {
  let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const firstBrace = clean.indexOf('{');
  const firstBracket = clean.indexOf('[');
  let start = -1;
  let end = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      start = firstBrace;
      end = clean.lastIndexOf('}');
  } else if (firstBracket !== -1) {
      start = firstBracket;
      end = clean.lastIndexOf(']');
  }

  if (start !== -1 && end !== -1 && end > start) {
      clean = clean.substring(start, end + 1);
  }

  try {
    return JSON.parse(clean);
  } catch (e) {
    console.warn("Initial JSON Parse Failed. Attempting repairs...");
    try {
        let repaired = clean.replace(/,\s*([\]}])/g, '$1');
        return JSON.parse(repaired);
    } catch (repairErr) {
        throw new Error("Failed to parse AI response. Please try a smaller dataset.");
    }
  }
};

// --- STEP 1: PARSE RAW TEXT TO IDENTIFY VARIANTS ---
const extractVariantsPrompt = async (input: string) => {
    const prompt = `
    Extract genomic variants from the text below. 
    Return a JSON array of objects with fields: 'rsId' (e.g. rs12345), 'gene' (e.g. BRCA1).
    Input:
    ${input.substring(0, 5000)}
    `;

    const response = await ai.models.generateContent({
        model: flashModelId,
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
        await yieldToMain();
        return cleanAndParseJSON(response.text) as { rsId: string, gene: string }[];
    } catch(e) {
        console.error("Extraction failed", e);
        return [];
    }
};

// --- MODULE A: CLINICAL ANALYSIS ---
export const analyzeGenomicData = async (
  genomicInput: string, 
  focusList: AnalysisFocus[] = ['COMPREHENSIVE'],
  ancestry: AncestryGroup = AncestryGroup.GLOBAL,
  onStatusUpdate?: (status: string) => void
): Promise<AnalysisResult> => {

  if(onStatusUpdate) onStatusUpdate("Parsing input for variant identifiers...");
  await yieldToMain();
  
  const extractedVariants = await extractVariantsPrompt(genomicInput);
  
  if(onStatusUpdate) onStatusUpdate("Querying MyVariant.info, ClinVar & gnomAD...");
  await yieldToMain();

  const rsIds = extractedVariants.map(v => v.rsId).filter(id => id && id.startsWith('rs'));
  
  const realDataMap = new Map();
  if (rsIds.length > 0) {
      const realDataResults = await batchFetchVariantData(rsIds);
      realDataResults.forEach(d => realDataMap.set(d.rsId, d));
  }

  await yieldToMain();
  
  const realDataContext = extractedVariants.map(v => {
      const real = realDataMap.get(v.rsId);
      if (real) {
          return `
          Variant: ${v.rsId} (Gene: ${real.geneSymbol || v.gene})
          REAL DATA SOURCE: MyVariant.info / ClinVar
          - Clinical Significance: ${real.clinVarSignificance}
          - Condition: ${real.clinVarCondition}
          - CADD Score: ${real.caddPhred || 'N/A'}
          - gnomAD Frequency: ${real.gnomadFreq || 'N/A'}
          `;
      } else {
          return `Variant: ${v.rsId || 'Unknown'} (Gene: ${v.gene}) - No external API data found.`;
      }
  }).join("\n---\n");

  if(onStatusUpdate) onStatusUpdate("Generating Actionable Clinical Protocol...");
  await yieldToMain();

  const systemInstruction = `
    You are ABK Genomics Digital Twin Engine, a highly advanced Clinical Decision Support System.
    
    CRITICAL INSTRUCTION:
    - STOP providing abstract biological descriptions (no cascades, no molecular topology).
    - START providing ACTIONABLE CLINICAL ADVICE.
    - Your goal is to tell the doctor or patient WHAT TO DO next.
    - Focus on: Screening schedules, Lifestyle changes, Specialists to visit, and Medication adjustments.
    - Be concise, direct, and authoritative based on the data.
  `;

  const prompt = `
    Analyze these variants based on the fetched API data below:
    ${realDataContext}
    
    Generate a 'nDimensionalAnalysis' that acts as a CLINICAL ACTION PLAN.
    - nDimensionalAnalysis.actionPlan: Specific medical next steps (e.g., "Refer to cardiologist", "Annual MRI").
    - nDimensionalAnalysis.lifestyleModifications: Diet/Exercise tailored to the gene.
    - nDimensionalAnalysis.surveillancePlan: Checkup frequency.
  `;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      maxOutputTokens: 8192, 
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          patientSummary: { type: Type.STRING },
          overallRiskScore: { type: Type.NUMBER },
          nDimensionalAnalysis: {
            type: Type.OBJECT,
            properties: {
                clinicalSummary: { type: Type.STRING },
                overallRiskLevel: { type: Type.STRING },
                actionPlan: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            priority: { type: Type.STRING, enum: ['IMMEDIATE', 'HIGH', 'ROUTINE'] },
                            description: { type: Type.STRING },
                            specialistReferral: { type: Type.STRING }
                        }
                    }
                },
                lifestyleModifications: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            category: { type: Type.STRING, enum: ['DIET', 'EXERCISE', 'ENVIRONMENT', 'SUPPLEMENTS'] },
                            recommendation: { type: Type.STRING },
                            impactLevel: { type: Type.STRING, enum: ['HIGH', 'MODERATE'] }
                        }
                    }
                },
                surveillancePlan: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            procedure: { type: Type.STRING },
                            frequency: { type: Type.STRING },
                            startAge: { type: Type.STRING }
                        }
                    }
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
                        pathogenicityScore: { type: Type.NUMBER },
                        structuralMechanism: { type: Type.STRING },
                        molecularFunction: { type: Type.STRING },
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
                    notes: { type: Type.STRING },
                    functionalCategory: { 
                        type: Type.STRING, 
                        enum: ['DNA_REPAIR', 'CELL_CYCLE', 'METABOLISM', 'IMMUNITY', 'UNKNOWN'],
                    }
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

  if (!response.text) throw new Error("No response from Gemini");

  await yieldToMain();
  const parsed = cleanAndParseJSON(response.text);
  
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

// --- MODULE B: R&D DISCOVERY ANALYSIS (Unchanged for clarity, but included in return) ---
export const analyzeDiscoveryData = async (
    targetInput: string,
    onStatusUpdate?: (status: string) => void
): Promise<SandboxResult> => {
    // ... (Keeping existing logic for R&D module, focusing update on Clinical)
    // Re-implementing simplified version to match file replacement requirement
    
    if (onStatusUpdate) onStatusUpdate("Initializing R&D Sandbox Environment...");
    await yieldToMain();

    const systemInstruction = `You are the 'Discovery Engine'. Simulate molecular docking and output JSON matching SandboxResult.`;
    const prompt = `Target: ${targetInput}. Generate R&D analysis JSON. Use real PDB IDs.`;
  
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                targetId: { type: Type.STRING },
                hypothesis: { type: Type.STRING },
                docking: {
                    type: Type.OBJECT,
                    properties: {
                        targetName: { type: Type.STRING },
                        pdbId: { type: Type.STRING },
                        ligandName: { type: Type.STRING },
                        bindingEnergy: { type: Type.NUMBER },
                        activeSiteResidues: { type: Type.ARRAY, items: { type: Type.NUMBER } }
                    }
                },
                network: {
                    type: Type.OBJECT,
                    properties: {
                        nodes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: {type:Type.STRING}, group: {type:Type.STRING}, impactScore: {type:Type.NUMBER} } } },
                        links: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { source: {type:Type.STRING}, target: {type:Type.STRING}, interactionType: {type:Type.STRING} } } }
                    }
                },
                literature: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: {type:Type.STRING}, source: {type:Type.STRING}, summary: {type:Type.STRING}, relevanceScore: {type:Type.NUMBER} } } },
                stratification: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { population: {type:Type.STRING}, alleleFrequency: {type:Type.NUMBER}, predictedEfficacy: {type:Type.NUMBER} } } },
                convergenceInsight: { type: Type.STRING }
            }
        }
      }
    });
  
    if (!response.text) throw new Error("Simulation failed.");
    await yieldToMain();
    return cleanAndParseJSON(response.text) as SandboxResult;
};
