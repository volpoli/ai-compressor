import { CompressionStats, calculateStats } from '../utils/stats';

export interface CompressionResult {
    content: string;
    stats: CompressionStats;
}

const COMPRESS_PROMPT = `
Riscrivi questo testo in modalità Caveman. 
REGOLE RIGIDE:
- Rimuovi articoli, congiunzioni e parole di riempimento.
- NON modificare nulla all'interno di blocchi di codice, tag HTML o Link.
- Mantieni la precisione tecnica assoluta.
- Restituisci SOLO il testo compresso senza tag di markdown esterni se non necessari.
`;

export async function compressText(text: string): Promise<string> {
    const result = await compressTextWithStats(text);
    return result.content;
}

export async function compressTextWithStats(text: string): Promise<CompressionResult> {
    const apiKey = process.env.GEMINI_FREE_KEY;

    if (apiKey) {
        try {
            console.log("-> API Gemini (Free Tier) rilevata. Avvio compressione IA...");
            const compressed = await callGeminiAPI(text, apiKey);
            const stats = calculateStats(text, compressed);
            return { content: compressed, stats };
        } catch (error: any) {
            console.warn(`\n[AVVISO] Errore API o Limite Raggiunto: ${error.message}`);
            console.log("-> Graceful Degradation innescata. Ripiego sul motore locale...");
        }
    } else {
        console.log("-> Nessuna GEMINI_FREE_KEY trovata. Avvio motore locale...");
    }

    return compressTextLocally(text);
}

async function callGeminiAPI(text: string, apiKey: string): Promise<string> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const payload = {
        contents: [{ parts: [{ text: `${COMPRESS_PROMPT}\n\nTESTO:\n${text}` }] }],
        generationConfig: { temperature: 0.1 }
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        if (response.status === 429) throw new Error("Quota esaurita");
        throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
}

function compressTextLocally(text: string): CompressionResult {
    const placeholders: string[] = [];
    let processedText = text;

    // Placeholder Pattern esteso
    const protectionRegex = /(```[\s\S]*?```|`[^`]*`|<[^>]+>|\[[^\]]+\]\([^)]+\))/g;

    processedText = processedText.replace(protectionRegex, (match) => {
        placeholders.push(match);
        return `__SAFE_BLOCK_${placeholders.length - 1}__`;
    });

    // Rimozione Stopwords (Zero assunzioni: solo articoli e preposizioni semplici certe)
    const stopwords = [
        ' il ', ' lo ', ' la ', ' i ', ' gli ', ' le ', ' un ', ' uno ', ' una ',
        ' di ', ' a ', ' da ', ' in ', ' con ', ' su ', ' per ', ' tra ', ' fra ',
        ' the ', ' and ', ' a ', ' an '
    ];

    for (const word of stopwords) {
        const regex = new RegExp(word, 'gi');
        processedText = processedText.replace(regex, ' ');
    }

    processedText = processedText.replace(/[ \t]+/g, ' ');
    processedText = processedText.replace(/\n\s*\n/g, '\n');

    processedText = processedText.replace(/__SAFE_BLOCK_(\d+)__/g, (match, index) => {
        return placeholders[parseInt(index, 10)];
    });

    const trimmed = processedText.trim();
    const stats = calculateStats(text, trimmed);

    return { content: trimmed, stats };
}