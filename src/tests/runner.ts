/// <reference types="node" />
import { compressCode } from '../engines/code-compressor';
import assert from 'node:assert';

const tests = [
    {
        name: "CSS: Minificazione base e stripping commenti",
        input: `.header { \n  margin: 20px; \n  /* commento */ \n  color: red; \n}`,
        check: (out: string) => out.includes('.header{') && !out.includes('/*')
    },
    {
        name: "PHP: Integrità tag di apertura e chiusura",
        input: `<?php \n // commento \n echo "Hello"; \n ?>`,
        check: (out: string) => out.startsWith('<?php') && out.endsWith('?>') && out.includes('echo "Hello";')
    },
    {
        name: "HTML: Rimozione spazi superflui tra tag",
        input: `<div class="container"> \n    <p> \n        Testo \n    </p> \n </div>`,
        check: (out: string) => out.includes('"><p>') || out.includes('">\n<p>') // Dipende dalla nostra regex verticale
    },
    {
        name: "JS: Conservazione stringhe con commenti finti",
        input: `const url = "https://google.com"; // non rimuovere questo protocollo`,
        check: (out: string) => out.includes('https://google.com') && !out.includes('non rimuovere')
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
            console.error(`   Logica fallita. Output ricevuto: \n${compressCode(test.input)}`);
        }
    }

    console.log(`\n📊 Risultato: ${passed}/${tests.length} superati.`);
    process.exit(passed === tests.length ? 0 : 1);
}

run();