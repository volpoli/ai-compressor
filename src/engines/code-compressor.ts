import { CompressionStats, calculateStats } from '../utils/stats';
import { detectLanguage } from '../utils/detect';
import {
    compressJavaScript,
    compressTypeScript
} from './languages/javascript';
import { compressPython } from './languages/python';
import { compressCSS } from './languages/css';
import { compressHTML } from './languages/html';
import { compressJSON } from './languages/json';

export interface CompressionResult {
    content: string;
    stats: CompressionStats;
}

export function compressCode(code: string): string {
    return compressCodeWithStats(code).content;
}

export function compressCodeWithStats(code: string, filePath?: string): CompressionResult {
    // If no file path provided, use generic compression
    if (!filePath) {
        return compressGeneric(code);
    }

    const language = detectLanguage(filePath);

    switch (language) {
        case 'javascript':
            return compressJavaScript(code);
        case 'typescript':
            return compressTypeScript(code);
        case 'python':
            return compressPython(code);
        case 'css':
            return compressCSS(code);
        case 'html':
            return compressHTML(code);
        case 'json':
            return compressJSON(code);
        default:
            // Fallback to generic compression
            return compressGeneric(code);
    }
}

function compressGeneric(code: string): CompressionResult {
    let minified = code;

    // 0. NORMALIZZAZIONE: Uniforma ritorni a capo Windows (\r\n) e Mac vecchi (\r) in puro Unix (\n)
    // Fondamentale per non far impazzire le regex verticali su WSL2.
    minified = minified.replace(/\r\n|\r/g, '\n');

    // 1. Rimuove commenti
    minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');
    minified = minified.replace(/([^:]|^)\/\/.*$/gm, '$1');

    // 2. Rimuove l'indentazione e gli spazi a fine riga
    minified = minified.replace(/^[ \t]+/gm, '');
    minified = minified.replace(/[ \t]+$/gm, '');

    // 3. NOVITÀ: Collassa spazi multipli all'interno della riga in uno spazio singolo
    minified = minified.replace(/[ \t]{2,}/g, ' ');

    // 4. NOVITÀ: Rimuove spazi prima e dopo operatori sicuri (senza toccare < > per via di JSX)
    // Non tocca i ritorni a capo (\n), rimuove solo gli spazi orizzontali.
    minified = minified.replace(/ ([=,:;\{\}\(\)\[\]]) /g, '$1');
    minified = minified.replace(/ ([=,:;\{\}\(\)\[\]])/g, '$1');
    minified = minified.replace(/([=,:;\{\}\(\)\[\]]) /g, '$1');

    // 5. L'ANNIHILATORE VERTICALE:
    // Fonde qualsiasi quantità di \n consecutivi (compresi quelli lasciati dai commenti appena rimossi) in un unico \n.
    minified = minified.replace(/\n+/g, '\n');

    const trimmed = minified.trim();
    const stats = calculateStats(code, trimmed);

    return { content: trimmed, stats };
}