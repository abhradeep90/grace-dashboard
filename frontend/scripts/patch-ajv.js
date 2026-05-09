const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, '..', 'node_modules',
  'fork-ts-checker-webpack-plugin', 'node_modules', 'ajv-keywords');

// Patch 1: replace _formatLimit.js with no-op
const formatLimitPath = path.join(base, 'keywords', '_formatLimit.js');
if (fs.existsSync(formatLimitPath)) {
  fs.writeFileSync(formatLimitPath, 'module.exports = function() {};\n');
  console.log('Patched _formatLimit.js');
}

// Patch 2: make index.js silently skip unknown keywords instead of throwing
const indexPath = path.join(base, 'index.js');
if (fs.existsSync(indexPath)) {
  let content = fs.readFileSync(indexPath, 'utf8');
  if (!content.includes('PATCHED')) {
    content = content.replace(
      "if (!defFunc) throw new Error('Unknown keyword ' + keyword);",
      "if (!defFunc) return ajv; // PATCHED"
    );
    fs.writeFileSync(indexPath, content);
    console.log('Patched index.js');
  }
}
