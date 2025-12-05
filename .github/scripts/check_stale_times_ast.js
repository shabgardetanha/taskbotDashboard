#!/usr/bin/env node
/**
 * AST-based staleTime checker
 * - Scans project files (.ts, .tsx, .js, .jsx)
 * - Finds calls to useApiQuery/useApiMutation
 * - Extracts options object and looks for staleTime
 * - If staleTime is a numeric literal -> validate against REQUIRED
 * - If staleTime is STALE_TIMES.xxx -> attempt to resolve STALE_TIMES in-repo
 * - If staleTime missing -> report violation
 *
 * Exit code:
 *  0 -> all good
 *  1 -> violations found
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const ROOT = process.cwd();

// REQUIRED staleTimes in milliseconds (authoritative)
const REQUIRED = {
  tasks: 2 * 60 * 1000,
  subtasks: 2 * 60 * 1000,
  labels: 10 * 60 * 1000,
  workspaces: 5 * 60 * 1000,
  userProfile: 15 * 60 * 1000,
};

// file globs to scan
const GLOBS = [
  'src/**/*.ts',
  'src/**/*.tsx',
  'src/**/*.js',
  'src/**/*.jsx',
  'packages/**/*.ts',
  'packages/**/*.tsx',
  '*.js',
  '*.ts',
];

function parseFile(content, filePath) {
  try {
    return parser.parse(content, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx', 'classProperties', 'decorators-legacy'],
    });
  } catch (err) {
    console.error(`Parse error in ${filePath}: ${err.message}`);
    return null;
  }
}

function findSTALERTimesInAST(ast) {
  const res = {};
  traverse(ast, {
    VariableDeclarator(path) {
      const id = path.node.id;
      const init = path.node.init;
      if (id && id.name === 'STALE_TIMES' && init && init.type === 'ObjectExpression') {
        for (const prop of init.properties) {
          if (prop.type === 'ObjectProperty' && prop.key && prop.value) {
            const keyName = prop.key.name || (prop.key.value || null);
            if (!keyName) continue;
            // handle numeric literal
            if (prop.value.type === 'NumericLiteral') {
              res[keyName] = prop.value.value;
            }
            // handle arithmetic like 2 * 60 * 1000
            else {
              try {
                // fallback: generate code and eval (safe-ish for numeric expressions)
                const generated = require('@babel/generator').default(prop.value).code;
                // avoid arbitrary code execution: allow only digits, whitespace, * and parentheses
                if (/^[0-9\*\+\-\s\(\)]+$/.test(generated)) {
                  // eslint-disable-next-line no-eval
                  res[keyName] = eval(generated);
                }
              } catch (e) {
                // ignore
              }
            }
          }
        }
      }
    },
  });
  return res;
}

function gatherSTALERTimesFromRepo() {
  // search for STALE_TIMES declaration in repo files
  const files = glob.sync('**/*.{ts,tsx,js,jsx}', { cwd: ROOT, ignore: ['node_modules/**', '.next/**'] });
  for (const f of files) {
    const full = path.join(ROOT, f);
    let content;
    try {
      content = fs.readFileSync(full, 'utf8');
    } catch (e) {
      continue;
    }
    const ast = parseFile(content, full);
    if (!ast) continue;
    const found = findSTALERTimesInAST(ast);
    if (Object.keys(found).length > 0) {
      return found; // return first match (common pattern)
    }
  }
  return null;
}

// try to resolve STALE_TIMES in repo once
const RESOLVED_STALE = gatherSTALERTimesFromRepo() || {};

// Heuristics: given an argument node for queryKey, guess entity
function guessEntityFromQueryKeyNode(node) {
  if (!node) return null;
  // if it's an array literal like ["tasks","workspace", workspaceId]
  if (node.type === 'ArrayExpression') {
    const el0 = node.elements[0];
    if (el0 && el0.type === 'StringLiteral') {
      return el0.value; // e.g. "tasks"
    }
  }
  // if it's an identifier or member expression referencing queryKeys.tasks...
  if (node.type === 'CallExpression') {
    // e.g. queryKeys.tasks.byWorkspace(...)
    const callee = node.callee;
    if (callee && callee.type === 'MemberExpression') {
      const object = callee.object;
      if (object && object.type === 'MemberExpression') {
        // maybe queryKeys.tasks.byWorkspace
        if (object.property && object.property.name) {
          return object.property.name;
        }
      } else if (object && object.type === 'Identifier') {
        // queryKeys.tasks.byWorkspace -> object.name === queryKeys, callee.property.name === byWorkspace
        if (callee.object && callee.object.property && callee.object.property.name) {
          return callee.object.property.name;
        }
      }
    } else if (callee && callee.type === 'MemberExpression') {
      if (callee.object && callee.object.type === 'Identifier' && callee.object.name === 'queryKeys') {
        if (callee.property && callee.property.name) {
          return callee.property.name; // tasks, labels, etc
        }
      }
    }
  }
  // if it's a member expression: queryKeys.tasks.all
  if (node.type === 'MemberExpression') {
    // find property chain that contains 'tasks' or 'labels' etc
    const names = [];
    let cur = node;
    while (cur && cur.type === 'MemberExpression') {
      if (cur.property && cur.property.type === 'Identifier') names.push(cur.property.name);
      cur = cur.object;
    }
    // also check object if identifier
    if (cur && cur.type === 'Identifier') names.push(cur.name);
    // reverse names
    const rev = names.reverse();
    for (const candidate of rev) {
      if (['tasks', 'labels', 'subtasks', 'workspaces', 'userProfile'].includes(candidate)) return candidate;
    }
  }
  // string literal "tasks" passed directly
  if (node.type === 'StringLiteral') {
    if (['tasks', 'labels', 'subtasks', 'workspaces', 'userProfile'].includes(node.value)) return node.value;
  }
  return null;
}

