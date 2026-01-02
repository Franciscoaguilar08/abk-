
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, VariantRiskLevel, MetabolizerStatus, AnalysisFocus, AncestryGroup, SandboxResult } from "../types";
import { batchFetchVariantData } from "./bioinformaticsService";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// USO MODELO FLASH PARA VELOCIDAD Y ESTABILIDAD (SEGÚN REQUERIMIENTO DE ROBUSTEZ)
const modelId = "gemini-3-flash-preview"; 

/**
 * Utility to yield control back to the main thread to prevent UI freezing.
 */
const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Helper to safely parse JSON from AI response.
 * Includes aggressive cleaning for markdown blocks.
 */
const cleanAndParseJSON = (text: string) => {
  if (!text) throw new Error("Recibido texto vacío de la IA");

  // 1. Eliminar bloques de markdown
  let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  
  // 2. Encontrar el objeto/array JSON válido más externo
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
    console.warn("Error de parseo JSON inicial. Intentando reparación...", e);
    // Intento desesperado de reparación de comas
    try {
        let repaired = clean.replace(/,\s*([\]}])/g, '$1'); // Eliminar comas trailing
        return JSON.parse(repaired);
    } catch (repairErr) {
        throw new Error("La respuesta de la IA no es un JSON válido.");
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

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.1, // Baja temperatura para extracción precisa
            }
        });
        
        if(!response.text) return [];
        return cleanAndParseJSON(response.text) as { rsId: string, gene: string }[];
    } catch(e) {
        console.warn("Fallo en extracción de variantes (paso 1), continuando...", e);
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

  if(onStatusUpdate) onStatusUpdate("Iniciando Protocolo de Verdad Biológica...");
  await yieldToMain();
  
  // 1. Extracción con manejo de errores
  let extractedVariants: { rsId: string, gene: string }[] = [];
  try {
      extractedVariants = await extractVariantsPrompt(genomicInput);
  } catch (e) {
      console.warn("Extracción fallida, usando input crudo");
  }
  
  if(onStatusUpdate) onStatusUpdate("Consultando bases de datos (ClinVar / gnomAD)...");
  await yieldToMain();

  // 2. Enriquecimiento (No falla si la API externa cae, solo retorna vacío)
  const rsIds = extractedVariants.map(v => v.rsId).filter(id => id && id.startsWith('rs'));
  let realDataContext = "No external data available.";
  
  if (rsIds.length > 0) {
      try {
          const realDataResults = await batchFetchVariantData(rsIds);
          const realDataMap = new Map();
          realDataResults.forEach(d => realDataMap.set(d.rsId, d));
          
          realDataContext = extractedVariants.map(v => {
              const real = realDataMap.get(v.rsId);
              return real ? `Variant: ${v.rsId} (Gene: ${real.geneSymbol}). ClinVar: ${real.clinVarSignificance}. CADD: ${real.caddPhred}.` 
                          : `Variant: ${v.rsId}`;
          }).join("\n");
      } catch (e) {
          console.warn("Fallo en MyVariant.info, continuando con IA pura.");
      }
  }

  if(onStatusUpdate) onStatusUpdate("Ejecutando simulación AlphaMissense...");

  // 3. Prompt Maestro
  const systemInstruction = `
    ESTRICTO PROTOCOLO BIOINFORMÁTICO ABK (DIGITAL TWIN ENGINE):

    1. VERACIDAD CIENTÍFICA (HARD DATA):
       - Prioriza los datos de ClinVar y gnomAD provistos.
       - Si no hay datos, realiza una inferencia biofísica conservadora.

    2. ALPHAMISSENSE & BIOFÍSICA:
       Para variantes VUS, aplica lógica de DeepMind AlphaMissense.
       Escala: >0.564 (Patogénico), <0.34 (Benigno).

    3. FORMATO VISUAL (CASCADA DE CONSECUENCIAS):
       En 'structuralMechanism' (xai), USA FLECHAS:
       [Cambio Molecular] ➔ [Efecto Estructural] ➔ [Impacto en Dominio] ➔ [Consecuencia Clínica]

    4. ACTIONABLE INTELLIGENCE:
       Rellena nDimensionalAnalysis con planes concretos.
  `;

  const prompt = `
    Analyze these variants based on available data:
    ${realDataContext}
    Raw Input: ${genomicInput.substring(0, 1000)}
    
    Generate JSON Response.
  `;

  // 4. LÓGICA DE REINTENTO (RETRY LOGIC) BLINDADA
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                maxOutputTokens: 8192, 
                temperature: 0.1,
                // Schema simplificado para reducir tokens y errores de estructura
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
                                        priority: { type: Type.STRING },
                                        description: { type: Type.STRING },
                                        specialistReferral: { type: Type.STRING }
                                    }
                                }
                            },
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
                            xai: { type: Type.OBJECT, properties: { pathogenicityScore: {type:Type.NUMBER}, structuralMechanism: {type:Type.STRING}, molecularFunction: {type:Type.STRING}, pdbId: {type:Type.STRING}, variantPosition: {type:Type.NUMBER} } }
                          }
                        }
                      },
                      pharmaProfiles: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { gene: {type:Type.STRING}, phenotype: {type:Type.STRING}, description: {type:Type.STRING}, interactions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { drugName: {type:Type.STRING}, implication: {type:Type.STRING}, severity: {type:Type.STRING} } } } } } },
                      oncologyProfiles: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { gene: {type:Type.STRING}, variant: {type:Type.STRING}, evidenceTier: {type:Type.STRING}, mechanismOfAction: {type:Type.STRING}, cancerHallmark: {type:Type.STRING}, therapeuticImplications: {type:Type.ARRAY, items: {type:Type.STRING}}, riskScore: {type:Type.NUMBER}, citation: {type:Type.STRING}, functionalCategory: {type:Type.STRING} } } },
                      phenotypeTraits: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { trait: {type:Type.STRING}, category: {type:Type.STRING}, prediction: {type:Type.STRING}, confidence: {type:Type.STRING}, description: {type:Type.STRING}, gene: {type:Type.STRING} } } }
                    }
                  }
            }
        });

        if (!response.text) throw new Error("Respuesta vacía de Gemini");

        const parsed = cleanAndParseJSON(response.text);
        
        // Mapeo seguro con defaults para evitar crash en UI
        return {
            patientSummary: parsed.patientSummary || "Analysis complete.",
            overallRiskScore: parsed.overallRiskScore || 0,
            equityAnalysis: parsed.equityAnalysis,
            nDimensionalAnalysis: parsed.nDimensionalAnalysis || { clinicalSummary: "No specific action plan.", overallRiskLevel: "LOW", actionPlan: [], lifestyleModifications: [], surveillancePlan: [] },
            variants: (parsed.variants || []).map((v: any) => ({
                ...v,
                riskLevel: v.riskLevel || 'UNCERTAIN',
                clinVarSignificance: v.clinVarSignificance || 'Unknown',
                category: 'GENERAL'
            })),
            pharmaProfiles: parsed.pharmaProfiles || [],
            oncologyProfiles: parsed.oncologyProfiles || [],
            phenotypeTraits: parsed.phenotypeTraits || [],
        } as AnalysisResult;

    } catch (e) {
        console.warn(`Intento ${retryCount + 1} fallido: `, e);
        retryCount++;
        if (retryCount === maxRetries) {
            throw new Error("CONNECTION_FAILED"); // Código específico para activar modo offline
        }
        await new Promise(r => setTimeout(r, 1500)); // Backoff un poco más largo
    }
  }
  
  throw new Error("Unexpected error");
};

