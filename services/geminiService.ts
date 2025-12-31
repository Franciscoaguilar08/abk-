
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, VariantRiskLevel, MetabolizerStatus, AnalysisFocus, AncestryGroup, DiscoveryAnalysisResult } from "../types";
import { batchFetchVariantData } from "./bioinformaticsService";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelId = "gemini-3-pro-preview";

/**
 * Utility to yield control back to the main thread.
 * This prevents the UI from freezing during heavy synchronous operations or rapid status updates.
 */
const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Helper to safely parse JSON from AI response.
 * Handles markdown code blocks and logs errors.
 */
const cleanAndParseJSON = (text: string) => {
  try {
    // Remove markdown code blocks if present (e.g. ```json ... ```)
    let cleaned = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error. Raw Text length:", text.length);
    // console.debug("Raw Text:", text); // Uncomment for deep debugging
    throw new Error("Failed to parse AI response. The analysis may have been interrupted or is too large. Please try a smaller dataset.");
  }
};

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
  await yieldToMain();

  const systemInstruction = `
    You are ABK Genomics AI (Clinical Module).
    Use the provided Real-Time API Data.
    Tasks: Pharmacogenomics (CPIC), N-Dimensional Convergence (Multi-omics implication), and Biophysical XAI.
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
      maxOutputTokens: 8192, // Ensure enough budget for large JSON
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

// --- MODULE B: R&D DISCOVERY ANALYSIS ---
export const analyzeDiscoveryData = async (
    genomics: string,
    proteomics: string,
    imagingMeta: string,
    onStatusUpdate?: (status: string) => void
): Promise<DiscoveryAnalysisResult> => {
    
    if(onStatusUpdate) onStatusUpdate("Ingesting Multi-Omic Data Streams...");
    await yieldToMain();

    const systemInstruction = `
      You are ABK Genomics R&D (Discovery Module).
      Your goal is MOLECULAR TARGET DISCOVERY for Pharmaceutical Development.
      
      INPUT:
      1. Genomics (VCF/Sequence)
      2. Proteomics (Expression Levels)
      3. Imaging Metadata (Cell morphology/Radiomics)

      METHODOLOGY:
      - Use "Latent Pattern Recognition" to find non-linear correlations between Gene Variants and Protein Expression.
      - Identify "Druggable Targets" (Proteins/Genes) that are driving the disease state described or implied.
      - Use Systems Biology principles (Pathway Analysis, PPI Networks).

      OUTPUT:
      - List of Molecular Targets with Druggability Score (0-1).
      - Correlation Matrix (Heatmap data) showing relationships between specific Genes and Phenotypes.
      - A hypothesis summary.
    `;

    const prompt = `
      Analyze the following Multi-Omics Dataset:
      
      [GENOMICS DATA]:
      ${genomics.substring(0, 3000)}

      [PROTEOMICS DATA]:
      ${proteomics.substring(0, 3000)}

      [IMAGING METADATA]:
      ${imagingMeta.substring(0, 1000)}
    `;

    if(onStatusUpdate) onStatusUpdate("Calculating Latent Space Correlations...");
    await yieldToMain();

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
                    hypothesis: { type: Type.STRING },
                    molecularTargets: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                targetName: { type: Type.STRING },
                                mechanism: { type: Type.STRING },
                                druggabilityScore: { type: Type.NUMBER },
                                confidence: { type: Type.NUMBER },
                                associatedPathway: { type: Type.STRING },
                                status: { type: Type.STRING, enum: ['NOVEL', 'REPURPOSING', 'KNOWN'] }
                            }
                        }
                    },
                    correlationMatrix: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                x: { type: Type.STRING },
                                y: { type: Type.STRING },
                                value: { type: Type.NUMBER },
                                significance: { type: Type.NUMBER }
                            }
                        }
                    },
                    latentSpaceInsight: { type: Type.STRING }
                }
            }
        }
    });

    if (!response.text) throw new Error("No response from Gemini R&D Module");

    await yieldToMain();
    return cleanAndParseJSON(response.text) as DiscoveryAnalysisResult;
};
