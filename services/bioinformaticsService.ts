/**
 * REAL BIOINFORMATICS API INTEGRATION
 * Sources: MyVariant.info (Aggregates ClinVar, dbNSFP, gnomAD)
 * 
 * OPTIMIZATION: Uses Batch POST requests to avoid rate limiting and reduce network overhead.
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

/**
 * Helper function to parse a single variant response object from MyVariant.info
 * Handles the variability of fields (sometimes arrays, sometimes objects).
 */
const parseMyVariantResponse = (data: any, fallbackId: string): RealVariantData | null => {
    if (!data || data.notfound) return null;

    // The API returns the queried ID in the 'query' field for batch requests, or '_id' for single
    const id = data.query || data._id || fallbackId;

    // 1. Extract ClinVar (Can be an array or object)
    let clinSig = "Not Reported";
    let condition = "";
    
    if (data.clinvar && data.clinvar.rcv) {
        const rcv = Array.isArray(data.clinvar.rcv) ? data.clinvar.rcv[0] : data.clinvar.rcv;
        clinSig = rcv.clinical_significance || "Uncertain";
        condition = rcv.conditions?.name || "";
    }

    // 2. Extract Scores (dbNSFP)
    // dbnsfp contains in-silico prediction scores
    let cadd = undefined;
    let revel = undefined;

    if (data.dbnsfp) {
        // dbnsfp can be an object or array (multiple transcripts)
        const db = Array.isArray(data.dbnsfp) ? data.dbnsfp[0] : data.dbnsfp;
        cadd = db.cadd?.phred;
        revel = db.revel_score;
    }

    // 3. Extract gnomAD Frequency
    const freq = data.gnomad_genome?.af?.af;

    // 4. Extract Gene Info & Protein Change (SnpEff)
    let gene = "";
    let proteinChange = "";
    if (data.snpeff && data.snpeff.ann) {
            const ann = Array.isArray(data.snpeff.ann) ? data.snpeff.ann[0] : data.snpeff.ann;
            gene = ann.gene_name;
            proteinChange = ann.hgvs_p; // e.g. p.Val600Glu
    }

    return {
        rsId: id,
        clinVarSignificance: clinSig,
        clinVarCondition: condition,
        gnomadFreq: freq,
        caddPhred: cadd,
        revelScore: revel,
        geneSymbol: gene,
        proteinChange: proteinChange
    };
};

/**
 * Fetches data for a single variant (GET)
 * Used for individual lookups.
 */
export const fetchRealVariantData = async (rsId: string): Promise<RealVariantData | null> => {
    if (!rsId || !rsId.startsWith('rs')) return null;

    try {
        const fields = 'clinvar,dbnsfp,gnomad_genome,snpeff';
        const response = await fetch(`https://myvariant.info/v1/variant/${rsId}?fields=${fields}`);
        
        if (!response.ok) return null;

        const data = await response.json();
        return parseMyVariantResponse(data, rsId);

    } catch (e) {
        console.warn(`Failed to fetch real data for ${rsId}`, e);
        return null;
    }
};

/**
 * Fetches data for multiple variants (POST) - HIGH PERFORMANCE
 * Uses the /v1/variant POST endpoint to fetch all IDs in a single HTTP call.
 */
export const batchFetchVariantData = async (rsIds: string[]): Promise<RealVariantData[]> => {
    const validIds = rsIds.filter(id => id && id.startsWith('rs'));
    if (validIds.length === 0) return [];

    try {
        // MyVariant.info Batch Query
        const response = await fetch(`https://myvariant.info/v1/variant`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            // We join IDs with commas. 
            // Note: If list > 1000, we would need to chunk this, but for this app it's fine.
            body: new URLSearchParams({
                ids: validIds.join(','),
                fields: 'clinvar,dbnsfp,gnomad_genome,snpeff'
            })
        });

        if (!response.ok) return [];

        const results = await response.json();

        // The batch endpoint returns an array of objects
        if (Array.isArray(results)) {
            return results
                .map((item: any) => parseMyVariantResponse(item, item.query))
                .filter((item): item is RealVariantData => item !== null);
        }

        return [];

    } catch (e) {
        console.error("Batch fetch failed", e);
        return [];
    }
};