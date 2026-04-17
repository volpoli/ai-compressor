import * as fs from 'fs';
import * as path from 'path';

export interface AICompressConfig {
    mode?: 'text' | 'code' | 'auto';
    output?: 'clip' | 'file';
    verbose?: boolean;
    quiet?: boolean;
    dryRun?: boolean;
    format?: 'default' | 'json' | 'stats-only';
    exclude?: string[];
    include?: string[];
    recursive?: boolean;
    maxFileSize?: number; // in bytes
    preserve?: {
        docs?: boolean;
        comments?: boolean;
        emptyLines?: boolean;
    };
}

const CONFIG_FILES = ['.aicompress.json', '.aicompress.yaml', '.aicompress.yml'];

export function loadConfig(projectRoot?: string): AICompressConfig | null {
    const root = projectRoot || findProjectRoot();

    for (const configFile of CONFIG_FILES) {
        const configPath = path.join(root, configFile);

        if (fs.existsSync(configPath)) {
            try {
                const content = fs.readFileSync(configPath, 'utf8');

                if (configFile.endsWith('.json')) {
                    return JSON.parse(content);
                } else {
                    // Simple YAML parser for basic key-value pairs
                    return parseSimpleYAML(content);
                }
            } catch (error) {
                console.warn(`Warning: Could not parse config file ${configPath}: ${error}`);
            }
        }
    }

    return null;
}

export function findProjectRoot(startPath?: string): string {
    let current = startPath || process.cwd();

    while (current !== path.dirname(current)) {
        // Check for common project markers
        const markers = ['package.json', '.git', 'tsconfig.json', 'pyproject.toml'];
        if (markers.some(marker => fs.existsSync(path.join(current, marker)))) {
            return current;
        }
        current = path.dirname(current);
    }

    return process.cwd(); // fallback
}

function parseSimpleYAML(content: string): AICompressConfig {
    const config: any = {};
    const lines = content.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const colonIndex = trimmed.indexOf(':');
        if (colonIndex === -1) continue;

        const key = trimmed.substring(0, colonIndex).trim();
        let value = trimmed.substring(colonIndex + 1).trim();

        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        // Parse boolean values
        if (value === 'true') value = true as any;
        else if (value === 'false') value = false as any;
        // Parse numbers
        else if (/^\d+$/.test(value)) value = parseInt(value, 10) as any;

        // Handle nested objects (simple case)
        if (key.includes('.')) {
            const [parent, child] = key.split('.');
            if (!config[parent]) config[parent] = {};
            config[parent][child] = value;
        } else {
            config[key] = value;
        }
    }

    return config;
}

export function mergeConfig(cliOptions: Partial<AICompressConfig>, configFile?: AICompressConfig): AICompressConfig {
    return { ...configFile, ...cliOptions };
}