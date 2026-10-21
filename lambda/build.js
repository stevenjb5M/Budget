// Bundles each Lambda handler (with its dependencies) into dist/<name>-handler.js
// so lambda-functions.zip is self-contained. Terraform points at dist/<name>-handler.handler.
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const entryPoints = fs
  .readdirSync(path.join(__dirname, 'src'))
  .filter((file) => file.endsWith('-handler.ts'))
  .map((file) => path.join('src', file));

fs.rmSync(path.join(__dirname, 'dist'), { recursive: true, force: true });

esbuild
  .build({
    entryPoints,
    outdir: 'dist',
    bundle: true,
    minify: true,
    sourcemap: false,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    logLevel: 'info',
  })
  .catch(() => process.exit(1));
