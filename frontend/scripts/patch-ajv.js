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

// 2. Patch any remaining ajv-keywords@3 installations with a no-op.
//    ajv-keywords@3 is incompatible with ajv@8 (required for Node 20).
//    npm overrides force schema-utils@4 and ajv-keywords@5, but nested
//    node_modules copies may still exist from packages that bundle their own.
function patchAjvKeywords(dir) {
  const indexPath = path.join(dir, 'index.js');
  if (!fs.existsSync(indexPath)) return;
  const content = fs.readFileSync(indexPath, 'utf8');
  // Only patch v3.x (v5 is already ajv@8 compatible)
  const pkgPath = path.join(dir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const major = parseInt((pkg.version || '0').split('.')[0], 10);
    if (major >= 5) return; // v5+ is fine
  }
  if (content.includes('Patched: no-op')) return; // already patched
  fs.writeFileSync(indexPath, `'use strict';
// Patched: no-op for ajv v8 compatibility (v3 is not compatible with ajv@8)
module.exports = function(ajv) { return ajv; };
module.exports.get = function() { return []; };
`);
  console.log('Patched ajv-keywords at:', dir);
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
