const fs = require('fs');
const path = require('path');

// Replace fork-ts-checker-webpack-plugin with a no-op webpack plugin.
// This is a JS project - TypeScript checking is not needed.
const pluginDir = path.join(__dirname, '..', 'node_modules', 'fork-ts-checker-webpack-plugin');
const pkgPath = path.join(pluginDir, 'package.json');

if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const mainFile = path.join(pluginDir, pkg.main || 'lib/index.js');
  const mainDir = path.dirname(mainFile);

  if (!fs.existsSync(mainDir)) fs.mkdirSync(mainDir, { recursive: true });

  // Write a no-op plugin class
  fs.writeFileSync(mainFile, `
'use strict';
class ForkTsCheckerWebpackPlugin {
  apply() {}
}
ForkTsCheckerWebpackPlugin.version = '${pkg.version}';
module.exports = ForkTsCheckerWebpackPlugin;
module.exports.default = ForkTsCheckerWebpackPlugin;
`);
  console.log('Replaced fork-ts-checker-webpack-plugin with no-op');
} else {
  console.log('fork-ts-checker-webpack-plugin not found, skipping');
}
