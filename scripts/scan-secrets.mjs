import { readFile, readdir } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const explicitRoots = process.argv.slice(2);
const roots = explicitRoots.length
  ? explicitRoots
  : ['apps', 'packages', 'infrastructure', 'scripts'];
const ignored = new Set(['node_modules', '.next', 'dist', '.terraform']);
if (!explicitRoots.length) ignored.add('failure-fixtures');
const textExtensions = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.json',
  '.yaml',
  '.yml',
  '.tf',
  '.tfvars',
]);
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /AKIA[0-9A-Z]{16}/,
  /["']?(?:api[_-]?key|secret[_-]?key|password)["']?\s*[:=]\s*["'][A-Za-z0-9+/=_-]{20,}["']/i,
];
const findings = [];

async function scan(path) {
  const entries = await readdir(path, { withFileTypes: true });
  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    const target = join(path, entry.name);
    if (entry.isDirectory()) await scan(target);
    else if (textExtensions.has(extname(entry.name))) {
      const content = await readFile(target, 'utf8');
      content.split('\n').forEach((line, index) => {
        if (patterns.some((pattern) => pattern.test(line)))
          findings.push(`${relative('.', target)}:${index + 1}`);
      });
    }
  }
}
for (const root of roots) await scan(root);
if (findings.length) {
  console.error(`Potential secrets found:\n${findings.join('\n')}`);
  process.exit(1);
}
console.log('Secret scan passed.');
