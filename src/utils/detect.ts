import * as fs from 'fs';
import * as path from 'path';

const COMPRESSIBLE_EXTENSIONS = new Set(['.md', '.txt', '.markdown', '.mdx']);
const SKIP_EXTENSIONS = new Set([
    '.js', '.ts', '.tsx', '.jsx', '.json', '.yaml', '.yml',
    '.env', '.css', '.html', '.sh', '.ino', '.cpp', '.h', '.sql'
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

export function detectFileType(filePath: string): FileType {
    const ext = path.extname(filePath).toLowerCase();

    if (COMPRESSIBLE_EXTENSIONS.has(ext)) return 'text';
    if (SKIP_EXTENSIONS.has(ext)) {
        return ['.json', '.yaml', '.yml', '.env'].includes(ext) ? 'config' : 'code';
    }

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