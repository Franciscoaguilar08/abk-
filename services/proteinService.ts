

export interface ProteinContext {
  uniprotId: string;
  geneName: string;
  functionDescription: string;
  structuralFeatures: string[]; 
  interactionPotential: string;
}

/**
 * Consulta la API de UniProt para obtener el contexto estructural real.
 * @param gene Nombre del gen (ej: BRAF, EGFR)
 * @param variantPosition Posición del aminoácido (ej: 600) opcional
 */
export async function getProteinStructuralContext(gene: string, variantPosition?: number): Promise<ProteinContext | null> {
  try {
    // 1. Buscar en UniProt (Humanos only: 9606, Revisados: true)
    // Using fetch instead of axios
    const url = `https://rest.uniprot.org/uniprotkb/search?query=gene_exact:${gene}+AND+organism_id:9606+AND+reviewed:true&fields=accession,cc_function,features&format=json&size=1`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) return null;

    const protein = data.results[0]; // Tomamos el mejor match
    const accession = protein.primaryAccession;
    
    // 2. Extraer Descripción de Función
    const funcDesc = protein.comments?.find((c: any) => c.commentType === 'FUNCTION')?.texts?.[0]?.value || "Metabolic function not detailed in database.";

    // 3. Análisis de Estructura vs Variante
    const criticalFeatures: string[] = [];
    let hitFound = false;
    
    if (protein.features) {
      protein.features.forEach((feat: any) => {
        // Filtramos solo características relevantes para fármacos/enfermedad
        if (['ACTIVE_SITE', 'BINDING_SITE', 'DOMAIN', 'MUTAGENESIS', 'MODIFIED_RESIDUE'].includes(feat.type)) {
          
          const start = feat.location?.start?.value;
          const end = feat.location?.end?.value;

          if (start && end) {
            // Si tenemos la posición de la variante del usuario, verificamos colisión
            if (variantPosition && variantPosition >= start && variantPosition <= end) {
                criticalFeatures.push(`⚠️ CRITICAL HIT: User mutation at pos ${variantPosition} impacts ${feat.type} (${feat.description})`);
                hitFound = true;
            } else if (!variantPosition) {
                // Si no hay posición, listamos sitios importantes generales
                criticalFeatures.push(`${feat.type}: ${feat.description}`);
            }
          }
        }
      });
    }

    // Limitamos features para no saturar el prompt de Gemini
    const topFeatures = criticalFeatures.slice(0, 8);

    // 4. Generar Resumen de Potencial de Interacción
    let interactionPotential = "Structural data available. No specific active site conflict detected.";
    if (hitFound) {
        interactionPotential = `HIGH IMPACT: Mutation directly disrupts a functional region (${topFeatures[0]}). This likely alters ligand binding affinity.`;
    } else if (variantPosition) {
        interactionPotential = `ALLOSTERIC POTENTIAL: Mutation at ${variantPosition} is outside main active sites, suggesting possible allosteric effects or protein folding issues.`;
    }

    return {
      uniprotId: accession,
      geneName: gene,
      functionDescription: funcDesc,
      structuralFeatures: topFeatures,
      interactionPotential
    };

  } catch (error) {
    console.warn("UniProt API fetch failed (continuing with AI only):", error);
    return null; // Fallback silencioso
  }
}