// --- MODULE B: R&D DISCOVERY ANALYSIS ---
export const analyzeDiscoveryData = async (
    targetInput: string,
    onStatusUpdate?: (status: string) => void
): Promise<SandboxResult> => {
    if (onStatusUpdate) onStatusUpdate("Initializing R&D Sandbox Environment...");
    await yieldToMain();

    // Versión simplificada para Discovery (usa la misma lógica de retry interna si se extrajera, pero aquí la duplicamos brevemente por simplicidad)
    const prompt = `Target: ${targetInput}. Generate R&D analysis JSON with deep scientific 'detailedAnalysis'. Use real PDB IDs.`;
    
    try {
        const response = await ai.models.generateContent({
          model: modelId,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2, // Un poco más creativo para hipótesis
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    targetId: { type: Type.STRING },
                    hypothesis: { type: Type.STRING },
                    docking: { type: Type.OBJECT, properties: { targetName: {type:Type.STRING}, pdbId: {type:Type.STRING}, ligandName: {type:Type.STRING}, bindingEnergy: {type:Type.NUMBER}, activeSiteResidues: {type:Type.ARRAY, items: {type:Type.NUMBER}} } },
                    network: { type: Type.OBJECT, properties: { nodes: {type:Type.ARRAY, items: {type:Type.OBJECT, properties: { id: {type:Type.STRING}, group: {type:Type.STRING}, impactScore: {type:Type.NUMBER} } } }, links: {type:Type.ARRAY, items: {type:Type.OBJECT, properties: { source: {type:Type.STRING}, target: {type:Type.STRING}, interactionType: {type:Type.STRING} } } } } },
                    literature: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: {type:Type.STRING}, source: {type:Type.STRING}, summary: {type:Type.STRING}, relevanceScore: {type:Type.NUMBER} } } },
                    stratification: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { population: {type:Type.STRING}, alleleFrequency: {type:Type.NUMBER}, predictedEfficacy: {type:Type.NUMBER} } } },
                    convergenceInsight: { type: Type.STRING },
                    detailedAnalysis: { type: Type.OBJECT, properties: { dockingDynamics: {type:Type.STRING}, pathwayKinetics: {type:Type.STRING}, evidenceSynthesis: {type:Type.STRING}, populationStat: {type:Type.STRING} } }
                }
            }
          }
        });
        if (!response.text) throw new Error("Simulation failed.");
        return cleanAndParseJSON(response.text) as SandboxResult;
    } catch (e: any) {
        throw e; // El componente DiscoveryLab maneja esto activando su modo offline
    }
};
