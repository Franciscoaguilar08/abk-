
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, AnalysisFocus, AncestryGroup, SandboxResult } from "../types";
import { batchFetchVariantData } from "./bioinformaticsService";

const modelId = "gemini-3-flash-preview"; 

const getAIInstance = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY' || apiKey.includes('YOUR_KEY')) {
        throw new Error("SIMULATION_MODE_TRIGGER");
    }
    return new GoogleGenAI({ apiKey: apiKey });
};

const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

// Helper: Extract rsIDs using Regex (Faster and more reliable for DB lookup)
const extractRsIdsRegex = (text: string): string[] => {
    const regex = /rs\d+/g;
    const matches = text.match(regex);
    return matches ? [...new Set(matches)] : [];
};

/**
 * ROBUST JSON EXTRACTOR
 * Uses a stack-based approach to find the largest valid JSON object/array wrapper
 * ignoring surrounding chat text.
 */
const cleanAndParseJSON = (text: string) => {
  if (!text) throw new Error("Empty AI response");

  // 1. Basic Clean
  let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
  
  // 2. Extract First Valid JSON Block
  let firstOpen = clean.indexOf('{');
  let firstArray = clean.indexOf('[');
  let startIndex = -1;
  let isArray = false;

  if (firstOpen !== -1 && (firstArray === -1 || firstOpen < firstArray)) {
      startIndex = firstOpen;
  } else if (firstArray !== -1) {
      startIndex = firstArray;
      isArray = true;
  }

  if (startIndex === -1) {
      // Last ditch effort: try parsing the whole string in case it's clean
      try { return JSON.parse(clean); } catch(e) { throw new Error("No JSON object found in response"); }
  }

  // 3. Stack Parser to find matching closing bracket
  let openChar = isArray ? '[' : '{';
  let closeChar = isArray ? ']' : '}';
  let balance = 0;
  let endIndex = -1;
  let inString = false;
  let escape = false;

  for (let i = startIndex; i < clean.length; i++) {
      const char = clean[i];
      
      if (escape) {
          escape = false;
          continue;
      }
      if (char === '\\') {
          escape = true;
          continue;
      }
      if (char === '"') {
          inString = !inString;
          continue;
      }

      if (!inString) {
          if (char === openChar) {
              balance++;
          } else if (char === closeChar) {
              balance--;
              if (balance === 0) {
                  endIndex = i;
                  break;
              }
          }
      }
  }

  if (endIndex !== -1) {
      clean = clean.substring(startIndex, endIndex + 1);
  }

  // 4. Sanitize Common LLM JSON Errors
  // Remove comments //
  clean = clean.replace(/\/\/.*$/gm, '');
  // Remove trailing commas before closing braces
  clean = clean.replace(/,(\s*[}\]])/g, '$1');

  try {
    return JSON.parse(clean);
  } catch (e) {
    console.error("JSON Parse Failed on:", clean);
    throw new Error("Invalid JSON format");
  }
};

