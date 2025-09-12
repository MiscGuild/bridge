#!/usr/bin/env node

/**
 * Mineflayer Extension Manager CLI
 * 
 * Command-line tool for managing Mineflayer bot extensions
 */

import { Command } from 'commander';
import { consola } from 'consola';
import path from 'path';
import fs from 'fs/promises';
import MineflayerExtensionManager from './mineflayer-extension-manager';
import { MineflayerExtensionTemplateGenerator, ExtensionTemplateOptions } from './mineflayer-extension-template';

const program = new Command();

program
    .name('mineflayer-extensions')
    .description('Mineflayer Extension Manager CLI')
    .version('1.0.0');

// Create command
program
    .command('create <name>')
    .description('Create a new Mineflayer extension from template')
    .option('-i, --id <id>', 'Extension ID (defaults to name)')
    .option('-a, --author <author>', 'Extension author')
    .option('-d, --description <description>', 'Extension description')
    .option('-v, --version <version>', 'Extension version', '1.0.0')
    .option('--features <features>', 'Comma-separated list of features (chatPatterns,commands,events,config)', 'chatPatterns')
    .option('-o, --output <directory>', 'Output directory', './extensions')
    .action(async (name, options) => {
        try {
            const generator = new MineflayerExtensionTemplateGenerator();
            
            const templateOptions: ExtensionTemplateOptions = {
                name,
                id: options.id || name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                author: options.author,
                description: options.description,
                version: options.version,
                features: options.features.split(',').map((f: string) => f.trim())
            };
            
            const success = await generator.generateExtension(options.output, templateOptions);
            
            if (success) {
                consola.success(`Extension "${name}" created successfully!`);
                consola.info(`Location: ${path.join(options.output, templateOptions.id)}`);
                consola.info('Next steps:');
                consola.info(`  cd ${path.join(options.output, templateOptions.id)}`);
                consola.info('  npm install');
                consola.info('  npm run build');
                consola.info('');
                consola.info('Add to your bridge configuration:');
                consola.info(`  extensionManager.loadExtensions(['${options.output}']);`);
            }
        } catch (error) {
            consola.error('Error creating extension:', error);
            process.exit(1);
        }
    });

// List command
program
    .command('list')
    .description('List all extensions')
    .option('-d, --directory <directory>', 'Extension directory', './extensions')
    .option('--enabled-only', 'Show only enabled extensions')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
        try {
            // Note: This would need a Bridge instance in a real scenario
            // For now, we'll just scan the directories
            const extensionsDir = path.resolve(options.directory);
            
            if (!(await pathExists(extensionsDir))) {
                consola.error(`Extension directory does not exist: ${extensionsDir}`);
                process.exit(1);
            }
            
            const entries = await fs.readdir(extensionsDir, { withFileTypes: true });
            const extensions = [];
            
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const manifestPath = path.join(extensionsDir, entry.name, 'package.json');
                    
                    if (await pathExists(manifestPath)) {
                        try {
                            const manifestContent = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
                            const extensionInfo = manifestContent.extension || {};
                            
                            extensions.push({
                                id: extensionInfo.id || entry.name,
                                name: extensionInfo.name || entry.name,
                                version: manifestContent.version || '1.0.0',
                                description: extensionInfo.description || manifestContent.description || '',
                                author: manifestContent.author || 'Unknown',
                                enabled: extensionInfo.enabled !== false,
                                path: path.join(extensionsDir, entry.name)
                            });
                        } catch (error) {
                            consola.warn(`Failed to read manifest for ${entry.name}:`, error);
                        }
                    }
                }
            }
            
            if (options.json) {
                console.log(JSON.stringify(extensions, null, 2));
                return;
            }
            
            consola.info(`Found ${extensions.length} extensions in ${extensionsDir}`);
            
            extensions.forEach((ext: any) => {
                if (options.enabledOnly && !ext.enabled) return;
                
                const status = ext.enabled ? '✅' : '❌';
                consola.log(`${status} ${ext.name} (${ext.id}) v${ext.version}`);
                consola.log(`   ${ext.description}`);
                consola.log(`   Author: ${ext.author}`);
                consola.log(`   Path: ${ext.path}`);
                consola.log('');
            });
            
        } catch (error) {
            consola.error('Error listing extensions:', error);
            process.exit(1);
        }
    });

