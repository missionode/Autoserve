import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.argv[2] ?? 'packages/database/prisma/migrations';
const destructive = [/DROP\s+(?:TABLE|SCHEMA|DATABASE)/i, /TRUNCATE\s+/i, /ALTER\s+TABLE.+DROP\s+COLUMN/is];
const directories = (await readdir(root, { withFileTypes: true })).filter((entry) => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
if (!directories.length) throw new Error('At least one migration directory is required.');
for (const directory of directories) {
  if (!/^\d{12,14}_[a-z0-9_]+$/.test(directory.name)) throw new Error(`Invalid migration name: ${directory.name}`);
  const sql = await readFile(join(root, directory.name, 'migration.sql'), 'utf8');
  if (!sql.trim()) throw new Error(`Empty migration: ${directory.name}`);
  if (destructive.some((pattern) => pattern.test(sql))) throw new Error(`Destructive migration requires explicit corrective review: ${directory.name}`);
}
console.log(`Validated ${directories.length} migration(s).`);
