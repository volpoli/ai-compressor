#!/usr/bin/env node
import * as fs from 'fs';
import { detectFileType } from './utils/detect';
import { copyToClipboard } from './utils/clipboard';
import { compressTextWithStats } from './engines/orchestrator';
import { compressCodeWithStats } from './engines/code-compressor';
import { formatStats } from './utils/stats';

interface CliOptions {
    file: string | null;
    mode: 'text' | 'code' | 'auto';
    output: 'clip' | 'file';
    verbose: boolean;
    quiet: boolean;
    dryRun: boolean;
}

function parseArgs(args: string[]): CliOptions {
    const options: CliOptions = {
        file: null,
        mode: 'auto',
        output: 'clip',
        verbose: false,
        quiet: false,
        dryRun: false
    };

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
        else if (arg === '-v' || arg === '--verbose') options.verbose = true;
        else if (arg === '-q' || arg === '--quiet') options.quiet = true;
        else if (arg === '--dry-run') options.dryRun = true;
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
  -f, --file      Percorso del file da comprimere
  -m, --mode      Modalità ('text' | 'code'). Default: auto
  -o, --output    Destinazione ('clip' | 'file'). Default: clip
  -v, --verbose   Output dettagliato
  -q, --quiet     Output minimo
  --dry-run       Anteprima senza salvare/copiare
        `);
        process.exit(0);
    }

    const config = parseArgs(rawArgs);

    if (!config.file || !fs.existsSync(config.file)) {
        if (!config.quiet) console.error("❌ Errore: File non trovato.");
        process.exit(1);
    }

    if (!config.quiet) console.log(`[ai-compress] Analisi file: ${config.file}`);
    const detectedType = detectFileType(config.file);
    let targetMode = config.mode;

    // Se automatico, blocchiamo i file config (es .env) per sicurezza e determiniamo il target
    if (targetMode === 'auto') {
        if (detectedType === 'config' || detectedType === 'unknown') {
            if (!config.quiet) console.error(`❌ Errore: Il file è di tipo '${detectedType}'. Sicurezza API compromessa. Abbandono.`);
            process.exit(1);
        }
        targetMode = detectedType as 'text' | 'code';
    }

    // Refactoring Guardrail: Blocca 'text' non solo su 'code', ma anche su 'config' e 'unknown'
    if (targetMode === 'text' && ['code', 'config', 'unknown'].includes(detectedType)) {
        if (!config.quiet) console.error(`\n❌ [BLOCCO DI SICUREZZA] Tentativo di forzare il motore testuale su file di tipo '${detectedType}' bloccato.`);
        process.exit(1);
    }

    const content = fs.readFileSync(config.file, 'utf8');
    let result = { content: '', stats: { originalSize: 0, compressedSize: 0, percentReduction: 0, linesBefore: 0, linesAfter: 0, linesRemoved: 0, bytesRemoved: 0 } };

    try {
        if (targetMode === 'text') {
            if (config.verbose) console.log("-> Avvio motore testo (Compressione semantica)...");
            result = await compressTextWithStats(content);
        } else {
            if (config.verbose) console.log("-> Avvio motore codice (Minificazione Sicura AST-Free)...");
            result = compressCodeWithStats(content);
        }

        // Show stats
        if (!config.quiet) {
            console.log(formatStats(result.stats));
        }

        // Dry-run mode: just preview
        if (config.dryRun) {
            if (!config.quiet) console.log("📋 [DRY-RUN] Output (primo 500 caratteri):");
            console.log(result.content.substring(0, 500) + (result.content.length > 500 ? '...' : ''));
            process.exit(0);
        }

        if (config.output === 'clip') {
            copyToClipboard(result.content);
        } else {
            const outPath = `${config.file}.compressed`;
            fs.writeFileSync(outPath, result.content, 'utf8');
            if (!config.quiet) console.log(`✅ File salvato in: ${outPath}`);
        }
    } catch (error: any) {
        if (!config.quiet) console.error(`❌ Errore critico: ${error.message}`);
        process.exit(1);
    }
}

main();