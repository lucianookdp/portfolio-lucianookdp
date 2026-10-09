import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KiB = 1024;

// Asset sizes, not Lighthouse scores. Keep headroom small enough to catch regressions.
// Initial JS excludes dynamic imports, including the deferred Three.js scene.
export const budgets = {
  totalJavaScript: { raw: 1200 * KiB, gzip: 360 * KiB },
  initialJavaScript: { raw: 360 * KiB, gzip: 120 * KiB },
  // The 404 page has its own OGL background (~50 KiB). Its measured optimized
  // graph is 365/120.2 KiB; keep a separate ceiling without relaxing the homepages.
  notFoundJavaScript: { raw: 380 * KiB, gzip: 125 * KiB },
  totalCss: { raw: 90 * KiB, gzip: 20 * KiB },
  html: { raw: 190 * KiB, gzip: 45 * KiB }
};

function optionsFrom(args) {
  const options = { dir: path.join(projectRoot, 'dist'), baseline: null, reportOnly: false, json: false };
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--report-only') options.reportOnly = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--dir' || arg === '--baseline') {
      const value = args[++index];
      if (!value || value.startsWith('--')) throw new Error(`${arg} requires a directory.`);
      options[arg === '--dir' ? 'dir' : 'baseline'] = path.resolve(value);
    } else if (arg === '--help') {
      console.log('Usage: node scripts/check-performance-budget.mjs [--dir dist] [--baseline ../baseline-dist] [--report-only] [--json]');
      return null;
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

async function listFiles(root, relative = '') {
  const entries = await readdir(path.join(root, relative), { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    const name = path.posix.join(relative, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Build contains an unsupported symlink: ${name}`);
    if (entry.isDirectory()) files.push(...await listFiles(root, name));
    else if (entry.isFile()) files.push(name);
  }
  return files;
}

const sizeOf = (buffer) => ({ raw: buffer.length, gzip: gzipSync(buffer, { level: 9 }).length });
const sumSizes = (values) => values.reduce((sum, value) => ({ raw: sum.raw + value.raw, gzip: sum.gzip + value.gzip }), { raw: 0, gzip: 0 });
const decodeAttribute = (value) => value.replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&');

function attributes(tag) {
  const result = {};
  const pattern = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  for (const match of tag.matchAll(pattern)) result[match[1].toLowerCase()] = decodeAttribute(match[2] ?? match[3] ?? match[4]);
  return result;
}

// Conservative scanner for Vite/Rollup's emitted ESM, not a general JS parser.
// It handles compact imports, side-effect imports and re-exports. Parentheses
// are excluded, so import(...) is deliberately NOT a static dependency.
// A matching string/comment can overcount; any missing match target fails closed.
// Computed runtime loading cannot be inferred from a file-size budget.
function staticImports(source) {
  const pattern = /\b(?:import|export)\s*(?:[^;'"`()]*?\bfrom\s*)?(['"])([^'"\r\n]+)\1/g;
  return [...source.matchAll(pattern)].map((match) => match[2]);
}

async function inspectBuild(root) {
  if (!(await stat(root)).isDirectory()) throw new Error(`Not a build directory: ${root}`);
  const files = await listFiles(root);
  const htmlFiles = files.filter((name) => name.endsWith('.html'));
  const jsFiles = files.filter((name) => /\.(?:m?js)$/.test(name));
  const cssFiles = files.filter((name) => name.endsWith('.css'));
  if (!htmlFiles.includes('index.html') || !jsFiles.length || !cssFiles.length) {
    throw new Error('Expected a complete Astro build with index.html, JavaScript and CSS files. Run npm run build first.');
  }
  const allNames = new Set(files);
  const buffers = new Map();
  const sizes = new Map();
  for (const file of [...htmlFiles, ...jsFiles, ...cssFiles]) {
    const buffer = await readFile(path.join(root, file));
    buffers.set(file, buffer);
    sizes.set(file, sizeOf(buffer));
  }
  const externalResources = new Set();

  function resolveResource(specifier, importer) {
    if (/^(?:https?:)?\/\//i.test(specifier)) {
      externalResources.add(specifier);
      return null;
    }
    if (/^(?:data|blob):/i.test(specifier)) throw new Error(`Unbudgeted embedded resource in ${importer}: ${specifier.slice(0, 60)}`);
    if (!specifier.startsWith('/') && !specifier.startsWith('.')) {
      throw new Error(`Unresolved bare dependency in ${importer}: ${specifier}`);
    }
    const clean = decodeURIComponent(specifier.split(/[?#]/, 1)[0]);
    const resolved = path.posix.normalize(clean.startsWith('/') ? clean.slice(1) : path.posix.join(path.posix.dirname(importer), clean));
    if (resolved === '..' || resolved.startsWith('../') || !allNames.has(resolved)) {
      throw new Error(`Missing or invalid local resource from ${importer}: ${specifier}`);
    }
    return resolved;
  }

  function addStaticGraph(specifier, importer, visited) {
    const file = resolveResource(specifier, importer);
    if (!file || visited.has(file)) return;
    if (!/\.(?:m?js)$/.test(file)) {
      // Emitted CSS imports have their own total budget; other runtime imports
      // need an explicit metric instead of silently escaping the graph check.
      if (file.endsWith('.css')) return;
      throw new Error(`Unexpected static module type in ${importer}: ${file}`);
    }
    visited.add(file);
    for (const dependency of staticImports(buffers.get(file).toString('utf8'))) addStaticGraph(dependency, file, visited);
  }

  const pages = [];
  for (const file of htmlFiles) {
    const source = buffers.get(file).toString('utf8');
    const modules = new Set();
    const inlineScripts = [];
    const executableTypes = new Set(['', 'module', 'text/javascript', 'application/javascript']);
    for (const match of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
      const attrs = attributes(match[1]);
      if (!executableTypes.has((attrs.type ?? '').toLowerCase())) continue;
      if (attrs.src) addStaticGraph(attrs.src.startsWith('/') || /^[a-z]+:/i.test(attrs.src) ? attrs.src : `./${attrs.src}`, file, modules);
      else if (match[2].trim()) {
        inlineScripts.push(sizeOf(Buffer.from(match[2])));
        if (attrs.type === 'module') {
          for (const dependency of staticImports(match[2])) addStaticGraph(dependency, file, modules);
        }
      }
    }
    // modulepreload is fetched during startup even when its consumer is lazy.
    for (const match of source.matchAll(/<link\b[^>]*>/gi)) {
      const attrs = attributes(match[0]);
      if (attrs.rel === 'modulepreload' && attrs.href) addStaticGraph(attrs.href, file, modules);
    }
    // Astro's runtime uses dynamic imports for islands, but client:load/only
    // islands still execute on entry and belong in this static initial budget.
    for (const match of source.matchAll(/<astro-island\b[^>]*>/gi)) {
      const attrs = attributes(match[0]);
      if (!['load', 'only'].includes(attrs.client)) continue;
      for (const key of ['component-url', 'renderer-url']) {
        if (attrs[key]) addStaticGraph(attrs[key], file, modules);
      }
    }
    const moduleSizes = [...modules].map((module) => sizes.get(module));
    pages.push({
      file,
      html: sizes.get(file),
      initialJavaScript: sumSizes([...moduleSizes, ...inlineScripts]),
      initialModules: [...modules].sort(),
      inlineJavaScript: sumSizes(inlineScripts)
    });
  }
  return {
    directory: root,
    totalJavaScript: sumSizes(jsFiles.map((file) => sizes.get(file))),
    totalCss: sumSizes(cssFiles.map((file) => sizes.get(file))),
    javascriptFileCount: jsFiles.length,
    cssFileCount: cssFiles.length,
    pages,
    externalResources: [...externalResources].sort(),
    largestJavaScript: jsFiles.map((file) => ({ file, ...sizes.get(file) })).sort((a, b) => b.raw - a.raw).slice(0, 8)
  };
}

function violationsFor(report) {
  const failures = [];
  function check(label, actual, limit) {
    for (const encoding of ['raw', 'gzip']) {
      if (actual[encoding] > limit[encoding]) failures.push({ metric: `${label}.${encoding}`, actual: actual[encoding], limit: limit[encoding] });
    }
  }
  check('totalJavaScript', report.totalJavaScript, budgets.totalJavaScript);
  check('totalCss', report.totalCss, budgets.totalCss);
  for (const page of report.pages) {
    check(`${page.file}:initialJavaScript`, page.initialJavaScript, page.file === '404.html' ? budgets.notFoundJavaScript : budgets.initialJavaScript);
    check(`${page.file}:html`, page.html, budgets.html);
  }
  return failures;
}

const formatSize = (bytes) => `${(bytes / KiB).toFixed(1)} KiB`;
const describe = (value) => `${formatSize(value.raw)} raw / ${formatSize(value.gzip)} gzip`;
const difference = (current, previous) => {
  const delta = current - previous;
  return `${delta >= 0 ? '+' : ''}${(delta / KiB).toFixed(1)} KiB${previous ? ` (${(delta / previous * 100).toFixed(1)}%)` : ''}`;
};

function printReport(report, baseline, failures, reportOnly) {
  console.log('Performance budget: build bytes (gzip level 9, per file)');
  console.log(`All JS: ${describe(report.totalJavaScript)}; budget ${describe(budgets.totalJavaScript)}`);
  console.log(`All CSS: ${describe(report.totalCss)}; budget ${describe(budgets.totalCss)}`);
  for (const page of report.pages) {
    console.log(`${page.file}: HTML ${describe(page.html)}; initial JS ${describe(page.initialJavaScript)} (${page.initialModules.length} files + inline scripts)`);
  }
  if (baseline) {
    console.log('\nChange against baseline:');
    for (const metric of ['totalJavaScript', 'totalCss']) {
      console.log(`  ${metric}: ${difference(report[metric].raw, baseline[metric].raw)} raw; ${difference(report[metric].gzip, baseline[metric].gzip)} gzip`);
    }
    for (const page of report.pages) {
      const oldPage = baseline.pages.find((entry) => entry.file === page.file);
      if (oldPage) console.log(`  ${page.file} initial JS: ${difference(page.initialJavaScript.raw, oldPage.initialJavaScript.raw)} raw; ${difference(page.initialJavaScript.gzip, oldPage.initialJavaScript.gzip)} gzip`);
    }
  }
  console.log('\nLargest JS files (all chunks, including lazy and unused emitted chunks):');
  for (const file of report.largestJavaScript) console.log(`  ${file.file}: ${describe(file)}`);
  if (report.externalResources.length) console.log(`\nNot sized (external resources): ${report.externalResources.join(', ')}`);
  console.log('\nInitial JS = script/modulepreload entries + static imports + client:load/only islands + executable inline scripts. Dynamic imports are excluded, even if called immediately. This is not a browser network trace or a Core Web Vitals score.');
  for (const failure of failures) console.log(`EXCEEDED ${failure.metric}: ${formatSize(failure.actual)} > ${formatSize(failure.limit)}`);
  console.log(failures.length ? `${reportOnly ? 'REPORT ONLY' : 'FAIL'}: ${failures.length} budget(s) exceeded.` : 'PASS: all build budgets satisfied.');
}

try {
  const options = optionsFrom(process.argv.slice(2));
  if (options) {
    const report = await inspectBuild(options.dir);
    const baseline = options.baseline ? await inspectBuild(options.baseline) : null;
    const violations = violationsFor(report);
    if (options.json) console.log(JSON.stringify({ budgets, report, baseline, violations, reportOnly: options.reportOnly }, null, 2));
    else printReport(report, baseline, violations, options.reportOnly);
    if (violations.length && !options.reportOnly) process.exitCode = 1;
  }
} catch (error) {
  console.error(`[performance-budget] ${error.message}`);
  process.exitCode = 1;
}
