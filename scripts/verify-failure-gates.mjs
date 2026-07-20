import { spawnSync } from 'node:child_process';

const cases = [
  ['failing test', ['exec', 'vitest', 'run', 'tests/failure-fixtures/failing.test.ts']],
  ['type error', ['exec', 'tsc', '--noEmit', '--strict', '--skipLibCheck', 'tests/failure-fixtures/type-error.ts']],
  ['secret', ['run', 'scan:secrets', '--', 'tests/failure-fixtures/secret']],
  ['invalid migration', ['run', 'validate:migrations', '--', 'tests/failure-fixtures/migrations']],
];
for (const [name, args] of cases) {
  const result = spawnSync('npm', args, { stdio: 'ignore' });
  if (result.status === 0) throw new Error(`Failure gate did not block ${name}.`);
  console.log(`Verified CI blocks: ${name}.`);
}
