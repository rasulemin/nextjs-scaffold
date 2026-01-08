import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm'],
    target: 'node18',
    splitting: false,
    sourcemap: true,
    clean: true,
    shims: true,
    onSuccess: 'chmod +x dist/index.js',
    banner: {
        js: '#!/usr/bin/env node',
    },
})
