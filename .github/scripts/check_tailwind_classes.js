// .github/scripts/check_tailwind_classes.js
const fs = require('fs');
const path = require('path');

const forbidden = ['pl-', 'pr-', 'text-left', 'text-right', 'left-', 'right-'];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['.git', 'node_modules', '.next'].includes(e.name)) continue;
      walk(full);
    } else {
      if (/\.(tsx|ts|jsx|js|html|css|mdx?)$/i.test(e.name)) {
        const content = fs.readFileSync(full, 'utf8');
        for (const token of forbidden) {
          if (content.includes(token)) {
            console.error(`FORBIDDEN_TAILWIND_CLASS: "${token}" found in ${full}`);
            process.exit(1);
          }
        }
      }
    }
  }
}

console.log('Scanning repository for forbidden tailwind classes...');
walk(process.cwd());
console.log('Tailwind classes check passed.');
