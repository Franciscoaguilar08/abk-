import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, VariantRiskLevel, MetabolizerStatus, AnalysisFocus, AncestryGroup, SandboxResult } from "../types";
import { batchFetchVariantData } from "./bioinformaticsService";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelId = "gemini-3-pro-preview";
const flashModelId = "gemini-3-flash-preview";

/**
 * Utility to yield control back to the main thread.
 * This prevents the UI from freezing during heavy synchronous operations or rapid status updates.
 */
const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Helper to safely parse JSON from AI response.
 * Handles markdown code blocks, finding JSON objects within text, and attempts to repair common JSON errors.
 */
const cleanAndParseJSON = (text: string) => {
  // 1. Remove Markdown code blocks
  let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  // 2. Find the outermost JSON object or array
  const firstBrace = clean.indexOf('{');
  const firstBracket = clean.indexOf('[');
  
  let start = -1;
  let end = -1;

  // Determine if we are looking for an object or array based on which comes first
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
        // Repair Strategy: Fix trailing commas (common LLM error)
        // Regex matches a comma followed by whitespace and a closing brace/bracket
        let repaired = clean.replace(/,\s*([\]}])/g, '$1');

        // Attempt parse again
        return JSON.parse(repaired);

    } catch (repairErr) {
        console.error("JSON Parse Error. Raw Text length:", text.length);
        console.debug("Failed Text Preview:", text.substring(0, 200) + "...");
        // Throwing the original error message to maintain compatibility with UI error handling
        throw new Error("Failed to parse AI response. The analysis may have been interrupted or is too large. Please try a smaller dataset.");
    }
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
          - CADD Score (Pathogenicity Prediction): ${real.caddPhred || 'N/A'}
          - REVEL Score: ${real.revelScore || 'N/A'}
          - gnomAD Frequency (Global): ${real.gnomadFreq || 'N/A'}
          - Protein Change: ${real.proteinChange || 'Unknown'}
          `;
      } else {
          return `Variant: ${v.rsId || 'Unknown'} (Gene: ${v.gene}) - No external API data found.`;
      }
  }).join("\n---\n");

  if(onStatusUpdate) onStatusUpdate("Running AlphaMissense Logic & Digital Twin Engine...");
  await yieldToMain();

  const systemInstruction = `
    You are ABK Genomics Digital Twin Engine, utilizing an AlphaMissense-inspired auditing logic.
    
    Apply the following COMPULSORY OPTIMIZATION PROTOCOL to the analysis:

    1. RIGOR IN CLASSIFICATION:
       - Do not allow ambiguous answers.
       - Contrast every missense variant against the scale: Benign vs Pathogenic.
       - For amino acid changes, you MUST provide a predicted pathogenicity score (0.0 to 1.0) simulating AlphaMissense/DeepMind logic.

    2. BIOPHYSICAL DIAGNOSIS (THE 'WHY'):
       - Do not just provide a score. Explain the structural reason.
       - Is there a loss of thermal stability?
       - Disruption of an evolutionary conserved residue?
       - Steric clash in the side chain?
       - Verify if the change occurs in a functional domain (cross-reference UniProt logic).

    3. MATCHING VERIFICATION:
       - Explicitly state: "AlphaMissense Prediction Match" if the variant aligns with predicted pathogenicity patterns.

    4. ERROR FILTER:
       - If a variant is STOP-GAIN or FRAMESHIFT, explicitly state that AlphaMissense is NOT the correct tool for this type, but provide standard clinical interpretation.

    5. OUTPUT FORMAT:
       - Return ONLY valid JSON.
       - Structure 'xai' fields to reflect this "Scientific Evidence".
  `;

  const prompt = `
    Analyze these variants based on the fetched API data below and the AlphaMissense protocol:
    ${realDataContext}
    Original Input Snippet: ${genomicInput.substring(0, 200)}
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
                        pathogenicityScore: { type: Type.NUMBER, description: "Normalized 0-1 score (AlphaMissense logic)" },
                        structuralMechanism: { type: Type.STRING, description: "The Biophysical 'Why'" },
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

// --- MODULE B: R&D DISCOVERY ANALYSIS (INNOVATION SANDBOX) ---
export const analyzeDiscoveryData = async (
    targetInput: string,
    onStatusUpdate?: (status: string) => void
): Promise<SandboxResult> => {
    
    if(onStatusUpdate) onStatusUpdate(`Initializing Innovation Sandbox for target: ${targetInput}...`);
    await yieldToMain();

    const systemInstruction = `
      Act as a Drug Discovery AI (Digital Twin Module).
      Input: A target (e.g. KRAS).
      Output: Valid JSON with:
      1. docking (pdbId, bindingEnergy, activeSiteResidues)
      2. network (nodes: gene/protein/metabolite, links)
      3. literature (3 recent citations)
      4. stratification (population allele freq)
      5. convergenceInsight (summary)
      
      Constraints:
      - Keep all IDs concise (max 20 chars).
      - Do NOT generate repetitive strings (e.g. "Var0000000...").
      - Use real PDB IDs where possible (e.g. 6OIM).
      - Return valid JSON only.
    `;

    const prompt = `Generate JSON for Target: ${targetInput}. Ensure IDs are short and valid.`;

    if(onStatusUpdate) onStatusUpdate("Simulating Molecular Docking & Network Perturbation...");
    await yieldToMain();

    const response = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            maxOutputTokens: 2048, // Prevent runaway loops
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
                            nodes: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        id: { type: Type.STRING },
                                        group: { type: Type.STRING, enum: ['GENE', 'PROTEIN', 'METABOLITE'] },
                                        impactScore: { type: Type.NUMBER }
                                    }
                                }
                            },
                            links: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        source: { type: Type.STRING },
                                        target: { type: Type.STRING },
                                        interactionType: { type: Type.STRING, enum: ['ACTIVATION', 'INHIBITION'] }
                                    }
                                }
                            }
                        }
                    },
                    literature: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                source: { type: Type.STRING },
                                summary: { type: Type.STRING },
                                relevanceScore: { type: Type.NUMBER }
                            }
                        }
                    },
                    stratification: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                population: { type: Type.STRING },
                                alleleFrequency: { type: Type.NUMBER },
                                predictedEfficacy: { type: Type.NUMBER }
                            }
                        }
                    },
                    convergenceInsight: { type: Type.STRING }
                }
            }
        }
    });

    if (!response.text) throw new Error("No response from Gemini R&D Module");

    await yieldToMain();
    return cleanAndParseJSON(response.text) as SandboxResult;
};