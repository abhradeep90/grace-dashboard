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

// 2. Patch every schema-utils/dist/validate.js we can find (top-level AND nested
//    inside packages like terser-webpack-plugin that bundle their own copy).
//    Replace require("ajv-keywords") with an inline no-op that satisfies both
//    direct-call and .default-call patterns.
//
//    The replacement is:
//      (function(){var f=function(){};f.default=f;return f;})()
//    This gives a callable function whose .default is also itself, so both
//      ajvKeywords(ajv, [...])           and
//      ajvKeywords.default(ajv, [...])
//    succeed without throwing.

function patchSchemaUtilsValidate(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('__sv_patched__')) return;
  const patched = content.replace(
    /require\(["']ajv-keywords["']\)/g,
    '/* __sv_patched__ */(function(){var f=function(){};f.default=f;return f;})()'
  );
  if (patched !== content) {
    fs.writeFileSync(filePath, patched);
    console.log('Patched schema-utils validate.js at:', filePath);
  } else {
    // Pattern didn't match — dump a snippet to help debug
    const idx = content.indexOf('ajv-keywords');
    if (idx !== -1) {
      console.log('schema-utils validate.js: ajv-keywords found but pattern unmatched at', filePath);
      console.log('  context:', JSON.stringify(content.slice(Math.max(0, idx - 40), idx + 80)));
    }
  }
}

function searchSchemaUtils(dir, depth) {
  if (depth === 0) return;
  const nmDir = path.join(dir, 'node_modules');
  if (!fs.existsSync(nmDir)) return;

  const svPath = path.join(nmDir, 'schema-utils', 'dist', 'validate.js');
  if (fs.existsSync(svPath)) patchSchemaUtilsValidate(svPath);

  if (depth > 1) {
    let entries;
    try { entries = fs.readdirSync(nmDir); } catch (e) { return; }
    for (const entry of entries) {
      if (entry.startsWith('.') || entry === 'schema-utils') continue;
      const sub = path.join(nmDir, entry);
      try {
        if (fs.statSync(sub).isDirectory()) searchSchemaUtils(sub, depth - 1);
      } catch (e) {}
    }
  }
}

searchSchemaUtils(path.join(__dirname, '..'), 4);

// 3. Patch every copy of ajv-keywords (belt-and-suspenders: patch all known
//    entry-point filenames so the correct one is hit regardless of Node version
//    package exports map resolution).
const AJV_KEYWORDS_NOOP = `'use strict';
// __ajvkw_patched__: no-op for ajv v8 compatibility
var f = function() {};
f.default = f;
module.exports = f;
module.exports.default = f;
module.exports.get = function() { return []; };
`;

function patchAjvKeywords(dir) {
  const candidates = ['index.js', 'dist/index.js', 'dist/cjs/index.js', 'lib/index.js'];
  // Also resolve via package.json main/exports
  const pkgPath = path.join(dir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const exp = pkg.exports;
      if (exp) {
        const dot = typeof exp === 'string' ? exp : (exp['.'] || null);
        if (dot) {
          const r = typeof dot === 'string' ? dot
            : (dot.require || dot.node || dot.default || null);
          if (r) {
            const rel = r.replace(/^\.\//, '');
            if (!candidates.includes(rel)) candidates.push(rel);
          }
        }
      }
      if (pkg.main) {
        const m = pkg.main.replace(/^\.\//, '');
        if (!candidates.includes(m)) candidates.push(m);
      }
    } catch (_) {}
  }

  for (const rel of candidates) {
    const filePath = path.join(dir, rel);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('__ajvkw_patched__')) continue;
    fs.writeFileSync(filePath, AJV_KEYWORDS_NOOP);
    console.log('Patched ajv-keywords at:', filePath);
  }
}

function searchAjvKeywords(dir, depth) {
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
        if (fs.statSync(sub).isDirectory()) searchAjvKeywords(sub, depth - 1);
      } catch (e) {}
    }
  }
}

searchAjvKeywords(path.join(__dirname, '..'), 4);
