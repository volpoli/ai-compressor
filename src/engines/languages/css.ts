import { CompressionStats, calculateStats } from '../../utils/stats';

export interface CompressionResult {
    content: string;
    stats: CompressionStats;
}

export function compressCSS(code: string): CompressionResult {
    let minified = code;

    // Normalize line endings
    minified = minified.replace(/\r\n|\r/g, '\n');

    // Remove CSS comments
    minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');

    // Remove leading/trailing whitespace
    minified = minified.replace(/^[ \t]+/gm, '');
    minified = minified.replace(/[ \t]+$/gm, '');

    // Collapse multiple spaces/tabs to single space
    minified = minified.replace(/[ \t]{2,}/g, ' ');

    // Remove spaces around CSS-specific operators
    minified = minified.replace(/ +([\{\}:;,]) +/g, '$1');
    minified = minified.replace(/ +([\{\}:;,])/g, '$1');
    minified = minified.replace(/([\{\}:;,]) +/g, '$1');

    // Remove spaces around property-value separators
    minified = minified.replace(/ +: +/g, ':');

    // Collapse multiple newlines to single newline
    minified = minified.replace(/\n{2,}/g, '\n');

    const trimmed = minified.trim();
    const stats = calculateStats(code, trimmed);

    return { content: trimmed, stats };
}