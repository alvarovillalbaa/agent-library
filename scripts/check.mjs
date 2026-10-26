import { readFile, readdir, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const directories = ['src', 'lib', 'convex', 'api', 'scripts'];
const files = [];
async function collect(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    if (item.name === '_generated') continue;
    const path = join(directory, item.name);
    if (item.isDirectory()) await collect(path);
    else files.push(path);
  }
}
for (const directory of directories) await collect(join(root, directory));
for (const path of files.filter(path => path.endsWith('.mjs'))) {
  const result = spawnSync(process.execPath, ['--check', path], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(1);
}
for (const name of ['package.json', 'tsconfig.json', 'convex.json', 'vercel.json']) {
  JSON.parse(await readFile(join(root, name), 'utf8'));
}
for (const name of ['index.html', 'src/main.tsx', 'src/App.tsx', 'convex/schema.ts', 'convex/catalog.ts', 'convex/review.ts', 'lib/catalog.mjs']) {
  if (!(await stat(join(root, name))).size) throw new Error(`Required source is empty: ${name}`);
}
const html = await readFile(join(root, 'index.html'), 'utf8');
if (!html.includes('/src/main.tsx')) throw new Error('The HTML entry does not load the app.');
console.info('ES module syntax, configuration JSON and required source checks passed. This is not runtime or database proof.');
