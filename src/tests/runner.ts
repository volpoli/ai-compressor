/// <reference types="node" />
import { compressCode } from '../engines/code-compressor';
import assert from 'node:assert';

const tests = [
    {
        name: "CSS: Basic minification and comment stripping",
        input: `.header { \n  margin: 20px; \n  /* comment */ \n  color: red; \n}`,
        check: (out: string) => out.includes('.header{') && !out.includes('/*')
    },
    {
        name: "PHP: Opening and closing tag integrity",
        input: `<?php \n // comment \n echo "Hello"; \n ?>`,
        check: (out: string) => out.startsWith('<?php') && out.endsWith('?>') && out.includes('echo "Hello";')
    },
    {
        name: "HTML: Removing excessive spaces between tags",
        input: `<div class="container"> \n    <p> \n        Text \n    </p> \n </div>`,
        check: (out: string) => out.includes('"><p>') || out.includes('">\n<p>') // Depends on our vertical regex
    },
    {
        name: "JS: Preserving strings with fake comments",
        input: `const url = "https://google.com"; // do not remove this protocol`,
        check: (out: string) => out.includes('https://google.com') && !out.includes('do not remove')
    }
];

async function run() {
    console.log("🧪 AI-Compressor Test Suite (Native Mode)\n");
    let passed = 0;

    for (const test of tests) {
        try {
            const output = compressCode(test.input);
            assert.ok(test.check(output));
            console.log(`✅ ${test.name}`);
            passed++;
        } catch (e) {
            console.error(`❌ ${test.name}`);
            console.error(`   Logic failed. Received output: \n${compressCode(test.input)}`);
        }
    }

    console.log(`\n📊 Result: ${passed}/${tests.length} passed.`);
    process.exit(passed === tests.length ? 0 : 1);
}

run();