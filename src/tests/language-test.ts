/// <reference types="node" />
import { compressCodeWithStats } from '../engines/code-compressor';
import { detectLanguage } from '../utils/detect';
import assert from 'node:assert';

const languageTests = [
    {
        name: "JavaScript: Commenti e spazi",
        filePath: 'test.js',
        input: `// commento
const x = 1; /* commento */ let y = 2;
function test() { return x + y; }`,
        expectedLanguage: 'javascript',
        check: (result: any) => {
            return !result.content.includes('//') &&
                !result.content.includes('/*') &&
                result.stats.percentReduction > 0;
        }
    },
    {
        name: "TypeScript: Estensioni multiple",
        filePath: 'test.ts',
        input: `const message: string = "hello"; // commento`,
        expectedLanguage: 'typescript',
        check: (result: any) => {
            return !result.content.includes('//') &&
                result.content.includes(': string');
        }
    },
    {
        name: "Python: Preserva indentazione",
        filePath: 'test.py',
        input: `# commento
def hello():
    print("world")
    # altro commento
    return True`,
        expectedLanguage: 'python',
        check: (result: any) => {
            return !result.content.includes('#') &&
                result.content.includes('    print("world")'); // indentazione preservata
        }
    },
    {
        name: "CSS: Proprietà e commenti",
        filePath: 'test.css',
        input: `/* commento */ .header { margin: 20px; color: red; }`,
        expectedLanguage: 'css',
        check: (result: any) => {
            return !result.content.includes('/*') &&
                result.content.includes('.header{margin:20px;color:red;}');
        }
    },
    {
        name: "HTML: Tag e commenti",
        filePath: 'test.html',
        input: `<!-- commento --><div class="test">  <p>Hello</p>  </div>`,
        expectedLanguage: 'html',
        check: (result: any) => {
            return !result.content.includes('<!--') &&
                result.stats.percentReduction > 0;
        }
    },
    {
        name: "JSON: Solo spazi",
        filePath: 'test.json',
        input: `{
  "name": "test",
  "value": 123
}`,
        expectedLanguage: 'json',
        check: (result: any) => {
            return result.content.includes('"name":"test"') &&
                result.content.includes('"value":123');
        }
    },
    {
        name: "Language Detection: Estensioni corrette",
        filePath: 'test.py',
        input: `print("hello")`,
        expectedLanguage: 'python',
        check: (result: any) => {
            const detected = detectLanguage('test.py');
            return detected === 'python';
        }
    }
];

async function runLanguageTests() {
    console.log("🧪 AI-Compressor Language-Specific Test Suite\n");
    let passed = 0;

    for (const test of languageTests) {
        try {
            const result = compressCodeWithStats(test.input, test.filePath);
            assert.ok(test.check(result));
            console.log(`✅ ${test.name}`);
            passed++;
        } catch (e) {
            console.error(`❌ ${test.name}`);
            console.error(`   Errore: ${(e as Error).message}`);
        }
    }

    console.log(`\n📊 Risultato: ${passed}/${languageTests.length} superati.`);
    process.exit(passed === languageTests.length ? 0 : 1);
}

runLanguageTests();