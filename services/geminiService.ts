
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
 * ATTEMPT TO REPAIR MALFORMED JSON
 */
const jsonRepair = (jsonStr: string): string => {
    let repaired = jsonStr.trim();
    const openBraces = (repaired.match(/{/g) || []).length;
    const closeBraces = (repaired.match(/}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;

    if (openBraces > closeBraces) {
        repaired += "}".repeat(openBraces - closeBraces);
    }
    if (openBrackets > closeBrackets) {
        repaired += "]".repeat(openBrackets - closeBrackets);
    }
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
    return repaired;
};

/**
 * ROBUST JSON EXTRACTOR
 */
const cleanAndParseJSON = (text: string) => {
  if (!text) throw new Error("Empty AI response");
  let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
  
  const firstOpen = clean.indexOf('{');
  const firstArray = clean.indexOf('[');
  let startIndex = -1;
  let isArray = false;

  if (firstOpen !== -1 && (firstArray === -1 || firstOpen < firstArray)) {
      startIndex = firstOpen;
  } else if (firstArray !== -1) {
      startIndex = firstArray;
      isArray = true;
  }

  if (startIndex === -1) {
      try { return JSON.parse(clean); } catch(e) { throw new Error("No JSON object found"); }
  }

  let openChar = isArray ? '[' : '{';
  let closeChar = isArray ? ']' : '}';
  let balance = 0;
  let endIndex = -1;
  let inString = false;
  let escape = false;

  for (let i = startIndex; i < clean.length; i++) {
      const char = clean[i];
      if (escape) { escape = false; continue; }
      if (char === '\\') { escape = true; continue; }
      if (char === '"') { inString = !inString; continue; }
      if (!inString) {
          if (char === openChar) balance++;
          else if (char === closeChar) {
              balance--;
              if (balance === 0) { endIndex = i; break; }
          }
      }
  }

  let jsonString = (endIndex !== -1) ? clean.substring(startIndex, endIndex + 1) : clean.substring(startIndex);

  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.warn("JSON Parse failed, attempting repair...");
    try {
        const repaired = jsonRepair(jsonString);
        return JSON.parse(repaired);
    } catch (repairError) {
        console.error("JSON Repair Failed:", jsonString);
        throw new Error("Invalid JSON format");
    }
  }
};

export const analyzeGenomicData = async (
  genomicInput: string, 
  focusList: AnalysisFocus[] = ['COMPREHENSIVE'],
  ancestry: AncestryGroup = AncestryGroup.GLOBAL,
  calibrationData: string | null = null,
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

  // --- STEP 3: SYNTHESIS WITH ZYGOSITY & PENETRANCE LOGIC ---
  if(onStatusUpdate) onStatusUpdate("Aplicando Lógica de Zigosidad, Penetrancia y Mendel...");
  
  const systemInstruction = `
    ROLE: You are an expert Clinical Genomicist and Structural Biologist.
    TASK: Analyze genomic data to produce a clinical report.
    
    CRITICAL RULE 1: MENDELIAN INHERITANCE & ZYGOSITY
    - Extract zygosity from input (VCF '0/1' = Heterozygous, '1/1' = Homozygous). 
    - OVERRIDE INSTRUCTION: If input starts with '## OVERRIDE_ZYGOSITY_CONTEXT: [VALUE] ##', apply this zygosity to ALL variants.
    
    CRITICAL RULE 2: PENETRANCE LOGIC (The "Frequency Proxy")
    You must calculate a 'penetrance' level for every variant.
    
    A) MATHEMATICAL CHECK:
       If Population Frequency (gnomAD/MAF) is > 0.01 (1%) AND the condition is severe/lethal:
       -> FORCE PENETRANCE = 'LOW' (or 'MODERATE').
       -> RATIONALE: Lethal diseases cannot be common. High frequency implies low penetrance (e.g. HFE C282Y).
       
    B) INTERNAL KNOWLEDGE CHECK:
       Query your internal database for the specific Gene/Variant.
       - HFE (Hemochromatosis): Low Penetrance.
       - LRRK2 (Parkinson's): Incomplete Penetrance.
       - GBA (Gaucher/Parkinson's): Incomplete Penetrance.
       - BRCA1/2: High Penetrance (but not 100%).
       
    C) OUTPUT LOGIC:
       If Penetrance is 'LOW' or 'MODERATE', the 'riskLevel' should generally NOT be 'CRITICAL/HIGH' for a Healthy Carrier, even if ClinVar says Pathogenic. Lower the alarm level.

    LOGIC FOR CLINICAL STATUS:
    1. RECESSIVE (e.g. CFTR): Heterozygous = "CARRIER" (Healthy). Homozygous = "AFFECTED".
    2. DOMINANT (e.g. BRCA1): Heterozygous = "AFFECTED" (Risk).
    3. COMPLEX (e.g. MTHFR): Heterozygous is usually BENIGN/LOW risk.

    CALIBRATION PROTOCOL:
    ${calibrationData ? "Active. Use the provided CALIBRATION DATA to filter out technical artifacts." : "Inactive."}

    DATA: Use the 'REAL DATABASE CONTEXT' as the primary source of truth for variant classification (ClinVar) and Frequency (gnomAD).
    
    OUTPUT: Valid JSON matching the schema strictly.
  `;

  const prompt = `
  INPUT GENOMIC DATA: 
  ${genomicInput.substring(0, 1500)}... 

  REAL DB CONTEXT (Contains gnomAD Frequency): ${realContext}
  FOCUS: ${focusList.join(', ')}
  ANCESTRY: ${ancestry}
  
  INSTRUCTIONS:
  - Extract ZYGOSITY (0/1 or 1/1).
  - Determine PENETRANCE ('COMPLETE', 'HIGH', 'MODERATE', 'LOW') using the Frequency Rule (>1% = LOW) and Knowledge Base.
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
                            zygosity: { type: Type.STRING },
                            inheritanceMode: { type: Type.STRING },
                            clinicalStatus: { type: Type.STRING },
                            penetrance: { type: Type.STRING },
                            penetranceDescription: { type: Type.STRING },
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
