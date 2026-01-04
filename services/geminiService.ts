
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, AnalysisFocus, AncestryGroup, SandboxResult, GenomeBuild } from "../types";
import { batchFetchVariantData } from "./bioinformaticsService";
import { getProteinStructuralContext } from "./proteinService";
import { parseGenomicInput } from "./genomicParser";
import { ACMG_73, CPIC_PRIORITY } from "./geneLists";

const modelId = "gemini-3-flash-preview"; 

const getAIInstance = () => {
    // SECURITY CRITICAL: 
    // The API Key is accessed ONLY via the environment variable.
    // It is never logged, stored in state, or exposed to the frontend UI.
    const apiKey = process.env.API_KEY;
    
    // Strict validation without exposing the key value
    if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY' || apiKey.includes('YOUR_KEY')) {
        // Throw a generic error to trigger Offline Mode without leaking config details
        throw new Error("SIMULATION_MODE_TRIGGER");
    }
    return new GoogleGenAI({ apiKey: apiKey });
};

const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

// Helper: Regex Fallback
const extractRsIdsRegex = (text: string): string[] => {
    const regex = /rs\d+/g;
    const matches = text.match(regex);
    return matches ? [...new Set(matches)] : [];
};

/**
 * DATA NORMALIZERS (CRITICAL FOR CHARTS)
 */
const normalizeRiskLevel = (val: string): string => {
    if (!val) return 'UNCERTAIN';
    const v = val.toUpperCase();
    if (v.includes('PATHOGENIC')) return 'PATHOGENIC';
    if (v.includes('LIKELY_PATHOGENIC')) return 'HIGH'; // Simplify likely pathogenic to high for charts
    if (v.includes('HIGH')) return 'HIGH';
    if (v.includes('MODERATE')) return 'MODERATE';
    if (v.includes('UNCERTAIN')) return 'UNCERTAIN';
    if (v.includes('BENIGN')) return 'BENIGN';
    if (v.includes('LOW')) return 'LOW';
    return 'UNCERTAIN';
};

const normalizeOncoCategory = (val: string): string => {
    if (!val) return 'CELL_CYCLE';
    const v = val.toUpperCase();
    if (v.includes('DNA') || v.includes('REPAIR')) return 'DNA_REPAIR';
    if (v.includes('CYCLE') || v.includes('GROWTH') || v.includes('PROLIFERATION') || v.includes('SIGNALING')) return 'CELL_CYCLE';
    if (v.includes('METABOL') || v.includes('ENERGY') || v.includes('MITO')) return 'METABOLISM';
    if (v.includes('IMMUN') || v.includes('INFLAM')) return 'IMMUNITY';
    return 'CELL_CYCLE'; // Default bucket
};

/**
 * ATTEMPT TO REPAIR MALFORMED JSON
 */
