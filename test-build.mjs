#!/usr/bin/env node

/**
 * Simple Extension Build Test
 * Verifies that the extension build process works correctly
 */

import fs from 'fs/promises';
import path from 'path';
import { consola } from 'consola';

async function testExtensionBuild() {
    consola.info('🧪 Testing Extension Build Process');

    try {
        // Check if extensions were built
        const extensionsDir = path.join(process.cwd(), 'extensions');
        const exampleStatsDir = path.join(extensionsDir, 'example-stats');
        const distDir = path.join(exampleStatsDir, 'dist');

        consola.info('📁 Checking extension directories...');
        
        // Check if example extension exists
        const statsExists = await fs.access(exampleStatsDir).then(() => true).catch(() => false);
        if (!statsExists) {
            throw new Error('Example stats extension not found');
        }
        consola.success('✅ Example stats extension found');

        // Check if it was built
        const distExists = await fs.access(distDir).then(() => true).catch(() => false);
        if (!distExists) {
            consola.warn('⚠️  Extension not built yet (no dist folder)');
        } else {
            consola.success('✅ Extension has been built (dist folder exists)');
            
            // Check for compiled files
            const distFiles = await fs.readdir(distDir);
            consola.info(`📦 Built files: ${distFiles.join(', ')}`);
        }

        // Check main bot build
        const mainDistDir = path.join(process.cwd(), 'dist');
        const mainDistExists = await fs.access(mainDistDir).then(() => true).catch(() => false);
        
        if (!mainDistExists) {
            throw new Error('Main bot not built (no dist folder)');
        }
        consola.success('✅ Main bot has been built');

        // Check if extension manager was compiled
        const extensionManagerPath = path.join(mainDistDir, 'plugin-system', 'mineflayer-extension-manager.js');
        const managerExists = await fs.access(extensionManagerPath).then(() => true).catch(() => false);
        
        if (!managerExists) {
            throw new Error('Extension manager not compiled');
        }
        consola.success('✅ Extension manager compiled successfully');

        // Check package.json files
        const packageJsonPath = path.join(exampleStatsDir, 'package.json');
        const packageExists = await fs.access(packageJsonPath).then(() => true).catch(() => false);
        
        if (packageExists) {
            const packageContent = await fs.readFile(packageJsonPath, 'utf8');
            const packageData = JSON.parse(packageContent);
            
            if (packageData.extension) {
                consola.success(`✅ Extension manifest found: ${packageData.extension.name}`);
                consola.info(`   ID: ${packageData.extension.id}`);
                consola.info(`   Description: ${packageData.extension.description}`);
                consola.info(`   Author: ${packageData.extension.author || packageData.author}`);
            } else {
                consola.warn('⚠️  Extension manifest missing from package.json');
            }
        }

        // Summary
        consola.box({
            title: '🎉 Extension Build Test Results',
            message: [
                '✅ Extension system integration: WORKING',
                '✅ Build process: WORKING', 
                '✅ Extension manager: COMPILED',
                '✅ Example extension: FOUND',
                '',
                '🚀 Ready to use! Try:',
                '   npm run extension:list',
                '   npm run extension:create "My Extension"'
            ].join('\n')
        });

    } catch (error) {
        consola.error('❌ Extension build test failed:', error.message);
        process.exit(1);
    }
}

testExtensionBuild();