export const analyzeGenomicData = async (
  genomicInput: string, 
  focusList: AnalysisFocus[] = ['COMPREHENSIVE'],
  ancestry: AncestryGroup = AncestryGroup.GLOBAL,
  onStatusUpdate?: (status: string) => void
): Promise<AnalysisResult> => {

  try {
      getAIInstance();
  } catch (e) {
      throw new Error("SIMULATION_MODE_TRIGGER");
  }

  // --- STEP 1: EXTRACTION ---
  if(onStatusUpdate) onStatusUpdate("Escaneando secuencia en busca de variantes (rsID)...");
  await yieldToMain();
  
  let rsIds = extractRsIdsRegex(genomicInput);

  // --- STEP 2: REAL DATA RETRIEVAL ---
  if(onStatusUpdate) onStatusUpdate(`Consultando bases de datos biomédicas en tiempo real (${rsIds.length} variantes)...`);
  await yieldToMain();

  let realContext = "No external database records found. Relying on internal knowledge base.";
  let rawDbData: any[] = [];

  if (rsIds.length > 0) {
      try {
          rawDbData = await batchFetchVariantData(rsIds.slice(0, 50)); 
          if (rawDbData.length > 0) {
               realContext = JSON.stringify(rawDbData.map(d => ({
                   id: d.rsId,
                   gene: d.geneSymbol,
                   clinvar: d.clinVarSignificance, 
                   freq: d.gnomadFreq,
                   cadd: d.caddPhred
               })), null, 2);
          }
      } catch (e) {
          console.error("Bioinformatics fetch failed", e);
      }
  }

  // --- STEP 3: SYNTHESIS ---
  if(onStatusUpdate) onStatusUpdate("Verificando interacciones medicamentosas con Google Search...");
  
  const systemInstruction = `
    ROLE: You are an expert Clinical Genomicist.
    TASK: Analyze the provided genomic data and database context.
    DATA: Use the 'REAL DATABASE CONTEXT' as the primary source of truth for variant classification.
    OUTPUT: Valid JSON matching the schema strictly.
  `;

  const prompt = `
  INPUT GENOMIC DATA: ${genomicInput.substring(0, 500)}...
  REAL DB CONTEXT: ${realContext}
  FOCUS: ${focusList.join(', ')}
  ANCESTRY: ${ancestry}
  
  INSTRUCTIONS:
  - If ClinVar says 'Pathogenic', mark riskLevel 'HIGH'.
  - Verify drug interactions for Pharmacogenomics using Google Search if needed.
  - Return JSON.
  `;

  let retryCount = 0;
  const maxRetries = 2;

  while (retryCount < maxRetries) {
    try {
        const ai = getAIInstance();
        
        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                maxOutputTokens: 8192, 
                temperature: 0.1,
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
                            actionPlan: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, priority: { type: Type.STRING }, description: { type: Type.STRING }, specialistReferral: { type: Type.STRING } } } },
                            lifestyleModifications: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { category: {type:Type.STRING}, recommendation: {type:Type.STRING}, impactLevel: {type:Type.STRING} } } },
                            surveillancePlan: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { procedure: {type:Type.STRING}, frequency: {type:Type.STRING}, startAge: {type:Type.STRING} } } }
                        }
                      },
                      equityAnalysis: { type: Type.OBJECT, properties: { detectedAncestry: {type:Type.STRING}, biasCorrectionApplied: {type:Type.BOOLEAN}, adjustmentFactor: {type:Type.NUMBER}, explanation: {type:Type.STRING} } },
                      variants: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            gene: { type: Type.STRING },
                            variant: { type: Type.STRING },
                            description: { type: Type.STRING },
                            clinVarSignificance: { type: Type.STRING },
                            riskLevel: { type: Type.STRING },
                            condition: { type: Type.STRING },
                            populationFrequency: { type: Type.STRING },
                            caddScore: { type: Type.NUMBER },
                            revelScore: { type: Type.NUMBER },
                            xai: { type: Type.OBJECT, properties: { pathogenicityScore: {type:Type.NUMBER}, structuralMechanism: {type:Type.STRING}, molecularFunction: {type:Type.STRING}, uniprotId: {type:Type.STRING}, variantPosition: {type:Type.NUMBER} } }
                          }
                        }
                      },
                      pharmaProfiles: { 
                          type: Type.ARRAY, 
                          items: { 
                              type: Type.OBJECT, 
                              properties: { 
                                  gene: {type:Type.STRING}, 
                                  phenotype: {type:Type.STRING}, 
                                  description: {type:Type.STRING}, 
                                  interactions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { drugName: {type:Type.STRING}, implication: {type:Type.STRING}, severity: {type:Type.STRING} } } },
                                  sources: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: {type:Type.STRING}, url: {type:Type.STRING} } } } 
                              } 
                          } 
                      },
                      oncologyProfiles: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { gene: {type:Type.STRING}, variant: {type:Type.STRING}, evidenceTier: {type:Type.STRING}, mechanismOfAction: {type:Type.STRING}, cancerHallmark: {type:Type.STRING}, therapeuticImplications: {type:Type.ARRAY, items: {type:Type.STRING}}, riskScore: {type:Type.NUMBER}, citation: {type:Type.STRING}, functionalCategory: {type:Type.STRING} } } },
                      phenotypeTraits: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { trait: {type:Type.STRING}, category: {type:Type.STRING}, prediction: {type:Type.STRING}, confidence: {type:Type.STRING}, description: {type:Type.STRING}, gene: {type:Type.STRING} } } }
                    }
                  }
            }
        });

        if (!response.text) throw new Error("Empty AI Response");
        const parsed = cleanAndParseJSON(response.text);
        
        // Data Injection
        const enhancedVariants = (parsed.variants || []).map((v: any) => {
             const real = rawDbData.find(r => r.rsId === v.variant || (v.variant && v.variant.includes(r.rsId)));
             if (real) {
                 return {
                     ...v,
                     clinVarSignificance: real.clinVarSignificance || v.clinVarSignificance,
                     caddScore: real.caddPhred || v.caddScore,
                     populationFrequency: real.gnomadFreq ? `${(real.gnomadFreq * 100).toFixed(4)}%` : v.populationFrequency
                 }
             }
             return v;
        });

        return { ...parsed, variants: enhancedVariants } as AnalysisResult;

    } catch (e: any) {
        if (e.message === 'SIMULATION_MODE_TRIGGER') throw e;
        console.warn(`Retry ${retryCount + 1}`, e);
        retryCount++;
        if (retryCount === maxRetries) throw new Error("CONNECTION_FAILED");
        await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw new Error("Unexpected error");
};

