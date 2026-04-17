export interface CompressionStats {
    originalSize: number;
    compressedSize: number;
    percentReduction: number;
    linesBefore: number;
    linesAfter: number;
    linesRemoved: number;
    bytesRemoved: number;
}

export function calculateStats(original: string, compressed: string): CompressionStats {
    const originalSize = Buffer.byteLength(original, 'utf8');
    const compressedSize = Buffer.byteLength(compressed, 'utf8');
    const linesBefore = original.split('\n').length;
    const linesAfter = compressed.split('\n').length;
    const bytesRemoved = originalSize - compressedSize;
    const percentReduction = originalSize > 0
        ? Math.round((bytesRemoved / originalSize) * 100 * 10) / 10
        : 0;

    return {
        originalSize,
        compressedSize,
        percentReduction,
        linesBefore,
        linesAfter,
        linesRemoved: linesBefore - linesAfter,
        bytesRemoved,
    };
}

export function formatStats(stats: CompressionStats): string {
    return `
📊 Statistiche Compressione:
   Original:  ${formatBytes(stats.originalSize)} (${stats.linesBefore} righe)
   Compressed: ${formatBytes(stats.compressedSize)} (${stats.linesAfter} righe)
   Riduzione: ${stats.percentReduction}% (${formatBytes(stats.bytesRemoved)} risparmiati)
   Righe rimosse: ${stats.linesRemoved}
`;
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + sizes[i];
}
