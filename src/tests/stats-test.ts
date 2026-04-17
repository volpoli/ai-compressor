/// <reference types="node" />
import { compressCodeWithStats } from '../engines/code-compressor';
import { calculateStats, formatStats } from '../utils/stats';
import assert from 'node:assert';

const statsTests = [
    {
        name: "Stats: Verificazione calcolo percentuale",
        input: `.header { \n  margin: 20px; \n  /* commento */ \n  color: red; \n}`,
        check: (stats: any) => {
            return stats.percentReduction > 0 &&
                stats.bytesRemoved > 0 &&
                stats.linesRemoved >= 0;
        }
    },
    {
        name: "Stats: Verifica riduzione byte",
        input: `const x = 1; // comment\nlet y = 2;`,
        check: (stats: any) => {
            return stats.originalSize > stats.compressedSize;
        }
    },
    {
        name: "Stats: Formato output disponibile",
        input: `const message = "Hello";`,
        check: (stats: any) => {
            const formatted = formatStats(stats);
            return formatted.includes('Riduzione:') && formatted.includes('%');
        }
    }
];

async function runStatsTests() {
    console.log("🧪 AI-Compressor Stats Test Suite\n");
    let passed = 0;

    for (const test of statsTests) {
        try {
            const result = compressCodeWithStats(test.input);
            assert.ok(test.check(result.stats));
            console.log(`✅ ${test.name}`);
            passed++;
        } catch (e) {
            console.error(`❌ ${test.name}`);
            console.error(`   Errore: ${(e as Error).message}`);
        }
    }

    console.log(`\n📊 Risultato: ${passed}/${statsTests.length} superati.`);
    process.exit(passed === statsTests.length ? 0 : 1);
}

runStatsTests();
