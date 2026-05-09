const fs = require('fs');
const path = require('path');

const nodeModules = path.join(__dirname, '..', 'node_modules');

// 1. Replace fork-ts-checker-webpack-plugin with a no-op webpack plugin.
//    This is a JS project — TypeScript checking is not needed, and the plugin's
//    internal ajv-keywords chain crashes with ajv v8.
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

// 2. Replace ALL ajv-keywords installations with a no-op.
//    - ajv-keywords@3 crashes with ajv@8 via _formatLimit.js (uses internal _formats API)
//    - ajv-keywords@5 dropped formatMinimum/formatMaximum, so callers requesting those
//      by name get "Unknown keyword" thrown.
//    The no-op accepts any call without throwing, and registers format-limit keywords
//    as empty definitions so ajv@8 strict mode doesn't reject schemas that use them.
const AJV_KEYWORDS_NOOP = `'use strict';
// Patched: no-op for ajv v8 compatibility (all versions replaced)
module.exports = function ajvKeywords(ajv) {
  // Register format-limit keywords as empty definitions so ajv@8 strict mode
  // does not throw when a schema references formatMinimum/formatMaximum etc.
  var fmtKws = ['formatMinimum', 'formatMaximum', 'formatExclusiveMinimum', 'formatExclusiveMaximum'];
  if (ajv && typeof ajv.addKeyword === 'function') {
    fmtKws.forEach(function(kw) {
      try { ajv.addKeyword({ keyword: kw }); } catch (_) {
        try { ajv.addKeyword(kw, {}); } catch (_2) {}
      }
    });
  }
  return ajv;
};
module.exports.get = function() { return []; };
`;

function resolveMainFile(dir) {
  const pkgPath = path.join(dir, 'package.json');
  if (!fs.existsSync(pkgPath)) return path.join(dir, 'index.js');
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    // Node 12+ resolves via "exports" map; check .require sub-condition first
    const exp = pkg.exports;
    if (exp) {
      const dot = exp['.'];
      if (dot) {
        const cjsPath = dot.require || dot.default || (typeof dot === 'string' ? dot : null);
        if (cjsPath) return path.join(dir, cjsPath.replace(/^\.\//, ''));
      }
      if (typeof exp === 'string') return path.join(dir, exp.replace(/^\.\//, ''));
    }
    if (pkg.main) return path.join(dir, pkg.main);
  } catch (_) {}
  return path.join(dir, 'index.js');
}

function patchAjvKeywords(dir) {
  const filePath = resolveMainFile(dir);
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('Patched: no-op')) return; // already patched
  fs.writeFileSync(filePath, AJV_KEYWORDS_NOOP);
  console.log('Patched ajv-keywords at:', filePath);
}

// Search up to 4 levels deep for any nested ajv-keywords copies
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
      } catch (e) { /* ignore permission errors */ }
    }
  }
}

searchAndPatch(path.join(__dirname, '..'), 4);