const jsonRepair = (jsonStr: string): string => {
    let repaired = jsonStr.trim();
    
    // 1. Close unclosed string if truncated
    // Count unescaped quotes to see if we are inside a string
    let inString = false;
    let escape = false;
    for (let i = 0; i < repaired.length; i++) {
        if (escape) { escape = false; continue; }
        if (repaired[i] === '\\') { escape = true; continue; }
        if (repaired[i] === '"') { inString = !inString; }
    }
    if (inString) {
        repaired += '"';
    }

    // 2. Balance Braces and Brackets
    const openBraces = (repaired.match(/{/g) || []).length;
    const closeBraces = (repaired.match(/}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;

    if (openBrackets > closeBrackets) {
        repaired += "]".repeat(openBrackets - closeBrackets);
    }
    if (openBraces > closeBraces) {
        repaired += "}".repeat(openBraces - closeBraces);
    }

    // 3. Remove Trailing Commas (common syntax error in repaired JSON)
    // Replace ",}" with "}" and ",]" with "]"
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
      // If no starting bracket found, try parsing raw or attempt repair if it looks like json chunks
      try { return JSON.parse(clean); } catch(e) { throw new Error("No JSON object found"); }
  }

  // If we found a start, try to find the natural end
  let openChar = isArray ? '[' : '{';
  let closeChar = isArray ? ']' : '}';
  let balance = 0;
  let endIndex = -1;
  let inString = false;
  let escape = false;

  // Attempt to find the matching closing bracket
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

  let jsonString = "";
  if (endIndex !== -1) {
      // We found a complete object
      jsonString = clean.substring(startIndex, endIndex + 1);
  } else {
      // We didn't find the end, so it's likely truncated. Take everything from start.
      jsonString = clean.substring(startIndex);
  }

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
  genomeBuild: GenomeBuild = 'GRCh38',
  onStatusUpdate?: (status: string) => void
): Promise<AnalysisResult> => {

  try {
      getAIInstance();
  } catch (e) {
      throw new Error("SIMULATION_MODE_TRIGGER");
  }

  // --- STEP 1: PARSING & FILTER 1 (0/0) ---
  if(onStatusUpdate) onStatusUpdate("Parsing VCF & Filtering Wildtypes...");
  await yieldToMain();

  const parsedVariants = parseGenomicInput(genomicInput);
  
  let rsIds: string[] = [];
  let manualOverrideZygosity = "";

  // Check for Manual Input Override Header
  if (genomicInput.startsWith('## OVERRIDE_ZYGOSITY_CONTEXT:')) {
      const parts = genomicInput.split('##\n\n');
      if (parts.length > 0) {
          const header = parts[0];
          if (header.includes('0/1')) manualOverrideZygosity = 'HETEROZYGOUS';
          if (header.includes('1/1')) manualOverrideZygosity = 'HOMOZYGOUS';
      }
  }

  if (parsedVariants.length > 0) {
      rsIds = parsedVariants.map(v => v.rsId);
      if(onStatusUpdate) onStatusUpdate(`Detected ${parsedVariants.length} active variants (Removed 0/0).`);
  } else {
      rsIds = extractRsIdsRegex(genomicInput);
  }

  // --- STEP 2: ENRICHMENT (Real DB) ---
  if(onStatusUpdate) onStatusUpdate(`Querying Bio-Data for ${rsIds.length} variants...`);
  await yieldToMain();

  let rawDbData: any[] = [];
  if (rsIds.length > 0) {
      try {
          // Limit initial fetch to 100 to prevent timeout, prioritizing parsing logic
          rawDbData = await batchFetchVariantData(rsIds.slice(0, 100)); 
      } catch (e) {
          console.error("Bioinformatics fetch failed", e);
      }
  }

  // --- STEP 3: SMART FILTERING (ACMG / CPIC / CLINVAR) ---
  if(onStatusUpdate) onStatusUpdate("Applying ACMG-73 & CPIC Filters...");
  await yieldToMain();

  const priorityVariants: string[] = [];
  const keptDbRecords: any[] = []; // To pass to context

  // Map parsed data to DB data for filtering
  const variantsToProcess = parsedVariants.length > 0 ? parsedVariants : rsIds.map(id => ({ rsId: id, zygosity: 'UNKNOWN' }));

  variantsToProcess.forEach((v: any) => {
      const dbRecord = rawDbData.find(d => d.rsId === v.rsId);
      
      // LOGIC:
      // 1. Is Gene in ACMG 73?
      // 2. Is Gene in CPIC Priority?
      // 3. Is ClinVar Significance Pathogenic/Likely Pathogenic?
      // 4. Manual Override (if user pasted specific small list, we trust it)
      
      const gene = dbRecord?.geneSymbol?.toUpperCase();
      const isPathogenic = dbRecord?.clinVarSignificance?.toLowerCase().includes('pathogenic');
      const isACMG = gene && ACMG_73.includes(gene);
      const isCPIC = gene && CPIC_PRIORITY.includes(gene);
      
      const isSmallBatch = variantsToProcess.length < 20; // If user inputs <20 variants, analyze all.

      if (isACMG || isCPIC || isPathogenic || isSmallBatch) {
          const z = manualOverrideZygosity || v.zygosity || 'UNKNOWN';
          const refAlt = v.ref ? `REF:${v.ref} ALT:${v.alt}` : '';
          const tags = [];
          if (isACMG) tags.push("ACMG_73");
          if (isCPIC) tags.push("CPIC_PHARMA");
          if (isPathogenic) tags.push("CLINVAR_PATHOGENIC");

          priorityVariants.push(`ID: ${v.rsId} | GENE: ${gene || '?'} | ZYG: ${z} | TAGS: [${tags.join(',')}] | ${refAlt}`);
          
          if (dbRecord) keptDbRecords.push(dbRecord);
      }
  });

  const structuredVariantList = priorityVariants.join('\n');
  const realContext = JSON.stringify(keptDbRecords.map(d => ({
       id: d.rsId,
       gene: d.geneSymbol,
       clinvar: d.clinVarSignificance, 
       freq: d.gnomadFreq,
       cadd: d.caddPhred
  })), null, 2);

  if(onStatusUpdate) onStatusUpdate(`Filtered down to ${priorityVariants.length} CRITICAL variants.`);

  // --- STEP 4: SYNTHESIS ---
  if(onStatusUpdate) onStatusUpdate("Generating Clinical Report...");
  
  const systemInstruction = `
    ROLE: You are an expert Clinical Genomicist.
    TASK: Analyze the 'CRITICAL VARIANTS' list.
    
    REFERENCE GENOME ASSEMBLY: ${genomeBuild}
    
    ONCOLOGY PROFILE RULES (STRICT):
    - For EVERY variant in an oncology-related gene (including SERPINA1, MUTYH, CHEK2, etc.), you MUST provide full details.
    - Predisposition: DO NOT leave blank. Specify the exact cancer risk (e.g., "Hepatocellular Carcinoma via Cirrhosis" for SERPINA1, or "Colorectal Cancer").
    - Mechanism: Explain HOW it causes cancer (e.g., "Alpha-1 antitrypsin accumulation leads to liver damage").
    - Notes: Provide clinical management context.
    - Evidence Tier: Must be 'TIER_1_STRONG' if ClinVar is Pathogenic, otherwise assess accordingly.
    
    CRITICAL RULE: PENETRANCE LOGIC
    1. FREQUENCY CHECK: If gnomAD Frequency > 1% (0.01) AND condition is severe -> Assume LOW PENETRANCE.
    2. KNOWLEDGE CHECK: Apply known penetrance data for genes like HFE, LRRK2, GBA.
    3. RISK ADJUSTMENT: If Penetrance is LOW, downgrade 'riskLevel' (e.g. from HIGH to MODERATE) for healthy carriers.

    OUTPUT GUIDELINES:
    - Return Valid JSON matching the schema.
    - IMPORTANT: KEEP TEXT SUMMARIES CONCISE.
  `;

  const prompt = `
  CRITICAL VARIANTS (ACMG/CPIC/PATHOGENIC): 
  ${structuredVariantList.substring(0, 30000)}

  REAL DB CONTEXT: ${realContext}
  
  FOCUS: ${focusList.join(', ')}
  ANCESTRY: ${ancestry}
  GENOME BUILD: ${genomeBuild}
  
  INSTRUCTIONS:
  - Analyze ONLY the variants listed above.
  - Determine PENETRANCE.
  - Populate oncologyProfiles meticulously. Do not return empty strings for 'predisposition' or 'notes'.
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
                      oncologyProfiles: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { gene: {type:Type.STRING}, variant: {type:Type.STRING}, evidenceTier: {type:Type.STRING}, mechanismOfAction: {type:Type.STRING}, cancerHallmark: {type:Type.STRING}, therapeuticImplications: {type:Type.ARRAY, items: {type:Type.STRING}}, riskScore: {type:Type.NUMBER}, citation: {type:Type.STRING}, functionalCategory: {type:Type.STRING}, predisposition: {type:Type.STRING}, notes: {type:Type.STRING} } } },
                      phenotypeTraits: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { trait: {type:Type.STRING}, category: {type:Type.STRING}, prediction: {type:Type.STRING}, confidence: {type:Type.STRING}, description: {type:Type.STRING}, gene: {type:Type.STRING} } } }
                    }
                  }
            }
        });

        if (!response.text) throw new Error("Empty AI Response");
        const parsed = cleanAndParseJSON(response.text);
        
        // Data Normalization & Injection
        const enhancedVariants = (parsed.variants || []).map((v: any) => {
             const real = keptDbRecords.find(r => r.rsId === v.variant || (v.variant && v.variant.includes(r.rsId)));
             // Apply local zygosity if available from parser
             const localZ = parsedVariants.find(p => p.rsId === v.variant || v.variant.includes(p.rsId))?.zygosity;
             
             // Normalize Risk Level for Charts
             const normalizedRisk = normalizeRiskLevel(v.riskLevel);

             return {
                 ...v,
                 riskLevel: normalizedRisk, // FORCE NORMALIZATION
                 clinVarSignificance: real?.clinVarSignificance || v.clinVarSignificance,
                 caddScore: real?.caddPhred || v.caddScore,
                 populationFrequency: real?.gnomadFreq ? `${(real.gnomadFreq * 100).toFixed(4)}%` : v.populationFrequency,
                 zygosity: localZ || v.zygosity // Prefer parser zygosity
             }
        });

        // Normalize Oncology Profiles
        const enhancedOncology = (parsed.oncologyProfiles || []).map((p: any) => ({
            ...p,
            functionalCategory: normalizeOncoCategory(p.functionalCategory)
        }));

        return { 
            ...parsed, 
            variants: enhancedVariants,
            oncologyProfiles: enhancedOncology 
        } as AnalysisResult;

    } catch (e: any) {
        if (e.message === 'SIMULATION_MODE_TRIGGER') throw e;
        console.warn(`Retry ${retryCount + 1}`, e); // This log is safe, e contains standard error object
        retryCount++;
        if (retryCount === maxRetries) throw new Error("CONNECTION_FAILED");
        await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw new Error("Unexpected error");
};

export const analyzeDiscoveryData = async (
    targetInput: string,
    literatureContext: string = "", 
    onStatusUpdate?: (status: string) => void
): Promise<SandboxResult | null> => {
    
    try {
        const ai = getAIInstance();

        // 1. EXTRACT VARIANT DATA (Basic parsing)
        const variantMatch = targetInput.match(/(\d+)/);
        const position = variantMatch ? parseInt(variantMatch[0]) : undefined;
        // Assume first word is Gene (e.g., "BRAF" in "BRAF V600E")
        const geneName = targetInput.split(' ')[0].trim();

        // 2. CONNECT TO STRUCTURAL DB (UniProt)
        if (onStatusUpdate) onStatusUpdate(`CONNECTING TO UNIPROT KB FOR ${geneName}...`);
        const proteinData = await getProteinStructuralContext(geneName, position);
        
        if (onStatusUpdate) onStatusUpdate("RUNNING IN-SILICO DOCKING & CLINICAL CHECK...");

        // 3. CONSTRUCT SCIENTIFIC PROMPT
        const prompt = `
          ROLE: Expert Computational Biologist & Clinical Geneticist.
          TASK: Generate a high-fidelity Laboratory simulation for the gene/variant: "${targetInput}".
          
          === BIOLOGICAL GROUND TRUTH (FROM UNIPROT DATABASE) ===
          - UniProt ID: ${proteinData?.uniprotId || "Unknown (AI Inference)"}
          - Protein Function: ${proteinData?.functionDescription || "Standard metabolic function"}
          - STRUCTURAL ANALYSIS: ${proteinData?.interactionPotential || "No specific structural conflict detected."}
          - Functional Domains: ${proteinData?.structuralFeatures.join('; ') || "Generic domain structure"}
          ========================================================

          USER LITERATURE CONTEXT (If any): ${literatureContext || "None provided."}

          INSTRUCTIONS:
          1. STRUCTURE: Based strictly on the UniProt analysis, predict docking energy and structural impact.
          2. CLINICAL: Act as a clinical variant scientist. Apply ACMG criteria. Classify the variant (Pathogenic, Benign, etc.).
          3. PATHOLOGY: Determine the specific tumor types or diseases most strongly associated with this specific variant.
          4. HYPOTHESIS: Synthesize structure + clinic into a therapeutic hypothesis.

          OUTPUT FORMAT (Strict JSON, no markdown):
          {
            "targetId": "${targetInput.toUpperCase()}",
            "hypothesis": "Scientific hypothesis (2 sentences). Explain mechanism of action based on the UniProt domain hit.",
            "docking": {
              "targetName": "${geneName} Protein",
              "uniprotId": "${proteinData?.uniprotId || ""}",
              "ligandName": "Name of a real drug (FDA/Trial) for this target",
              "bindingEnergy": -9.5, 
              "activeSiteResidues": [${position || 100}, ${position ? position + 5 : 105}, ${position ? position - 5 : 95}]
            },
            "clinical": {
               "significance": "PATHOGENIC",
               "acmgCriteria": ["PVS1 (Null variant)", "PM2 (Absent in controls)"],
               "associatedCondition": "Associated disease name (e.g. Cystic Fibrosis)",
               "clinVarId": "Variation ID (Simulated)"
            },
            "network": {
               "nodes": [
                  {"id": "${geneName}", "group": "GENE", "impactScore": 1.0},
                  {"id": "Protein_B", "group": "PROTEIN", "impactScore": 0.8},
                  {"id": "Protein_C", "group": "PROTEIN", "impactScore": 0.7},
                  {"id": "Metabolite_X", "group": "METABOLITE", "impactScore": 0.6}
               ],
               "links": [
                  {"source": "${geneName}", "target": "Protein_B", "interactionType": "ACTIVATION"},
                  {"source": "Protein_B", "target": "Protein_C", "interactionType": "INHIBITION"},
                  {"source": "Protein_C", "target": "Metabolite_X", "interactionType": "CATALYSIS"}
               ]
            },
            "literature": [
               {"title": "Study on ${geneName} Variants", "source": "Nature Genetics (AI Sim)", "summary": "Relevance of domain mutation.", "relevanceScore": 95},
               {"title": "Clinical Resistance Patterns", "source": "PubMed (AI Sim)", "summary": "Drug interaction data.", "relevanceScore": 88}
            ],
            "diseaseRisks": [
               {"condition": "Main Associated Tumor", "associationPercentage": 85, "severity": "HIGH"},
               {"condition": "Secondary Condition", "associationPercentage": 30, "severity": "MODERATE"},
               {"condition": "Rare Phenotype", "associationPercentage": 5, "severity": "LOW"}
            ],
            "convergenceInsight": "Synthesize the Structural Analysis + Drug Mechanism into a theory of action.",
            "detailedAnalysis": {
               "dockingDynamics": "Explain H-bonds/Steric hindrance based on the amino acid change.",
               "pathwayKinetics": "Impact on downstream signaling.",
               "evidenceSynthesis": "Summary of consensus.",
               "populationStat": "Brief analysis of the disease association data."
            }
          }
        `;

        const response = await ai.models.generateContent({
          model: modelId,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2, 
            maxOutputTokens: 8192, 
          }
        });
        
        if (!response.text) throw new Error("Simulation failed.");
        const parsed = cleanAndParseJSON(response.text) as SandboxResult;
        
        // Inject Real Data back if available
        if (proteinData) {
            parsed.proteinMetaData = {
                geneName: proteinData.geneName,
                functionDescription: proteinData.functionDescription,
                structuralFeatures: proteinData.structuralFeatures
            };
            // FORCE REAL UNIPROT ID INTO DOCKING TO ENSURE VIEWER USES REAL PDB
            if (parsed.docking) {
                parsed.docking.uniprotId = proteinData.uniprotId;
            }
        }
        
        return parsed;

    } catch (e: any) {
        console.error("Gemini R&D API Error:", e);
        return null; // Triggers Offline Mode in UI
    }
};
