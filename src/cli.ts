#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { detectFileType } from './utils/detect';
import { copyToClipboard } from './utils/clipboard';
import { compressTextWithStats } from './engines/orchestrator';
import { compressCodeWithStats } from './engines/code-compressor';
import { formatStats } from './utils/stats';
import { loadConfig, mergeConfig, AICompressConfig } from './utils/config';

interface CliOptions extends AICompressConfig {
    file?: string | string[];
    help?: boolean;
}

function parseArgs(args: string[]): CliOptions {
    const options: CliOptions = {
        mode: 'auto',
        output: 'clip',
        verbose: false,
        quiet: false,
        dryRun: false,
        format: 'default',
        recursive: false
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
        else if (arg === '--format') options.format = args[++i] as any;
        else if (arg === '-v' || arg === '--verbose') options.verbose = true;
        else if (arg === '-q' || arg === '--quiet') options.quiet = true;
        else if (arg === '--dry-run') options.dryRun = true;
        else if (arg === '-r' || arg === '--recursive') options.recursive = true;
        else if (arg === '--help' || arg === '-h') options.help = true;
        else if (!options.file) options.file = arg;
    }

    return options;
}

async function processFile(filePath: string, config: AICompressConfig): Promise<void> {
    if (!fs.existsSync(filePath)) {
        if (!config.quiet) console.error("❌ Error: File not found.");
        process.exit(1);
    }

    if (!config.quiet) console.log(`[ai-compress] Analyzing file: ${filePath}`);
    const detectedType = detectFileType(filePath);
    let targetMode = config.mode;

    // Auto mode: block config files (e.g. .env) for security and determine target
    if (targetMode === 'auto') {
        if (detectedType === 'config' || detectedType === 'unknown') {
            if (!config.quiet) console.error(`❌ Error: File type '${detectedType}' detected. API security compromised. Aborting.`);
            process.exit(1);
        }
        targetMode = detectedType as 'text' | 'code';
    }

    // Refactoring Guardrail: Block 'text' mode not just on 'code', but also on 'config' and 'unknown'
    if (targetMode === 'text' && ['code', 'config', 'unknown'].includes(detectedType)) {
        if (!config.quiet) console.error(`\n❌ [SECURITY BLOCK] Attempt to force text engine on '${detectedType}' file type blocked.`);
        process.exit(1);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    let result = { content: '', stats: { originalSize: 0, compressedSize: 0, percentReduction: 0, linesBefore: 0, linesAfter: 0, linesRemoved: 0, bytesRemoved: 0 } };

    try {
        if (targetMode === 'text') {
            if (config.verbose) console.log("-> Starting text engine (Semantic compression)...");
            result = await compressTextWithStats(content);
        } else {
            if (config.verbose) console.log("-> Starting code engine (Safe AST-Free minification)...");
            result = compressCodeWithStats(content, filePath);
        }

        // Handle different output formats
        if (config.format === 'json') {
            const output = {
                file: filePath,
                stats: result.stats,
                content: config.dryRun ? result.content : undefined
            };
            console.log(JSON.stringify(output, null, 2));
            return;
        }

        if (config.format === 'stats-only') {
            console.log(formatStats(result.stats));
            return;
        }

        // Show stats (default format)
        if (!config.quiet) {
            console.log(formatStats(result.stats));
        }

        // Dry-run mode: just preview
        if (config.dryRun) {
            if (!config.quiet) console.log("📋 [DRY-RUN] Output (first 500 characters):");
            console.log(result.content.substring(0, 500) + (result.content.length > 500 ? '...' : ''));
            return;
        }

        if (config.output === 'clip') {
            copyToClipboard(result.content);
        } else {
            const outPath = `${filePath}.compressed`;
            fs.writeFileSync(outPath, result.content, 'utf8');
            if (!config.quiet) console.log(`✅ File saved to: ${outPath}`);
        }
    } catch (error: any) {
        if (!config.quiet) console.error(`❌ Critical error: ${error.message}`);
        process.exit(1);
    }
}

async function processDirectory(dirPath: string, config: AICompressConfig): Promise<void> {
    if (!config.quiet) console.log(`[ai-compress] Processing directory: ${dirPath}`);

    const files = getFilesRecursively(dirPath, config);

    let processed = 0;

    for (const file of files) {
        try {
            // Create a config for this specific file
            const fileConfig = { ...config, recursive: false };
            await processFile(file, fileConfig);
            processed++;

            // For batch processing, add a separator
            if (processed < files.length && !config.quiet) {
                console.log('─'.repeat(50));
            }
        } catch (error) {
            if (!config.quiet) console.warn(`⚠️  Skipped ${file}: ${error}`);
        }
    }

    if (!config.quiet) {
        console.log(`\n📊 Processed ${processed}/${files.length} files.`);
    }
}

function getFilesRecursively(dirPath: string, config: AICompressConfig): string[] {
    const files: string[] = [];

    function scan(dir: string) {
        const items = fs.readdirSync(dir);

        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                // Skip common directories
                if (!['node_modules', '.git', 'dist', 'build', '__pycache__'].includes(item)) {
                    scan(fullPath);
                }
            } else if (stat.isFile()) {
                // Check file size limit
                if (config.maxFileSize && stat.size > config.maxFileSize) {
                    continue;
                }

                // Check exclude patterns
                if (config.exclude) {
                    const relativePath = path.relative(dirPath, fullPath);
                    if (config.exclude.some(pattern => relativePath.includes(pattern))) {
                        continue;
                    }
                }

                // Check include patterns (if specified)
                if (config.include && config.include.length > 0) {
                    const relativePath = path.relative(dirPath, fullPath);
                    if (!config.include.some(pattern => relativePath.includes(pattern))) {
                        continue;
                    }
                }

                // Only include compressible files
                const type = detectFileType(fullPath);
                if (type === 'text' || type === 'code') {
                    files.push(fullPath);
                }
            }
        }
    }

    scan(dirPath);
    return files;
}

