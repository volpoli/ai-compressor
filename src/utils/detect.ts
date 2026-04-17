import * as fs from 'fs';
import * as path from 'path';

const LANGUAGE_EXTENSIONS = {
    javascript: ['.js', '.mjs', '.cjs'],
    typescript: ['.ts', '.tsx', '.mts', '.cts'],
    python: ['.py', '.pyw', '.pyi'],
    css: ['.css', '.scss', '.sass', '.less'],
    html: ['.html', '.htm', '.xml', '.svg'],
    json: ['.json', '.jsonc'],
};

const COMPRESSIBLE_EXTENSIONS = new Set(['.md', '.txt', '.markdown', '.mdx']);
const SKIP_EXTENSIONS = new Set([
    '.js', '.ts', '.tsx', '.jsx', '.mjs', '.cjs', '.mts', '.cts',
    '.json', '.yaml', '.yml', '.css', '.scss', '.sass', '.less',
    '.html', '.htm', '.xml', '.svg', '.env', '.sh', '.ino', '.cpp', '.h', '.sql',
    '.py', '.pyw', '.pyi'
]);

const CODE_PATTERNS = [
    /^\s*(import |from .+ import |require\(|const |let |var )/,
    /^\s*(def |class |function |async function |export )/,
    /^\s*(if\s*\(|for\s*\(|while\s*\(|switch\s*\(|try\s*\{)/,
    /^\s*[\}\]\);]+\s*$/,
    /^\s*@\w+/,
    /^\s*"[^"]+"\s*:\s*/,
];

export type FileType = 'text' | 'code' | 'config' | 'unknown';
export type LanguageType = 'javascript' | 'typescript' | 'python' | 'css' | 'html' | 'json' | 'unknown';

export function detectFileType(filePath: string): FileType {
    const ext = path.extname(filePath).toLowerCase();

    if (COMPRESSIBLE_EXTENSIONS.has(ext)) return 'text';
    if (SKIP_EXTENSIONS.has(ext)) {
        return ['.json', '.yaml', '.yml', '.env'].includes(ext) ? 'config' : 'code';
    }

    // Fallback to content analysis for unknown extensions
    try {
        const buffer = Buffer.alloc(2048);
        const fd = fs.openSync(filePath, 'r');
        fs.readSync(fd, buffer, 0, 2048, 0);
        fs.closeSync(fd);

        const textSnippet = buffer.toString('utf8');
        const lines = textSnippet.split('\n').slice(0, 50);

        let codeLineCount = 0;
        let validLineCount = 0;

        for (const line of lines) {
            if (line.trim().length === 0) continue;
            validLineCount++;
            if (CODE_PATTERNS.some(regex => regex.test(line))) {
                codeLineCount++;
            }
        }

        if (validLineCount > 0 && (codeLineCount / validLineCount) > 0.4) {
            return 'code';
        }
        return 'text';
    } catch (error) {
        return 'unknown';
    }
}

export function detectLanguage(filePath: string): LanguageType {
    const ext = path.extname(filePath).toLowerCase();

    for (const [language, extensions] of Object.entries(LANGUAGE_EXTENSIONS)) {
        if (extensions.includes(ext)) {
            return language as LanguageType;
        }
    }

    return 'unknown';
}