export const analyzeDiscoveryData = async (
    targetInput: string,
    literatureContext?: string, 
    onStatusUpdate?: (status: string) => void
): Promise<SandboxResult> => {
    
    if (onStatusUpdate) onStatusUpdate("Initializing R&D Sandbox...");
    await yieldToMain();

    const ai = getAIInstance();
    const safeContext = literatureContext ? literatureContext.substring(0, 60000) : "";

    const systemInstruction = `
        ROLE: Expert Bio-Curator and Structural Biologist.
        TASK: Generate valid JSON for Target Discovery.
        FORMAT: JSON ONLY.
        
        REQUIRED STRUCTURE:
        {
            "targetId": "string",
            "hypothesis": "string",
            "docking": { 
                "targetName": "string", 
                "uniprotId": "string (Valid UniProt ID, e.g. P01116)", 
                "ligandName": "string", 
                "bindingEnergy": number, 
                "activeSiteResidues": [number] 
            },
            "network": { 
                "nodes": [{ "id": "string", "group": "GENE"|"PROTEIN"|"METABOLITE", "impactScore": number }], 
                "links": [{ "source": "string", "target": "string", "interactionType": "ACTIVATION"|"INHIBITION" }] 
            },
            "literature": [{ "title": "string", "source": "string", "summary": "string", "relevanceScore": number }],
            "stratification": [{ "population": "string", "alleleFrequency": number, "predictedEfficacy": number }],
            "convergenceInsight": "string",
            "detailedAnalysis": { "dockingDynamics": "string", "pathwayKinetics": "string", "evidenceSynthesis": "string", "populationStat": "string" }
        }
    `;

    const prompt = `
        TARGET: ${targetInput}
        CONTEXT: ${safeContext || "None. Infer from biological knowledge."}
        
        Generate realistic discovery data. 
        IMPORTANT: 'docking.uniprotId' MUST be a real, valid UniProt Accession (e.g. P01116 for KRAS) for AlphaFold visualization.
    `;
    
    try {
        const response = await ai.models.generateContent({
          model: modelId,
          contents: prompt,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            temperature: 0.2, 
            maxOutputTokens: 8192, 
          }
        });
        
        if (!response.text) throw new Error("Simulation failed.");
        return cleanAndParseJSON(response.text) as SandboxResult;
    } catch (e: any) {
        console.error("Gemini R&D API Error:", e);
        throw e;
    }
};
