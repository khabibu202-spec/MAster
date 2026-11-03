/**
 * Standalone Installer Builder Runner
 * Menjalankan pembangunan paket standalone server-client port 3030
 */

const path = require('path');
const { execSync } = require('child_process');

const cliScript = path.join(__dirname, 'build-installer-cli.cjs');
execSync(`node "${cliScript}" --standalone`, { stdio: 'inherit' });
