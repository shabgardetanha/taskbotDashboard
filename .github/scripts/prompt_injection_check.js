// .github/scripts/prompt_injection_check.js
const fs = require('fs');

const suspicious = [
  'ignore previous', 'forget instructions', 'dan', 'jailbreak', 'forget rules',
  'ignore the above', 'override instructions'
];

function loadEvent(path) {
  try {
    const raw = fs.readFileSync(path, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

const eventPath = process.argv[2] || process.env.GITHUB_EVENT_PATH;
const event = loadEvent(eventPath);

let combined = '';
if (event) {
  combined += JSON.stringify(event).toLowerCase();
}
if (process.env.PR_DIFF) {
  combined += '\n' + process.env.PR_DIFF.toLowerCase();
}

for (const s of suspicious) {
  if (combined.includes(s)) {
    console.error('Prompt injection detected. PR blocked.');
    console.error(`Pattern matched: "${s}"`);
    process.exit(1);
  }
}

console.log('No prompt injection patterns found.');
process.exit(0);
