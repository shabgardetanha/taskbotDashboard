#!/usr/bin/env ts-node
/**
 * check_stale_times_tsapi.ts
 *
 * Uses ts-morph (TypeScript Compiler API wrapper) to:
 * - load project tsconfig
 * - find all call expressions for useApiQuery/useApiMutation
 * - resolve options object and staleTime (cross-file)
 * - if staleTime uses STALE_TIMES.X, resolves actual numeric value
 * - compare against REQUIRED mapping and report violations
 *
 * Exit codes:
 *  0 -> pass
 *  1 -> violations found
 */

import fs from "fs";
import glob from "glob";
import path from "path";
import { Node, Project, SyntaxKind, ts } from "ts-morph";

const ROOT = process.cwd();

// authoritative required stale times (ms)
const REQUIRED: Record<string, number> = {
  tasks: 2 * 60 * 1000,
  subtasks: 2 * 60 * 1000,
  labels: 10 * 60 * 1000,
  workspaces: 5 * 60 * 1000,
  userProfile: 15 * 60 * 1000,
};

function findTSConfig(): string | null {
  const p = path.join(ROOT, "tsconfig.json");
  if (fs.existsSync(p)) return p;
  // try package.json "tsconfig" or other common names
  return null;
}

async function main() {
  console.log("TS-API staleTime checker starting...");

  const tsconfig = findTSConfig();
  const project = tsconfig
    ? new Project({ tsConfigFilePath: tsconfig })
    : new Project({ compilerOptions: { allowJs: true, checkJs: false, esModuleInterop: true } });

  // include typical code globs
  const globs = [
    "src/**/*.ts",
    "src/**/*.tsx",
    "src/**/*.js",
    "src/**/*.jsx",
    "packages/**/*.ts",
    "packages/**/*.tsx",
    "*.ts",
    "*.js",
  ];

  const files = new Set<string>();
  for (const g of globs) {
    for (const f of glob.sync(g, { cwd: ROOT, absolute: true, ignore: ["**/node_modules/**", "**/.next/**"] })) {
      files.add(f);
    }
  }

  // Add files to project (if not already included by tsconfig)
  for (const f of files) {
    try {
      project.addSourceFileAtPathIfExists(f);
    } catch (e) {
      // ignore
    }
  }
  // ensure source files are up-to-date
  project.resolveSourceFileDependencies();

  // try to find STALE_TIMES symbol in project
  const staleTimesMap = resolveStaleTimes(project);
  if (Object.keys(staleTimesMap).length > 0) {
    console.log("Resolved STALE_TIMES from project:", staleTimesMap);
  } else {
    console.warn("No STALE_TIMES literal resolved in repo. Member expressions referencing it may not resolve.");
  }

  const violations: Array<any> = [];

  // iterate through all source files and find calls
  const sourceFiles = project.getSourceFiles();
  for (const sf of sourceFiles) {
    // skip generated/large directories
    const filePath = sf.getFilePath();
    if (filePath.includes("/node_modules/") || filePath.includes("/.next/")) continue;

    const calls = sf.getDescendantsOfKind(SyntaxKind.CallExpression);
    for (const call of calls) {
      const expr = call.getExpression();
      let name = "";
      if (Node.isIdentifier(expr)) {
        name = expr.getText();
      } else if (Node.isPropertyAccessExpression(expr)) {
        name = expr.getName();
      }
      if (!["useApiQuery", "useApiMutation"].includes(name)) continue;

      // analyze arguments
      const args = call.getArguments();
      const queryKeyArg = args[0];
      // wrapper signature variations: useApiQuery(queryKey, queryFn, options) or useApiQuery(queryKey, options)
      const optionsArg = args[2] ?? args[1] ?? null;

      const location = `${filePath}:${call.getStartLineNumber()}`;

      // guess entity from queryKeyArg
      const entity = guessEntityFromNode(queryKeyArg);

      // resolve staleTime numeric
      const staleTimeValue = await resolveStaleTime(optionsArg, project, staleTimesMap);

      if (staleTimeValue == null) {
        violations.push({
          file: filePath,
          location,
          reason: "MISSING_STALETIME",
          detail: `No explicit staleTime resolved for call at ${location}`,
          entity,
        });
        continue;
      }

      // validate numeric
      if (entity && REQUIRED[entity]) {
        const expected = REQUIRED[entity];
        if (staleTimeValue !== expected) {
          violations.push({
            file: filePath,
            location,
            reason: "INVALID_STALETIME",
            detail: `entity=${entity} -> got ${staleTimeValue}ms expected ${expected}ms`,
            entity,
          });
        }
      } else {
        // not mapped: ensure it's one of allowed values
        const allowed = new Set(Object.values(REQUIRED));
        if (!allowed.has(staleTimeValue)) {
          violations.push({
            file: filePath,
            location,
            reason: "UNMAPPED_STALETIME",
            detail: `staleTime ${staleTimeValue}ms is not among allowed values`,
            entity: null,
          });
        }
      }
    }
  }

  if (violations.length === 0) {
    console.log("OK: No staleTime violations found.");
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

/**
 * Try to resolve a staleTime from an options node.
 * optionsArg may be:
 * - ObjectLiteralExpression { staleTime: ... }
 * - Identifier (variable reference) -> try to resolve initializer
 * - PropertyAccess like STALE_TIMES.tasks -> resolve from staleTimesMap
 */
async function resolveStaleTime(optionsArg: any, project: Project, staleTimesMap: Record<string, number> | null): Promise<number | null> {
  if (!optionsArg) return null;

  const nodeKind = optionsArg.getKindName();
  // If object literal, find property
  if (optionsArg.getKind() === SyntaxKind.ObjectLiteralExpression) {
    const prop = optionsArg.getProperty("staleTime");
    if (prop) {
      // prop can be PropertyAssignment or ShorthandPropertyAssignment
      if (prop.getKind() === SyntaxKind.PropertyAssignment) {
        const initializer = prop.getInitializer();
        if (!initializer) return null;
        const val = await evaluateNumericExpression(initializer, project, staleTimesMap);
        return val;
      }
    }
    return null;
  }

  // If identifier, try to resolve declaration initializer
  if (optionsArg.getKind() === SyntaxKind.Identifier) {
    const def = optionsArg.getDefinitionNodes();
    for (const d of def) {
      const init = (d as any).getInitializer && (d as any).getInitializer();
      if (init) {
        const val = await evaluateNumericExpression(init, project, staleTimesMap);
        if (val != null) return val;
      }
    }
    return null;
  }

  // If it's a call expression or something else, attempt to evaluate directly
  const val = await evaluateNumericExpression(optionsArg, project, staleTimesMap);
  return val;
}

/**
 * Attempt to numerically evaluate an expression node.
 * Handles:
 * - Numeric literals
 * - Binary expressions (e.g. 2 * 60 * 1000)
 * - Property access STALE_TIMES.tasks -> resolves from staleTimesMap
 * - Identifier referencing a const literal -> resolves via symbol
 */
async function evaluateNumericExpression(node: any, project: Project, staleTimesMap: Record<string, number> | null): Promise<number | null> {
  if (!node) return null;
  const kind = node.getKind();

  // Numeric literal
  if (node.getKind() === SyntaxKind.NumericLiteral) {
    const txt = node.getText();
    return Number(txt);
  }

  // Binary expression
  if (node.getKind() === SyntaxKind.BinaryExpression) {
    try {
      const text = node.getText();
      // safe eval: only digits, whitespace, *, +, -, /, parentheses
      if (/^[0-9\*\+\-\/\(\)\s]+$/.test(text)) {
        // eslint-disable-next-line no-eval
        const res = eval(text);
        return Number(res);
      }
    } catch (e) {
      // ignore
    }
  }

  // Property access: STALE_TIMES.tasks or STALE_TIMES["tasks"]
  if (node.getKind() === SyntaxKind.PropertyAccessExpression || node.getKind() === SyntaxKind.ElementAccessExpression) {
    const left = node.getExpression ? node.getExpression() : null;
    const right = node.getName ? node.getName() : (node.getArgumentExpression ? node.getArgumentExpression() : null);
    if (left && right) {
      const leftText = left.getText();
      if (leftText === "STALE_TIMES" && right) {
        const key = right.getText().replace(/['"`]/g, "");
        if (staleTimesMap && typeof staleTimesMap[key] !== "undefined") {
          return staleTimesMap[key];
        }
      }
    }
  }

  // Identifier: try to resolve symbol and initializer
  if (node.getKind() === SyntaxKind.Identifier) {
    const defs = node.getDefinitionNodes();
    for (const def of defs) {
      // if variable declaration
      if ((def as any).getKind && (def as any).getKind() === SyntaxKind.VariableDeclaration) {
        const init = (def as any).getInitializer && (def as any).getInitializer();
        if (init) {
          const val = await evaluateNumericExpression(init, project, staleTimesMap);
          if (val != null) return val;
        }
      }
      // if property assignment in object literal e.g. const opts = { staleTime: 120000 }
      if ((def as any).getKind && (def as any).getKind() === SyntaxKind.PropertyAssignment) {
        const init = (def as any).getInitializer && (def as any).getInitializer();
        if (init) {
          const val = await evaluateNumericExpression(init, project, staleTimesMap);
          if (val != null) return val;
        }
      }
    }
  }

  // last resort: try to evaluate text if safe numeric expression
  try {
    const t = node.getText();
    if (/^[0-9\*\+\-\/\(\)\s]+$/.test(t)) {
      // eslint-disable-next-line no-eval
      const res = eval(t);
      return Number(res);
    }
  } catch (e) {
    // ignore
  }

  return null;
}

/**
 * Guess entity from first argument (queryKey)
 * handles:
 * - array literal ['tasks', ...]
 * - queryKeys.tasks.byWorkspace(...) member expression
 * - string literal "tasks"
 */
function guessEntityFromNode(node: any): string | null {
  if (!node) return null;
  try {
    const kind = node.getKind();
    if (kind === SyntaxKind.ArrayLiteralExpression) {
      const elems = node.getElements();
      if (elems.length > 0) {
        const first = elems[0];
        if (first && first.getText) {
          const txt = first.getText().replace(/['"`]/g, "");
          if (REQUIRED[txt] !== undefined) return txt;
        }
      }
    }
    if (kind === SyntaxKind.StringLiteral) {
      const t = node.getText().replace(/['"`]/g, "");
      if (REQUIRED[t] !== undefined) return t;
    }
    // member expression: queryKeys.tasks.all or queryKeys.tasks.byWorkspace(...)
    if (kind === SyntaxKind.PropertyAccessExpression || kind === SyntaxKind.CallExpression) {
      const txt = node.getText();
      // crude search for tasks|labels|subtasks|workspaces|userProfile words
      for (const key of Object.keys(REQUIRED)) {
        if (txt.includes(key)) return key;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Resolve STALE_TIMES exported const in project
 * Looks for exported const STALE_TIMES = { ... } and returns a map
 */
function resolveStaleTimes(project: Project): Record<string, number> | null {
  const map: Record<string, number> = {};
  const sfList = project.getSourceFiles();
  for (const sf of sfList) {
    const vars = sf.getVariableDeclarations();
    for (const v of vars) {
      const name = v.getName();
      if (name === "STALE_TIMES") {
        const init = v.getInitializer();
        if (init && init.getKind() === SyntaxKind.ObjectLiteralExpression) {
          const props = init.getProperties();
          for (const p of props) {
            if (p.getKind() === SyntaxKind.PropertyAssignment) {
              const key = (p.getName && p.getName()) || (p.getSymbol && p.getSymbol()?.getName());
              const initializer = (p as any).getInitializer && (p as any).getInitializer();
              if (key && initializer) {
                const val = evaluateNumericExpressionSync(initializer);
                if (val != null) map[key] = val;
              }
            }
          }
          if (Object.keys(map).length > 0) return map;
        }
      }
    }
  }
  return Object.keys(map).length > 0 ? map : null;
}

/** sync evaluator used only for STALE_TIMES literal extraction (simple) */
function evaluateNumericExpressionSync(node: any): number | null {
  try {
    const t = node.getText();
    if (/^[0-9\*\+\-\/\(\)\s]+$/.test(t)) {
      // eslint-disable-next-line no-eval
      const r = eval(t);
      return Number(r);
    }
  } catch {}
  return null;
}

main().catch((err) => {
  console.error("Fatal error in staleTime checker:", err);
  process.exit(2);
});