function extractNumericFromNode(node, filePath) {
  if (!node) return null;
  if (node.type === 'NumericLiteral') return node.value;
  // simple binary expressions like 2 * 60 * 1000
  if (node.type === 'BinaryExpression' || node.type === 'LogicalExpression') {
    try {
      const gen = require('@babel/generator').default(node).code;
      if (/^[0-9\*\+\-\s\(\)]+$/.test(gen)) {
        // eslint-disable-next-line no-eval
        return eval(gen);
      }
    } catch (e) {
      return null;
    }
  }
  // MemberExpression like STALE_TIMES.tasks
  if (node.type === 'MemberExpression') {
    if (node.object && node.object.type === 'Identifier' && node.object.name === 'STALE_TIMES') {
      const prop = node.property;
      const key = prop.type === 'Identifier' ? prop.name : prop.value;
      if (RESOLVED_STALE && typeof RESOLVED_STALE[key] !== 'undefined') {
        return RESOLVED_STALE[key];
      }
    }
  }
  // Identifier referencing a const (try to resolve in-file)
  if (node.type === 'Identifier') {
    // try to find var decl in same file? This requires context; we'll skip deep resolution here.
    return null;
  }
  return null;
}

// main scan
function scanFiles() {
  const files = [];
  for (const g of GLOBS) {
    const found = glob.sync(g, { cwd: ROOT, absolute: true, ignore: ['**/node_modules/**', '**/.next/**'] });
    files.push(...found);
  }
  const violations = [];
  for (const f of files) {
    const content = fs.readFileSync(f, 'utf8');
    const ast = parseFile(content, f);
    if (!ast) continue;

    traverse(ast, {
      enter(path) {
        const n = path.node;
        // look for CallExpression where callee is useApiQuery or useApiMutation
        if (n.type === 'CallExpression') {
          let calleeName = null;
          // handle both identifier and member expression
          if (n.callee.type === 'Identifier') calleeName = n.callee.name;
          else if (n.callee.type === 'MemberExpression' && n.callee.property && n.callee.property.type === 'Identifier') {
            calleeName = n.callee.property.name;
          }
          if (!calleeName) return;
          if (!['useApiQuery', 'useApiMutation'].includes(calleeName)) return;

          // signature: useApiQuery(queryKey, queryFn, options)
          const args = n.arguments || [];
          const queryKeyNode = args[0] || null;
          const optionsNode = args[2] || args[1] || null; // sometimes options are second arg for wrapper variants
          const entityGuess = guessEntityFromQueryKeyNode(queryKeyNode);

          let staleTimeValue = null;
          if (optionsNode && optionsNode.type === 'ObjectExpression') {
            for (const prop of optionsNode.properties) {
              if (prop.type === 'ObjectProperty') {
                const keyName = prop.key.name || (prop.key.value || null);
                if (keyName === 'staleTime') {
                  staleTimeValue = extractNumericFromNode(prop.value, f);
                }
              }
            }
          }

          const location = `${path.hub.file.opts.filename || f}:${n.loc && n.loc.start ? n.loc.start.line : '?'}`;

          if (staleTimeValue === null) {
            // try to detect if options passed as identifier or var - attempt shallow resolve
            let optNodeText = null;
            if (optionsNode && optionsNode.type !== 'ObjectExpression') {
              try {
                optNodeText = require('@babel/generator').default(optionsNode).code;
              } catch (e) { optNodeText = null; }
            }
            violations.push({
              file: f,
              location,
              reason: 'MISSING_STALETIME',
              detail: optNodeText ? `options: ${optNodeText}` : 'no explicit options object with staleTime found',
              entity: entityGuess,
            });
            return;
          }

          // if we have an entity guess, validate against REQUIRED
          if (entityGuess && REQUIRED[entityGuess]) {
            const expected = REQUIRED[entityGuess];
            if (staleTimeValue !== expected) {
              violations.push({
                file: f,
                location,
                reason: 'INVALID_STALETIME',
                detail: `entity=${entityGuess} -> got ${staleTimeValue}ms expected ${expected}ms`,
                entity: entityGuess,
              });
            }
          } else {
            // no entity guessed: just check staleTime is one of allowed values
            const allowedValues = new Set(Object.values(REQUIRED));
            if (!allowedValues.has(staleTimeValue)) {
              violations.push({
                file: f,
                location,
                reason: 'UNMAPPED_STALETIME',
                detail: `staleTime ${staleTimeValue}ms is not among allowed standard values`,
                entity: null,
              });
            }
          }
        }
      },
    });
  }
  return violations;
}

function main() {
  console.log('AST staleTime checker starting...');
  if (Object.keys(RESOLVED_STALE).length > 0) {
    console.log('Resolved STALE_TIMES from repo:', RESOLVED_STALE);
  } else {
    console.log('No STALE_TIMES constant resolved in repo; member expressions referencing it will be flagged if not resolvable.');
  }

  const violations = scanFiles();
  if (violations.length === 0) {
    console.log('OK: No staleTime violations found.');
    process.exit(0);
  }

  console.error(`FOUND ${violations.length} staleTime violation(s):`);
  for (const v of violations) {
    console.error(`- ${v.reason} @ ${v.location}`);
    console.error(`  file: ${v.file}`);
    console.error(`  detail: ${v.detail}`);
    if (v.entity) console.error(`  entity: ${v.entity}`);
  }
  process.exit(1);
}

main();
