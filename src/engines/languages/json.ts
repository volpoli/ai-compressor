import { CompressionStats, calculateStats } from '../../utils/stats';

export interface CompressionResult {
    content: string;
    stats: CompressionStats;
}

export function compressJSON(code: string): CompressionResult {
    let minified = code;

    // Normalize line endings
    minified = minified.replace(/\r\n|\r/g, '\n');

    // For JSON, we only remove unnecessary whitespace
    // JSON doesn't have comments, so no comment removal needed

    // Remove leading/trailing whitespace
    minified = minified.replace(/^[ \t]+/gm, '');
    minified = minified.replace(/[ \t]+$/gm, '');

    // Collapse multiple spaces/tabs to single space
    minified = minified.replace(/[ \t]{2,}/g, ' ');

    // Remove spaces around JSON operators (commas, colons, brackets, braces)
    minified = minified.replace(/ +([\{\}\[\],:]) +/g, '$1');
    minified = minified.replace(/ +([\{\}\[\],:])/g, '$1');
    minified = minified.replace(/([\{\}\[\],:]) +/g, '$1');

    // Collapse multiple newlines to single newline
    minified = minified.replace(/\n{2,}/g, '\n');

    const trimmed = minified.trim();
    const stats = calculateStats(code, trimmed);

    return { content: trimmed, stats };
}