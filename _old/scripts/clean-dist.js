/**
 * Clean Dist Script
 * Removes all dist directories from the project (excluding node_modules)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Cleaning all dist directories...');

try {
    // Find all dist directories excluding node_modules
    const findCommand = 'find . -type d -name "dist" -not -path "*/node_modules/*" 2>/dev/null';
    const output = execSync(findCommand, { encoding: 'utf8', cwd: process.cwd() });

    const distDirs = output
        .trim()
        .split('\n')
        .filter((dir) => dir.length > 0);

    if (distDirs.length === 0) {
        console.log('✅ No dist directories found to clean');
        process.exit(0);
    }

    console.log('📁 Found the following dist directories:');
    distDirs.forEach((dir) => console.log(`  ${dir}`));

    // Remove all dist directories
    let removedCount = 0;
    distDirs.forEach((dir) => {
        const fullPath = path.resolve(dir);
        if (fs.existsSync(fullPath)) {
            console.log(`🗑️  Removing ${dir}`);
            fs.rmSync(fullPath, { recursive: true, force: true });
            removedCount++;
        }
    });

    console.log(`✅ Removed ${removedCount} dist directories successfully!`);
} catch (error) {
    console.error('❌ Error cleaning dist directories:', error.message);
    process.exit(1);
}
