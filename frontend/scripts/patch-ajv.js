const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname, '..', 'node_modules',
  'fork-ts-checker-webpack-plugin', 'node_modules',
  'ajv-keywords', 'keywords', '_formatLimit.js'
);

if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('PATCHED')) {
    content = content.replace(
      'module.exports = function (ajv) {',
      'module.exports = function (ajv) {\n  if (!ajv._formats) return; // PATCHED'
    );
    fs.writeFileSync(filePath, content);
    console.log('Patched fork-ts-checker-webpack-plugin ajv-keywords');
  }
} else {
  console.log('Patch target not found, skipping');
}
