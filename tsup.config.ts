import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/cli.ts'],
    format: ['cjs'],
    minify: true,
    clean: true,
    outDir: 'dist'
});