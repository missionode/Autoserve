import { readFile } from 'node:fs/promises';

const worksheet = await readFile('docs/worksheet.md', 'utf8');
const handoff = await readFile('docs/development/current-handoff.md', 'utf8');
const protocol = await readFile('docs/development/stage-resume-protocol.md', 'utf8');

const worksheetStage = worksheet.match(
  /\*\*Active (?:local )?development stage:\*\* (Stage [^\n]+)/,
)?.[1];
const handoffStage = handoff.match(/^- Active stage: (Stage .+)$/m)?.[1];

const errors = [];
if (!worksheetStage) errors.push('Worksheet active stage is missing.');
if (!handoffStage) errors.push('Handoff active stage is missing.');
if (worksheetStage && handoffStage && worksheetStage !== handoffStage) {
  errors.push(`Active stage mismatch: worksheet="${worksheetStage}" handoff="${handoffStage}".`);
}

const requiredHandoffMarkers = [
  '- Updated:',
  '- Status:',
  '- First unchecked item:',
  '- Last completed checkpoint:',
  '- Next safe action:',
  '- Blockers:',
  '## Stage Ledger',
  '## Last Verified State',
  '## Cold-Start Actions',
  '## Runtime and Boundaries',
  '## Partial Work and Cleanup',
];
for (const marker of requiredHandoffMarkers) {
  if (!handoff.includes(marker)) errors.push(`Handoff field missing: ${marker}`);
}

if (!worksheet.includes('### Phase 4 Completion Summary')) {
  errors.push('Worksheet Phase 4 Completion Summary is missing.');
}
if (!protocol.includes('## Cold-Start Procedure for Any New Session')) {
  errors.push('Stage resume cold-start procedure is missing.');
}
if (!protocol.includes('## End-of-Session Procedure')) {
  errors.push('Stage resume end-of-session procedure is missing.');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Handoff integrity passed for ${worksheetStage}.`);
