/** Tiny deterministic bundler for this project's named ES modules. No dependencies. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataURL = file => `data:${({ '.png': 'image/png', '.svg': 'image/svg+xml' })[extname(file)]};base64,${readFileSync(file).toString('base64')}`;
const emitted = new Set(), modules = [];
function bundle(file) {
  const id = relative(root, file).replaceAll('\\', '/');
  if (emitted.has(id)) return id;
  emitted.add(id);
  const exports = [];
  let source = readFileSync(file, 'utf8').replace(/^import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"];?\s*$/gm, (_, names, path) => {
    const dependency = bundle(resolve(dirname(file), path));
    return `const { ${names.trim()} } = __modules[${JSON.stringify(dependency)}];`;
  }).replace(/\bexport\s+(const|let|function|class)\s+([\w$]+)/g, (_, kind, name) => { exports.push(name); return `${kind} ${name}`; });
  source = source.replace(/new URL\(['"]([^'"]+)['"],\s*import\.meta\.url\)\.href/g, (_, path) => JSON.stringify(dataURL(resolve(dirname(file), path))));
  if (/^\s*import\s/m.test(source) || /\bimport\.meta\b/.test(source)) throw new Error(`Unsupported import in ${id}`);
  modules.push(`__modules[${JSON.stringify(id)}] = (() => {\n${source}\nreturn {${exports.join(',')}};\n})();`);
  return id;
}
bundle(resolve(root, 'src/main.mjs'));
let css = ['src/ui.css', 'src/style.css'].map(path => readFileSync(resolve(root, path), 'utf8')).join('\n').replace(/@import[^;]+;/g, '');
css = css.replace(/url\(['"]?([^)'"\s]+)['"]?\)/g, (_, path) => `url('${dataURL(resolve(root, 'src', path))}')`);
let html = readFileSync(resolve(root, 'index.html'), 'utf8')
  .replace('<link rel="stylesheet" href="src/style.css">', `<style>\n${css}\n</style>`)
  .replace('<script type="module" src="src/main.mjs"></script>', `<script>\n(() => { const __modules = Object.create(null);\n${modules.join('\n').replace(/<\/script/gi, '<\\/script')}\n})();\n</script>`)
  .replaceAll('assets/emblem.svg', dataURL(resolve(root, 'assets/emblem.svg')));
mkdirSync(resolve(root, 'dist'), { recursive: true });
const output = resolve(root, 'dist/Ordre_de_Cendre.html');
writeFileSync(output, html);
console.log(`Offline game built: ${relative(root, output)} (${(Buffer.byteLength(html) / 1048576).toFixed(2)} MiB), ${modules.length} modules, no remote dependencies.`);
