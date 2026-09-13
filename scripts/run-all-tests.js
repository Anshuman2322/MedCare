#!/usr/bin/env node
// Runs the backend Jest suite and the Playwright E2E suite, merges both
// result sets into one flat, sequential list, and prints a single unified
// pass/fail report. Exits non-zero if anything failed, so this can gate CI.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const workDir = mkdtempSync(path.join(tmpdir(), 'medcare-test-report-'));

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';

function firstLine(text) {
  if (!text) return '';
  return String(text).split('\n')[0].trim();
}

// ---------------------------------------------------------------------------
// 1. Backend: run Jest in server/ with the JSON reporter.
// ---------------------------------------------------------------------------
function runJest() {
  const outputFile = path.join(workDir, 'jest-results.json');
  console.log(`${DIM}Running backend test suite (jest)...${RESET}`);

  const result = spawnSync(
    process.execPath,
    ['--experimental-vm-modules', 'node_modules/jest/bin/jest.js', '--runInBand', '--json', `--outputFile=${outputFile}`],
    { cwd: path.join(ROOT, 'server'), stdio: ['ignore', 'ignore', 'inherit'], encoding: 'utf-8' }
  );

  if (result.error) {
    console.error('Failed to launch Jest:', result.error.message);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(readFileSync(outputFile, 'utf-8'));
  } catch (err) {
    console.error('Could not read Jest JSON output:', err.message);
    process.exit(1);
  }

  const tests = [];
  for (const suite of data.testResults || []) {
    const file = path.relative(ROOT, suite.name || suite.testFilePath || '');
    for (const assertion of suite.assertionResults || []) {
      tests.push({
        suite: 'backend (jest)',
        file,
        name: assertion.fullName || assertion.title,
        status: assertion.status === 'passed' ? 'passed' : assertion.status === 'pending' || assertion.status === 'skipped' ? 'skipped' : 'failed',
        reason: assertion.status !== 'passed' ? firstLine(assertion.failureMessages?.[0]) : '',
      });
    }
  }
  return tests;
}

// ---------------------------------------------------------------------------
// 2. E2E: run Playwright (all projects) with the JSON reporter.
// ---------------------------------------------------------------------------
function flattenPlaywrightSuite(suite, projectFile, out) {
  for (const spec of suite.specs || []) {
    for (const t of spec.tests || []) {
      const result = t.results?.[t.results.length - 1];
      const status = result?.status === 'passed' ? 'passed' : result?.status === 'skipped' ? 'skipped' : 'failed';
      out.push({
        suite: `e2e (${t.projectName})`,
        file: projectFile,
        name: spec.title,
        status,
        reason: status === 'failed' ? firstLine(result?.errors?.[0]?.message || result?.error?.message) : '',
        startTime: result?.startTime,
      });
    }
  }
  for (const nested of suite.suites || []) {
    flattenPlaywrightSuite(nested, nested.file || projectFile, out);
  }
}

function runPlaywright() {
  const outputFile = path.join(workDir, 'playwright-results.json');
  console.log(`${DIM}Running E2E test suite (playwright)...${RESET}`);

  // Invoke the local @playwright/test CLI directly via node rather than
  // through npx/npx.cmd - spawning .cmd shims with spawnSync's default
  // (non-shell) mode fails on Windows (EINVAL), and this avoids needing
  // shell:true entirely.
  const playwrightCli = path.join(ROOT, 'node_modules', '@playwright', 'test', 'cli.js');
  // Capped worker count: the full suite launches 30+ real browser contexts
  // against three dev servers - unbounded parallelism (defaults to CPU
  // count) causes contention-driven timeouts that look like app bugs but
  // aren't (confirmed by re-running the same failing tests in isolation).
  const result = spawnSync(process.execPath, [playwrightCli, 'test', '--reporter=json', '--workers=4'], {
    cwd: ROOT,
    stdio: ['ignore', 'ignore', 'inherit'],
    encoding: 'utf-8',
    env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_FILE: outputFile },
  });

  if (result.error) {
    console.error('Failed to launch Playwright:', result.error.message);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(readFileSync(outputFile, 'utf-8'));
  } catch (err) {
    console.error('Could not read Playwright JSON output:', err.message);
    console.error(`Playwright process exit status: ${result.status}, signal: ${result.signal}`);
    process.exit(1);
  }

  // A global/webServer failure (e.g. a dev server didn't come up in time)
  // aborts the run before any test executes - Playwright reports that here
  // rather than inside `suites`, which would otherwise silently look like
  // "zero E2E tests" instead of a hard failure.
  if (data.errors?.length) {
    console.error('Playwright reported global errors:');
    for (const e of data.errors) console.error(' -', e.message || JSON.stringify(e));
    process.exit(1);
  }

  const tests = [];
  for (const suite of data.suites || []) {
    flattenPlaywrightSuite(suite, suite.file, tests);
  }

  if (tests.length === 0) {
    console.error(`Playwright collected 0 tests (exit status ${result.status}) - treating as a failed run.`);
    process.exit(1);
  }

  // Best-effort chronological order within the E2E run - files/specs run
  // across parallel workers, so real start time is the closest available
  // proxy for "the order tests ran" once inside this suite.
  tests.sort((a, b) => new Date(a.startTime || 0) - new Date(b.startTime || 0));
  return tests;
}

// ---------------------------------------------------------------------------
// 3. Merge + report. Jest runs to completion first, then Playwright - so at
//    the coarse level "in the order tests ran" is satisfied by concatenation:
//    every backend test genuinely finished before any E2E test started.
// ---------------------------------------------------------------------------
const allTests = [...runJest(), ...runPlaywright()];
rmSync(workDir, { recursive: true, force: true });

if (allTests.length === 0) {
  console.error('No tests were collected from either suite.');
  process.exit(1);
}

console.log('');
let passed = 0;
let failed = 0;
let skipped = 0;

allTests.forEach((t, i) => {
  const n = i + 1;
  if (t.status === 'passed') {
    passed += 1;
    console.log(`Test ${n} Pass ${GREEN}✅${RESET} — ${t.name}`);
  } else if (t.status === 'skipped') {
    skipped += 1;
    console.log(`Test ${n} Skip ⏭️  — ${t.name}`);
  } else {
    failed += 1;
    console.log(`Test ${n} Fail ${RED}❌${RESET} — ${t.name}`);
    console.log(`     → ${t.reason || 'no failure message captured'}`);
  }
});

const total = allTests.length;
console.log('───────────────────────────');
console.log(
  skipped > 0
    ? `${passed} passed, ${failed} failed, ${skipped} skipped, ${total} total`
    : `${passed} passed, ${failed} failed, ${total} total`
);

process.exit(failed > 0 ? 1 : 0);
