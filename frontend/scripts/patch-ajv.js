const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname, '..', 'node_modules',
  'fork-ts-checker-webpack-plugin', 'node_modules',
  'ajv-keywords', 'keywords', '_formatLimit.js'
);

if (fs.existsSync(filePath)) {
  // Replace entire file with a no-op - this is a JS project, TS format checking not needed
  fs.writeFileSync(filePath, 'module.exports = function() {};\n');
  console.log('Patched _formatLimit.js with no-op');
} else {
  console.log('Patch target not found, skipping');
}
