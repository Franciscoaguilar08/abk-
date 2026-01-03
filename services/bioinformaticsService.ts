
/**
 * REAL BIOINFORMATICS API INTEGRATION
 * Sources: MyVariant.info (Aggregates ClinVar, dbNSFP, gnomAD)
 * 
 * OPTIMIZATION: 
 * - Chunking: Splits large requests into smaller batches.
 * - Resilience: Implements Retry with Exponential Backoff.
 * - Safety: Uses AbortController for timeouts.
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

const BATCH_CHUNK_SIZE = 50; // Reduced safe limit
const REQUEST_TIMEOUT_MS = 15000; // 15s timeout
const MAX_RETRIES = 3;

/**
 * Utility: Delay for backoff
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Utility: Chunk array
 */
const chunkArray = <T>(array: T[], size: number): T[][] => {
    const chunked: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunked.push(array.slice(i, i + size));
    }
    return chunked;
};

/**
 * Robust Fetch Wrapper with Timeout and Retry
 */
const fetchWithRetry = async (url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> => {
    let attempt = 0;
    
    while (attempt < retries) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            // If success, return immediately
            if (response.ok) return response;

            // Handle Rate Limiting (429) or Server Errors (5xx)
            if (response.status === 429 || response.status >= 500) {
                const backoffTime = Math.pow(2, attempt) * 1000 + (Math.random() * 500); // Jitter
                console.warn(`Bioinformatics API Error ${response.status}. Retrying in ${Math.round(backoffTime)}ms...`);
                await delay(backoffTime);
                attempt++;
                continue;
            }

            // Client errors (4xx) usually shouldn't be retried
            return response;

        } catch (error: any) {
            clearTimeout(timeoutId);
            
            const isAbort = error.name === 'AbortError';
            if (isAbort) {
                console.warn(`Request timed out after ${REQUEST_TIMEOUT_MS}ms. Attempt ${attempt + 1}/${retries}`);
            } else {
                console.warn(`Network error: ${error.message}. Attempt ${attempt + 1}/${retries}`);
            }

            attempt++;
            if (attempt >= retries) throw error; // Rethrow on final fail
            
            const backoffTime = Math.pow(2, attempt) * 1000;
            await delay(backoffTime);
        }
    }
    
    throw new Error("Max retries exceeded");
};

/**
 * Helper function to parse a single variant response object from MyVariant.info
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
    } else if (data.clinvar && data.clinvar.variant_id) {
        // Fallback sometimes clinvar object structure varies
         clinSig = "Reported (Check details)";
    }

    // 2. Extract Scores (dbNSFP)
    let cadd = undefined;
    let revel = undefined;

    if (data.dbnsfp) {
        const db = Array.isArray(data.dbnsfp) ? data.dbnsfp[0] : data.dbnsfp;
        cadd = db.cadd?.phred;
        revel = db.revel_score;
    }

    // 3. Extract gnomAD Frequency
    const freq = data.gnomad_genome?.af?.af || data.gnomad_exome?.af?.af;

    // 4. Extract Gene Info & Protein Change (SnpEff)
    let gene = "";
    let proteinChange = "";
    if (data.snpeff && data.snpeff.ann) {
            const ann = Array.isArray(data.snpeff.ann) ? data.snpeff.ann[0] : data.snpeff.ann;
            gene = ann.gene_name;
            proteinChange = ann.hgvs_p; 
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
 */
export const fetchRealVariantData = async (rsId: string): Promise<RealVariantData | null> => {
    if (!rsId || !rsId.startsWith('rs')) return null;

    try {
        const fields = 'clinvar,dbnsfp,gnomad_genome,gnomad_exome,snpeff';
        const response = await fetchWithRetry(`https://myvariant.info/v1/variant/${rsId}?fields=${fields}`, {
            method: 'GET'
        });
        
        if (!response.ok) return null;

        const data = await response.json();
        return parseMyVariantResponse(data, rsId);

    } catch (e) {
        console.warn(`Failed to fetch real data for ${rsId}`, e);
        return null;
    }
};

/**
 * Fetches data for multiple variants (POST) - HIGH PERFORMANCE & ROBUST
 * Handles chunking, timeouts, and retries.
 */
export const batchFetchVariantData = async (rsIds: string[]): Promise<RealVariantData[]> => {
    const validIds = rsIds.filter(id => id && id.startsWith('rs'));
    if (validIds.length === 0) return [];

    // 1. Split into chunks to avoid Payload Too Large
    const chunks = chunkArray(validIds, BATCH_CHUNK_SIZE);
    
    try {
        // 2. Process chunks in parallel (Promise.all)
        const chunkPromises = chunks.map(async (chunkIds) => {
            try {
                const response = await fetchWithRetry(`https://myvariant.info/v1/variant`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        ids: chunkIds.join(','),
                        fields: 'clinvar,dbnsfp,gnomad_genome,gnomad_exome,snpeff'
                    })
                });

                if (!response.ok) return [];

                const results = await response.json();
                if (Array.isArray(results)) {
                    return results
                        .map((item: any) => parseMyVariantResponse(item, item.query))
                        .filter((item): item is RealVariantData => item !== null);
                }
                return [];

            } catch (err) {
                console.error("Batch chunk failed after retries:", err);
                return []; // Return empty for this chunk so others can succeed
            }
        });

        // 3. Flatten results
        const resultsArray = await Promise.all(chunkPromises);
        return resultsArray.flat();

    } catch (e) {
        console.error("Critical batch fetch error", e);
        return [];
    }
};
