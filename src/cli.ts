#!/usr/bin/env node
import * as fs from 'fs';
import { detectFileType } from './utils/detect';
import { copyToClipboard } from './utils/clipboard';
import { compressText } from './engines/orchestrator';
import { compressCode } from './engines/code-compressor';

interface CliOptions {
    file: string | null;
    mode: 'text' | 'code' | 'auto';
    output: 'clip' | 'file';
}

function parseArgs(args: string[]): CliOptions {
    const options: CliOptions = { file: null, mode: 'auto', output: 'clip' };
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '-f' || arg === '--file') options.file = args[++i];
        else if (arg === '-m' || arg === '--mode') {
            const val = args[++i];
            if (val === 'text' || val === 'code') options.mode = val;
        }
        else if (arg === '-o' || arg === '--output') {
            const val = args[++i];
            if (val === 'file') options.output = val;
        }
        else if (!arg.startsWith('-') && !options.file) options.file = arg;
    }
    return options;
}

async function main() {
    const rawArgs = process.argv.slice(2);
    if (rawArgs.length === 0 || rawArgs.includes('--help') || rawArgs.includes('-h')) {
        console.log(`
Uso: ai-compress <file> [opzioni]

Opzioni:
  -f, --file    Percorso del file da comprimere
  -m, --mode    Modalità ('text' | 'code'). Default: auto
  -o, --output  Destinazione ('clip' | 'file'). Default: clip
        `);
        process.exit(0);
    }

    const config = parseArgs(rawArgs);

    if (!config.file || !fs.existsSync(config.file)) {
        console.error("❌ Errore: File non trovato.");
        process.exit(1);
    }

    console.log(`[ai-compress] Analisi file: ${config.file}`);
    const detectedType = detectFileType(config.file);
    let targetMode = config.mode;

    // Se automatico, blocchiamo i file config (es .env) per sicurezza e determiniamo il target
    if (targetMode === 'auto') {
        if (detectedType === 'config' || detectedType === 'unknown') {
            console.error(`❌ Errore: Il file è di tipo '${detectedType}'. Sicurezza API compromessa. Abbandono.`);
            process.exit(1);
        }
        targetMode = detectedType as 'text' | 'code';
    }

    // Refactoring Guardrail: Blocca 'text' non solo su 'code', ma anche su 'config' e 'unknown'
    if (targetMode === 'text' && ['code', 'config', 'unknown'].includes(detectedType)) {
        console.error(`\n❌ [BLOCCO DI SICUREZZA] Tentativo di forzare il motore testuale su file di tipo '${detectedType}' bloccato.`);
        process.exit(1);
    }

    const content = fs.readFileSync(config.file, 'utf8');
    let result = '';

    try {
        if (targetMode === 'text') {
            result = await compressText(content);
        } else {
            console.log("-> Avvio motore codice (Minificazione Sicura AST-Free)...");
            result = compressCode(content);
        }

        if (config.output === 'clip') {
            copyToClipboard(result);
        } else {
            const outPath = `${config.file}.compressed`;
            fs.writeFileSync(outPath, result, 'utf8');
            console.log(`\n✅ File salvato in: ${outPath}`);
        }
    } catch (error: any) {
        console.error(`❌ Errore critico: ${error.message}`);
        process.exit(1);
    }
}

main();