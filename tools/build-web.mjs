/** Static hosting build. The offline edition has its own build command. */
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'web-dist');

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
for (const path of ['index.html', 'src', 'assets']) {
  cpSync(resolve(root, path), resolve(output, path), { recursive: true });
}

console.log('Web game built: web-dist/index.html, src/ and assets/. No runtime dependencies.');
