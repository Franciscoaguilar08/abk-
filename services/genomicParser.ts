
/**
 * GENOMIC PARSER ENGINE
 * Responsible for mathematically parsing VCF and other formats locally.
 * CRITICAL: Filters out Wildtype (0/0) variants to save AI tokens and prevent false positives.
 */

export interface ParsedVariant {
    rsId: string;
    chrom: string;
    pos: string;
    ref: string;
    alt: string;
    zygosity: 'HETEROZYGOUS' | 'HOMOZYGOUS' | 'UNKNOWN';
    rawLine?: string;
}

export const parseGenomicInput = (input: string): ParsedVariant[] => {
    // 1. Check for VCF Format (Standard)
    if (input.includes('##fileformat=VCF') || (input.includes('#CHROM') && input.includes('POS'))) {
        return parseVCF(input);
    }

    // 2. Check for 23andMe Format (TXT)
    if (input.includes('# rsid') && input.includes('genotype')) {
        return parse23andMe(input);
    }

    // 3. Fallback: Return empty to let Regex handler take over for unstructured lists
    return [];
};

/**
 * PARSE VCF LOGIC
 * Filters: 0/0, 0|0, ./., . (Ref/Ref or No Call)
 * Keeps: 0/1, 1/1, 1/2 (Variants)
 */
const parseVCF = (input: string): ParsedVariant[] => {
    const lines = input.split('\n');
    const variants: ParsedVariant[] = [];
    let headerFound = false;
    let colMap: Record<string, number> = {};

    for (const line of lines) {
        if (line.startsWith('##')) continue; // Skip meta-info
        
        // Header Line Parsing
        if (line.startsWith('#CHROM')) {
            const cols = line.trim().split(/\s+/);
            cols.forEach((col, idx) => colMap[col] = idx);
            headerFound = true;
            continue;
        }

        if (!headerFound || line.trim() === '') continue;

        const cols = line.trim().split(/\s+/);
        // Basic validation (VCF must have at least 8 cols, usually 9+ for samples)
        if (cols.length < 8) continue;

        // Extract Columns using Map (fallback to standard indices)
        const id = cols[colMap['ID'] || 2];
        const ref = cols[colMap['REF'] || 3];
        const alt = cols[colMap['ALT'] || 4];
        const formatCol = cols[colMap['FORMAT'] || 8];
        
        // Assuming single sample VCF (Column 9). 
        // Future upgrade: Iterate cols > 9 for multi-sample.
        const sampleCol = cols[9]; 

        // Skip if ID is missing or '.' (unless we want to handle non-rsID variants later)
        // For this app, we focus on rsIDs for DB lookup.
        if (!id || !id.startsWith('rs')) continue;

        // LOGIC: Check Zygosity
        let zygosity: 'HETEROZYGOUS' | 'HOMOZYGOUS' | 'UNKNOWN' = 'UNKNOWN';

        if (formatCol && sampleCol) {
            // FORMAT looks like GT:AD:DP:GQ:PL
            // SAMPLE looks like 0/1:10,5:15:99:100,0,200
            const formatParts = formatCol.split(':');
            const gtIndex = formatParts.indexOf('GT');
            
            if (gtIndex !== -1) {
                const sampleParts = sampleCol.split(':');
                const gt = sampleParts[gtIndex]; // e.g., "0/1", "1|1", "0/0"

                // === CRITICAL FILTER ===
                // If 0/0 (Ref/Ref) or ./. (No Call), SKIP IT.
                if (gt === '0/0' || gt === '0|0' || gt === './.' || gt === '.') {
                    continue; 
                }

                if (gt === '0/1' || gt === '0|1' || gt === '1/0' || gt === '1|0') {
                    zygosity = 'HETEROZYGOUS';
                } else if (gt === '1/1' || gt === '1|1') {
                    zygosity = 'HOMOZYGOUS';
                } else if (gt.includes('1') || gt.includes('2')) {
                    // Complex/Alt alleles
                    zygosity = 'HETEROZYGOUS';
                }
            } else {
                // No GT field? Assume heterozygous if listed, but this is rare in VCF
                zygosity = 'UNKNOWN'; 
            }
        } else {
            // VCF without sample column (rare for clinical report), just list of variants
            // Assume present = heterozygous risk
            zygosity = 'UNKNOWN';
        }

        variants.push({
            rsId: id,
            chrom: cols[colMap['#CHROM'] || 0],
            pos: cols[colMap['POS'] || 1],
            ref,
            alt,
            zygosity
        });
    }
    return variants;
};

const parse23andMe = (input: string): ParsedVariant[] => {
    // Format: # rsid  chromosome  position  genotype
    const lines = input.split('\n');
    const variants: ParsedVariant[] = [];

    for (const line of lines) {
        if (line.startsWith('#') || line.trim() === '') continue;
        const cols = line.trim().split(/\s+/);
        
        if (cols.length < 4) continue;
        
        const rsId = cols[0];
        const gt = cols[3]; // e.g. "AG", "CC", "--", "A"

        if (gt === '--') continue; // No call

        // Note: 23andMe raw data does NOT indicate reference. 
        // "AA" could be wildtype or homozygous mutant depending on the gene.
        // We MUST pass these to the backend to check against reference DB.
        
        if (rsId.startsWith('rs')) {
            variants.push({
                rsId,
                chrom: cols[1],
                pos: cols[2],
                ref: '',
                alt: '',
                zygosity: 'UNKNOWN' // Will be resolved by AI/DB
            });
        }
    }
    return variants;
}