async function main() {
    const rawArgs = process.argv.slice(2);
    if (rawArgs.length === 0 || rawArgs.includes('--help') || rawArgs.includes('-h')) {
        console.log(`
Usage: ai-compress <file|directory> [options]

Options:
  -f, --file      Path to the file or directory to compress
  -m, --mode      Compression mode ('text' | 'code'). Default: auto
  -o, --output    Output destination ('clip' | 'file'). Default: clip (clipboard) NOTE: cannot use 'clip' with --recursive
  --format        Output format ('default' | 'json' | 'stats-only'). Default: default
  -v, --verbose   Detailed output with stats and processing info
  -q, --quiet     Minimal output
  --dry-run       Preview without saving/copying
  -r, --recursive Process directories recursively
  -h, --help      Show this help

Configuration:
  The tool automatically searches for configuration files:
  - .aicompress.json
  - .aicompress.yaml
  - .aicompress.yml

Examples:
  ai-compress file.js
  ai-compress src/ --recursive --verbose
  ai-compress document.md --format json
        `);
        process.exit(0);
    }

    // Load config file
    const configFile = loadConfig();
    const cliOptions = parseArgs(rawArgs);
    const file = cliOptions.file; // Extract file before merging
    const config = mergeConfig(cliOptions, configFile);

    if (!file) {
        if (!config.quiet) console.error("❌ Error: Specify a file or directory.");
        process.exit(1);
    }

    if (config.recursive && config.output === 'clip') {
        console.error("❌ Error: Recursive mode cannot be used with clipboard output (-o clip). Use -o file instead to save each compressed file individually.");
        process.exit(1);
    }

    // Handle batch processing
    if (config.recursive && fs.statSync(file as string).isDirectory()) {
        await processDirectory(file as string, config);
    } else {
        await processFile(file as string, config);
    }
}

main();