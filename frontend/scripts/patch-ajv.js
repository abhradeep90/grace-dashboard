const fs = require('fs');
const path = require('path');

const nodeModules = path.join(__dirname, '..', 'node_modules');

// 1. Replace fork-ts-checker-webpack-plugin with a no-op webpack plugin.
const forkTsDir = path.join(nodeModules, 'fork-ts-checker-webpack-plugin');
const forkTsPkg = path.join(forkTsDir, 'package.json');
if (fs.existsSync(forkTsPkg)) {
  const pkg = JSON.parse(fs.readFileSync(forkTsPkg, 'utf8'));
  const mainFile = path.join(forkTsDir, pkg.main || 'lib/index.js');
  const mainDir = path.dirname(mainFile);
  if (!fs.existsSync(mainDir)) fs.mkdirSync(mainDir, { recursive: true });
  fs.writeFileSync(mainFile, `'use strict';
class ForkTsCheckerWebpackPlugin { apply() {} }
ForkTsCheckerWebpackPlugin.version = '${pkg.version}';
module.exports = ForkTsCheckerWebpackPlugin;
module.exports.default = ForkTsCheckerWebpackPlugin;
`);
  console.log('Replaced fork-ts-checker-webpack-plugin with no-op');
}

// 2. Patch schema-utils/dist/validate.js to replace the ajv-keywords require
//    with an inline no-op. This is the exact call site that crashes:
//      const ajvKeywords = require("ajv-keywords");
//      ajvKeywords(ajv, ["instanceof", "patternRequired"]);
//    We do this instead of (or in addition to) patching the ajv-keywords package
//    itself, because Node.js 20 package exports maps can route require() to a
//    different file than the one we patch via package.json "main".
const schemaUtilsValidate = path.join(nodeModules, 'schema-utils', 'dist', 'validate.js');
if (fs.existsSync(schemaUtilsValidate)) {
  let content = fs.readFileSync(schemaUtilsValidate, 'utf8');
  if (!content.includes('__patched_noop__')) {
    // Replace require("ajv-keywords") with a trivial function so the call on
    // the next lines becomes a harmless no-op.
    const patched = content
      .replace(
        /const\s+ajvKeywords\s*=\s*require\(["']ajv-keywords["']\)/,
        'const ajvKeywords = /* __patched_noop__ */ function() {}'
      )
      // Handle both double-quote and single-quote variants
      .replace(
        /var\s+ajvKeywords\s*=\s*require\(["']ajv-keywords["']\)/,
        'var ajvKeywords = /* __patched_noop__ */ function() {}'
      );
    if (patched !== content) {
      fs.writeFileSync(schemaUtilsValidate, patched);
      console.log('Patched schema-utils/dist/validate.js (replaced ajv-keywords require)');
    } else {
      console.log('schema-utils/dist/validate.js: pattern not matched, dumping context...');
      const idx = content.indexOf('ajv-keywords');
      if (idx !== -1) console.log('  context:', JSON.stringify(content.slice(Math.max(0, idx-30), idx+60)));
    }
  }
}

// 3. Patch every copy of ajv-keywords we can find, resolving the real entry
//    file via the package.json exports/main fields.
const AJV_KEYWORDS_NOOP = `'use strict';
// Patched: no-op for ajv v8 compatibility
module.exports = function ajvKeywords(ajv) { return ajv; };
module.exports.get = function() { return []; };
`;

function resolveCjsEntry(dir) {
  const pkgPath = path.join(dir, 'package.json');
  if (!fs.existsSync(pkgPath)) return null;
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    // Check exports map — Node.js prefers this over "main" in v12+
    const exp = pkg.exports;
    if (exp) {
      // exports can be a string, or object keyed by "."
      const dot = typeof exp === 'string' ? exp : (exp['.'] || null);
      if (dot) {
        // dot can be a string or { require, import, default, ... }
        const cjsRelPath = typeof dot === 'string'
          ? dot
          : (dot.require || dot.node || dot.default || null);
        if (cjsRelPath) {
          return path.join(dir, cjsRelPath.replace(/^\.\//, ''));
        }
      }
    }
    if (pkg.main) return path.join(dir, pkg.main);
  } catch (_) {}
  return path.join(dir, 'index.js');
}

function patchAjvKeywords(dir) {
  // Patch every .js file in the root and dist/ of the package that contains
  // module.exports or exports assignments — cover all possible entry points.
  const candidates = [
    path.join(dir, 'index.js'),
  ];
  const cjsEntry = resolveCjsEntry(dir);
  if (cjsEntry && !candidates.includes(cjsEntry)) candidates.push(cjsEntry);
  // Also patch dist/index.js and dist/cjs/index.js as common locations
  for (const rel of ['dist/index.js', 'dist/cjs/index.js', 'lib/index.js']) {
    const p = path.join(dir, rel);
    if (!candidates.includes(p)) candidates.push(p);
  }

  let patched = false;
  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('Patched: no-op')) continue;
    fs.writeFileSync(filePath, AJV_KEYWORDS_NOOP);
    console.log('Patched ajv-keywords at:', filePath);
    patched = true;
  }
  if (!patched) {
    console.log('ajv-keywords: no patchable files found in', dir);
  }
}

function searchAndPatch(dir, depth) {
  if (depth === 0) return;
  const nmDir = path.join(dir, 'node_modules');
  if (!fs.existsSync(nmDir)) return;

  const target = path.join(nmDir, 'ajv-keywords');
  if (fs.existsSync(target)) patchAjvKeywords(target);

  if (depth > 1) {
    let entries;
    try { entries = fs.readdirSync(nmDir); } catch (e) { return; }
    for (const entry of entries) {
      if (entry.startsWith('.') || entry === 'ajv-keywords') continue;
      const sub = path.join(nmDir, entry);
      try {
        if (fs.statSync(sub).isDirectory()) searchAndPatch(sub, depth - 1);
      } catch (e) {}
    }
  }
}

searchAndPatch(path.join(__dirname, '..'), 4);
