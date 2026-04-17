import { CompressionStats, calculateStats } from '../../utils/stats';

export interface CompressionResult {
    content: string;
    stats: CompressionStats;
}

export function compressJavaScript(code: string): CompressionResult {
    let minified = code;

    // Normalize line endings
    minified = minified.replace(/\r\n|\r/g, '\n');

    // Remove single-line comments (but preserve shebang and hashbang)
    minified = minified.replace(/^#!/gm, '__SHEBANG__');
    minified = minified.replace(/^(#|\/\/).*$/gm, '');
    minified = minified.replace(/^__SHEBANG__$/gm, '#!/usr/bin/env node');

    // Remove multi-line comments
    minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');

    // Remove leading/trailing whitespace
    minified = minified.replace(/^[ \t]+/gm, '');
    minified = minified.replace(/[ \t]+$/gm, '');

    // Collapse multiple spaces/tabs to single space
    minified = minified.replace(/[ \t]{2,}/g, ' ');

    // Remove spaces around operators (JS-specific safe operators)
    // Be careful with JSX and template literals
    const safeOperators = /([=,:;\{\}\(\)\[\]\+\-\*\/\%\!\|\&\^\~\?\>\<])/g;
    minified = minified.replace(/ +([=,:;\{\}\(\)\[\]\+\-\*\/\%\!\|\&\^\~\?\>\<]) +/g, '$1');
    minified = minified.replace(/ +([=,:;\{\}\(\)\[\]\+\-\*\/\%\!\|\&\^\~\?\>\<])/g, '$1');
    minified = minified.replace(/([=,:;\{\}\(\)\[\]\+\-\*\/\%\!\|\&\^\~\?\>\<]) +/g, '$1');

    // Collapse multiple newlines to single newline
    minified = minified.replace(/\n{3,}/g, '\n\n');

    const trimmed = minified.trim();
    const stats = calculateStats(code, trimmed);

    return { content: trimmed, stats };
}

export function compressTypeScript(code: string): CompressionResult {
    let minified = code;

    // Normalize line endings
    minified = minified.replace(/\r\n|\r/g, '\n');

    // Preserve shebang
    minified = minified.replace(/^#!/gm, '__SHEBANG__');

    // Remove single-line comments (TypeScript style)
    minified = minified.replace(/\/\/.*$/gm, '');

    // Remove multi-line comments
    minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');

    // Restore shebang
    minified = minified.replace(/^__SHEBANG__$/gm, '#!/usr/bin/env node');

    // Remove leading/trailing whitespace
    minified = minified.replace(/^[ \t]+/gm, '');
    minified = minified.replace(/[ \t]+$/gm, '');

    // Collapse multiple spaces/tabs to single space
    minified = minified.replace(/[ \t]{2,}/g, ' ');

    // For TypeScript, preserve spaces in type annotations
    // Pattern: word: type (preserve space after colon for types)
    minified = minified.replace(/(\w)\s*:\s*(\w)/g, '$1: $2');

    // Remove spaces around other operators
    const safeOperators = /([=;\{\}\(\)\[\]\+\-\*\/\%\!\|\&\^\~\?\>])/g;
    minified = minified.replace(/ +([=;\{\}\(\)\[\]\+\-\*\/\%\!\|\&\^\~\?\>]) +/g, '$1');
    minified = minified.replace(/ +([=;\{\}\(\)\[\]\+\-\*\/\%\!\|\&\^\~\?\>])/g, '$1');
    minified = minified.replace(/([=;\{\}\(\)\[\]\+\-\*\/\%\!\|\&\^\~\?\>]) +/g, '$1');

    // Collapse multiple newlines to single newline
    minified = minified.replace(/\n{3,}/g, '\n\n');

    const trimmed = minified.trim();
    const stats = calculateStats(code, trimmed);

    return { content: trimmed, stats };
}