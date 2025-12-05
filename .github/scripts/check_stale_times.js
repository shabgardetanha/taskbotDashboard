// .github/scripts/check_stale_times.js
const fs = require('fs');
const path = require('path');

const REQUIRED = {
  tasks: 2 * 60 * 1000,
  subtasks: 2 * 60 * 1000,
  labels: 10 * 60 * 1000,
  workspaces: 5 * 60 * 1000,
  userProfile: 15 * 60 * 1000
};

function walk(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['.git', 'node_modules', '.next'].includes(e.name)) continue;
      files.push(...walk(full));
    } else {
      if (/\.(tsx|ts|jsx|js)$/i.test(e.name)) {
        files.push(full);
      }
    }
  }
  return files;
}

const files = walk(process.cwd());
let violations = [];

for (const f of files) {
  const c = fs.readFileSync(f, 'utf8');
  // naive checks: look for useApiQuery(..., { staleTime: X })
  const regex = /useApiQuery\([^,]*,\s*[^,]*,\s*\{[^}]*staleTime\s*:\s*([0-9_]+)\s*\}/g;
  let m;
  while ((m = regex.exec(c)) !== null) {
    const val = Number(m[1].replace(/_/g,''));
    // not linking which entity, so warn if any staleTime outside expected ranges
    if (val < 60000) {
      violations.push(`${f} has suspiciously low staleTime: ${val}`);
    }
  }
}

if (violations.length) {
  console.error('STALE_TIME_VIOLATIONS:');
  violations.forEach(v=>console.error(v));
  process.exit(1);
}

console.log('Stale time checks passed (basic scan).');
