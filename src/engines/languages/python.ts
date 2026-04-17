import { CompressionStats, calculateStats } from '../../utils/stats';

export interface CompressionResult {
    content: string;
    stats: CompressionStats;
}

export function compressPython(code: string): CompressionResult {
    let minified = code;

    // Normalize line endings
    minified = minified.replace(/\r\n|\r/g, '\n');

    // Preserve shebang
    minified = minified.replace(/^#!/gm, '__SHEBANG__');

    // Remove single-line comments (#)
    minified = minified.replace(/^[ \t]*#.*$/gm, '');

    // Remove multi-line strings (docstrings) - but be careful!
    // This is a simplified approach - real Python docstring removal is complex
    // For now, we'll be conservative and only remove obvious docstrings
    minified = minified.replace(/^[ \t]*""".*?"""/gm, '');
    minified = minified.replace(/^[ \t]*'''.*?'''/gm, '');

    // Restore shebang
    minified = minified.replace(/^__SHEBANG__$/gm, '#!/usr/bin/env python3');

    // Remove trailing whitespace
    minified = minified.replace(/[ \t]+$/gm, '');

    // Collapse multiple blank lines to single blank line
    minified = minified.replace(/\n{3,}/g, '\n\n');

    // IMPORTANT: Python indentation is SEMANTIC - we cannot remove it!
    // Only remove completely empty lines that don't affect indentation
    minified = minified.replace(/^\n$/gm, '');

    const trimmed = minified.trim();
    const stats = calculateStats(code, trimmed);

    return { content: trimmed, stats };
}