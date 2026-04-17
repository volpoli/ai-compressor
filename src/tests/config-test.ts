/// <reference types="node" />
import { loadConfig, mergeConfig, findProjectRoot } from '../utils/config';
import { compressCodeWithStats } from '../engines/code-compressor';
import assert from 'node:assert';

interface ConfigTest {
    name: string;
    setup: () => boolean;
    check: (result: boolean) => boolean;
}

const configTests: ConfigTest[] = [
    {
        name: "Config: JSON file loading",
        setup: () => {
            // Test assumes .aicompress.json exists in project root
            const config = loadConfig();
            return config !== null && typeof config === 'object';
        },
        check: (result: boolean) => result
    },
    {
        name: "Config: CLI options merge",
        setup: () => {
            const configFile = { mode: 'text' as const, verbose: false };
            const cliOptions = { mode: 'code' as const, quiet: true };
            const merged = mergeConfig(cliOptions, configFile);
            return merged.mode === 'code' && merged.verbose === false && merged.quiet === true;
        },
        check: (result: boolean) => result
    },
    {
        name: "Config: Project root detection",
        setup: () => {
            const root = findProjectRoot();
            return root !== null && root.includes('ai-compressor');
        },
        check: (result: boolean) => result
    }
];

async function runConfigTests() {
    console.log("🧪 AI-Compressor Config Test Suite\n");
    let passed = 0;

    for (const test of configTests) {
        try {
            const result = test.setup();
            const checkResult = test.check(result);
            assert.ok(checkResult);
            console.log(`✅ ${test.name}`);
            passed++;
        } catch (e) {
            console.error(`❌ ${test.name}`);
            console.error(`   Error: ${(e as Error).message}`);
        }
    }

    console.log(`\n📊 Result: ${passed}/${configTests.length} passed.`);
    process.exit(passed === configTests.length ? 0 : 1);
}

runConfigTests();