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
//    - ajv-keywords@3 crashes with ajv@8 via _formatLimit.js
//    - ajv-keywords@5 drops formatMinimum/formatMaximum keywords entirely,
//      so any caller requesting those by name gets "Unknown keyword" thrown.
//    The no-op accepts any call, registers format-limit keywords as pass-through
//    validators so ajv@8 strict mode doesn't reject schemas that reference them.
const AJV_KEYWORDS_NOOP = `'use strict';
// Patched: no-op for ajv v8 compatibility (all versions replaced)
module.exports = function ajvKeywords(ajv) {
  // Register format-limit keywords as no-ops so ajv@8 strict mode doesn't
  // throw when a schema references formatMinimum / formatMaximum etc.
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

function patchAjvKeywords(dir) {
  const indexPath = path.join(dir, 'index.js');
  if (!fs.existsSync(indexPath)) return;
  const content = fs.readFileSync(indexPath, 'utf8');
  if (content.includes('Patched: no-op')) return; // already patched
  fs.writeFileSync(indexPath, AJV_KEYWORDS_NOOP);
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
