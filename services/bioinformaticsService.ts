/**
 * REAL BIOINFORMATICS API INTEGRATION
 * Sources: MyVariant.info (Aggregates ClinVar, dbNSFP, gnomAD)
 */

interface RealVariantData {
    rsId: string;
    clinVarSignificance?: string;
    clinVarCondition?: string;
    gnomadFreq?: number;
    caddPhred?: number;
    revelScore?: number;
    geneSymbol?: string;
    transcript?: string;
    proteinChange?: string; // HGVSp
}

export const fetchRealVariantData = async (rsId: string): Promise<RealVariantData | null> => {
    if (!rsId || !rsId.startsWith('rs')) return null;

    try {
        // Query MyVariant.info v1 API
        // Fields:
        // - clinvar.rcv.clinical_significance: Clinical status
        // - dbnsfp.cadd.phred: Pathogenicity Prediction
        // - dbnsfp.revel_score: Rare Exome Variant Ensemble Learner
        // - gnomad_genome.af.af: Global Frequency
        // - snpeff.ann: Annotation for gene/protein impact
        const response = await fetch(`https://myvariant.info/v1/variant/${rsId}?fields=clinvar,dbnsfp,gnomad_genome,snpeff`);
        
        if (!response.ok) return null;

        const data = await response.json();

        // 1. Extract ClinVar (Can be an array or object)
        let clinSig = "Not Reported";
        let condition = "";
        
        if (data.clinvar && data.clinvar.rcv) {
            const rcv = Array.isArray(data.clinvar.rcv) ? data.clinvar.rcv[0] : data.clinvar.rcv;
            clinSig = rcv.clinical_significance || "Uncertain";
            condition = rcv.conditions?.name || "";
        }

        // 2. Extract Scores (dbNSFP)
        let cadd = undefined;
        let revel = undefined;

        if (data.dbnsfp) {
            // dbnsfp can be an object or array, handle simple case
            const db = Array.isArray(data.dbnsfp) ? data.dbnsfp[0] : data.dbnsfp;
            cadd = db.cadd?.phred;
            revel = db.revel_score;
        }

        // 3. Extract gnomAD Frequency
        const freq = data.gnomad_genome?.af?.af;

        // 4. Extract Gene Info
        let gene = "";
        let proteinChange = "";
        if (data.snpeff && data.snpeff.ann) {
             const ann = Array.isArray(data.snpeff.ann) ? data.snpeff.ann[0] : data.snpeff.ann;
             gene = ann.gene_name;
             proteinChange = ann.hgvs_p; // e.g. p.Val600Glu
        }

        return {
            rsId,
            clinVarSignificance: clinSig,
            clinVarCondition: condition,
            gnomadFreq: freq,
            caddPhred: cadd,
            revelScore: revel,
            geneSymbol: gene,
            proteinChange: proteinChange
        };

    } catch (e) {
        console.warn(`Failed to fetch real data for ${rsId}`, e);
        return null;
    }
};

export const batchFetchVariantData = async (rsIds: string[]) => {
    // Parallelize requests (MyVariant also supports batch POST but this is simpler for demo)
    const promises = rsIds.map(id => fetchRealVariantData(id));
    const results = await Promise.all(promises);
    return results.filter(r => r !== null) as RealVariantData[];
};