// Validate command
program
    .command('validate <extension-directory>')
    .description('Validate an extension structure and manifest')
    .action(async (extensionDirectory) => {
        try {
            const extensionDir = path.resolve(extensionDirectory);
            
            if (!(await pathExists(extensionDir))) {
                consola.error(`Extension directory does not exist: ${extensionDir}`);
                process.exit(1);
            }
            
            // Check for required files
            const requiredFiles = ['package.json'];
            const optionalFiles = ['index.ts', 'index.js', 'README.md'];
            
            let allValid = true;
            
            for (const file of requiredFiles) {
                const filePath = path.join(extensionDir, file);
                if (!(await pathExists(filePath))) {
                    consola.error(`❌ Missing required file: ${file}`);
                    allValid = false;
                } else {
                    consola.success(`✅ Found required file: ${file}`);
                }
            }
            
            for (const file of optionalFiles) {
                const filePath = path.join(extensionDir, file);
                if (await pathExists(filePath)) {
                    consola.info(`✅ Found optional file: ${file}`);
                } else {
                    consola.warn(`⚠️  Missing optional file: ${file}`);
                }
            }
            
            // Validate package.json
            const packageJsonPath = path.join(extensionDir, 'package.json');
            if (await pathExists(packageJsonPath)) {
                try {
                    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
                    
                    if (!packageJson.extension) {
                        consola.warn('⚠️  No "extension" field in package.json');
                    } else {
                        const ext = packageJson.extension;
                        
                        if (!ext.id) consola.error('❌ Missing extension.id in package.json');
                        if (!ext.name) consola.error('❌ Missing extension.name in package.json');
                        if (!packageJson.version) consola.error('❌ Missing version in package.json');
                        
                        if (ext.id && ext.name && packageJson.version) {
                            consola.success('✅ Extension manifest is valid');
                        } else {
                            allValid = false;
                        }
                    }
                } catch (error) {
                    consola.error('❌ Invalid package.json:', error);
                    allValid = false;
                }
            }
            
            // Check main file
            const mainFile = path.join(extensionDir, 'index.ts');
            const mainFileJs = path.join(extensionDir, 'index.js');
            
            if (await pathExists(mainFile) || await pathExists(mainFileJs)) {
                consola.success('✅ Main file found');
            } else {
                consola.error('❌ No main file found (index.ts or index.js)');
                allValid = false;
            }
            
            if (allValid) {
                consola.success('🎉 Extension validation passed!');
            } else {
                consola.error('❌ Extension validation failed');
                process.exit(1);
            }
            
        } catch (error) {
            consola.error('Error validating extension:', error);
            process.exit(1);
        }
    });

// Info command
program
    .command('info <extension-directory>')
    .description('Show detailed information about an extension')
    .option('--json', 'Output as JSON')
    .action(async (extensionDirectory, options) => {
        try {
            const extensionDir = path.resolve(extensionDirectory);
            
            if (!(await pathExists(extensionDir))) {
                consola.error(`Extension directory does not exist: ${extensionDir}`);
                process.exit(1);
            }
            
            const packageJsonPath = path.join(extensionDir, 'package.json');
            
            if (!(await pathExists(packageJsonPath))) {
                consola.error('No package.json found in extension directory');
                process.exit(1);
            }
            
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
            const extension = packageJson.extension || {};
            
            const info = {
                id: extension.id || packageJson.name,
                name: extension.name || packageJson.name,
                version: packageJson.version,
                description: extension.description || packageJson.description,
                author: packageJson.author,
                main: packageJson.main || 'index.ts',
                dependencies: extension.dependencies || [],
                features: {
                    chatPatterns: !!extension.chatPatterns,
                    commands: !!extension.commands,
                    events: !!extension.events,
                    config: !!extension.configSchema
                },
                files: {
                    mainExists: await pathExists(path.join(extensionDir, packageJson.main || 'index.ts')),
                    readmeExists: await pathExists(path.join(extensionDir, 'README.md')),
                    configExists: await pathExists(path.join(extensionDir, 'config.ts'))
                }
            };
            
            if (options.json) {
                console.log(JSON.stringify(info, null, 2));
                return;
            }
            
            consola.info(`Extension Information: ${info.name}`);
            consola.log(`ID: ${info.id}`);
            consola.log(`Version: ${info.version}`);
            consola.log(`Author: ${info.author || 'Unknown'}`);
            consola.log(`Description: ${info.description || 'No description'}`);
            consola.log(`Main file: ${info.main}`);
            
            if (info.dependencies.length > 0) {
                consola.log(`Dependencies: ${info.dependencies.join(', ')}`);
            }
            
            consola.log('Features:');
            consola.log(`  Chat Patterns: ${info.features.chatPatterns ? '✅' : '❌'}`);
            consola.log(`  Commands: ${info.features.commands ? '✅' : '❌'}`);
            consola.log(`  Events: ${info.features.events ? '✅' : '❌'}`);
            consola.log(`  Configuration: ${info.features.config ? '✅' : '❌'}`);
            
            consola.log('Files:');
            consola.log(`  Main file exists: ${info.files.mainExists ? '✅' : '❌'}`);
            consola.log(`  README exists: ${info.files.readmeExists ? '✅' : '❌'}`);
            consola.log(`  Config file exists: ${info.files.configExists ? '✅' : '❌'}`);
            
        } catch (error) {
            consola.error('Error getting extension info:', error);
            process.exit(1);
        }
    });

// Helper function
async function pathExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

// Parse arguments
program.parse(process.argv);

export default program;
