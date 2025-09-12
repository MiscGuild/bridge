#!/usr/bin/env node

/**
 * Test script for the Mineflayer Extension System
 * Tests extension loading, pattern matching, and message processing
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { consola } from 'consola';

// Mock Bridge class for testing
class MockBridge {
    constructor() {
        this.mineflayer = {
            getBot: () => ({
                chat: (message) => console.log(`[BOT CHAT] ${message}`)
            })
        };
        
        this.discord = {
            client: {
                channels: {
                    cache: new Map()
                }
            }
        };
    }
}

// Import the extension manager
async function loadExtensionManager() {
    try {
        const module = await import('./dist/plugin-system/mineflayer-extension-manager.js');
        const ExtensionManager = module.default || module.MineflayerExtensionManager;
        if (!ExtensionManager) {
            throw new Error('Extension manager not found in module exports');
        }
        return ExtensionManager;
    } catch (error) {
        console.error('Failed to import extension manager:', error);
        process.exit(1);
    }
}

async function runTests() {
    console.log('🧪 Starting Mineflayer Extension System Tests\n');

    // Setup
    const bridge = new MockBridge();
    const ExtensionManager = await loadExtensionManager();
    const manager = new ExtensionManager(bridge);

    // Add extension directory
    const extensionsDir = path.join(process.cwd(), 'extensions');
    manager.addExtensionDirectory(extensionsDir);

    console.log('📁 Extension directory:', extensionsDir);

    try {
        // Test 1: Load Extensions
        console.log('\n🔄 Test 1: Loading Extensions');
        await manager.loadExtensions();
        
        const stats = manager.getExtensionStats();
        console.log(`✅ Loaded ${stats.total} extensions`);
        
        if (stats.total === 0) {
            console.warn('⚠️  No extensions found. Create some extensions first.');
            return;
        }

        // Test 2: Enable Extensions
        console.log('\n🔄 Test 2: Enabling Extensions');
        await manager.enableAllExtensions();
        
        const enabledStats = manager.getExtensionStats();
        console.log(`✅ Enabled ${enabledStats.enabled}/${enabledStats.total} extensions`);
        console.log(`📋 Registered ${enabledStats.chatPatterns} chat patterns`);

        // Test 3: List Extensions
        console.log('\n🔄 Test 3: Extension Details');
        for (const ext of enabledStats.list) {
            console.log(`  📦 ${ext.name} (${ext.id}) v${ext.version} by ${ext.author}`);
            console.log(`     ${ext.description}`);
        }

        // Test 4: Chat Pattern Testing
        console.log('\n🔄 Test 4: Testing Chat Patterns');
        
        const testMessages = [
            'Guild > [MVP+] TestPlayer [MEMBER]: !help',
            'Guild > [VIP] AnotherPlayer [OFFICER]: !stats TestPlayer',
            'From [MVP++] PrivatePlayer: !ping',
            'Party > [MVP] PartyPlayer: hello bot',
            'Guild > [DEFAULT] RandomPlayer [MEMBER]: !unknown command',
            'Officer > [ADMIN] AdminPlayer [GUILDMASTER]: !stats',
        ];

        for (const message of testMessages) {
            console.log(`\n📨 Processing: ${message}`);
            try {
                await manager.processMessage(message);
                console.log('   ✅ Processed successfully');
            } catch (error) {
                console.error('   ❌ Processing failed:', error);
            }
        }

        // Test 5: Health Checks
        console.log('\n🔄 Test 5: Health Checks');
        const healthResults = await manager.runHealthChecks();
        
        for (const [extensionId, result] of Object.entries(healthResults)) {
            const status = result.healthy ? '✅' : '❌';
            console.log(`  ${status} ${extensionId}: ${result.healthy ? 'Healthy' : 'Unhealthy'}`);
            
            if (result.error) {
                console.log(`      Error: ${result.error.message}`);
            }
        }

        // Test 6: Pattern Priority
        console.log('\n🔄 Test 6: Pattern Priority Testing');
        const patterns = manager.getAllChatPatterns();
        const sortedPatterns = patterns.sort((a, b) => a.priority - b.priority);
        
        console.log('📊 Patterns by priority:');
        for (const pattern of sortedPatterns) {
            console.log(`  Priority ${pattern.priority}: ${pattern.id} (${pattern.extensionId})`);
            console.log(`    Pattern: ${pattern.pattern}`);
            if (pattern.description) {
                console.log(`    Description: ${pattern.description}`);
            }
        }

        // Test 7: Extension Management
        console.log('\n🔄 Test 7: Extension Management');
        
        const firstExtension = enabledStats.list[0];
        if (firstExtension) {
            console.log(`🔧 Testing disable/enable for: ${firstExtension.name}`);
            
            // Disable
            await manager.disableExtension(firstExtension.id);
            const disabledStats = manager.getExtensionStats();
            console.log(`✅ Disabled. Enabled count: ${disabledStats.enabled}`);
            
            // Re-enable
            await manager.enableExtension(firstExtension.id);
            const reenabledStats = manager.getExtensionStats();
            console.log(`✅ Re-enabled. Enabled count: ${reenabledStats.enabled}`);
        }

        console.log('\n🎉 All tests completed successfully!');
        
        // Summary
        console.log('\n📊 Final Summary:');
        const finalStats = manager.getExtensionStats();
        console.log(`   Extensions: ${finalStats.enabled}/${finalStats.total} enabled`);
        console.log(`   Chat Patterns: ${finalStats.chatPatterns} registered`);
        console.log(`   Status: System operational ✅`);

    } catch (error) {
        console.error('\n❌ Test failed with error:', error);
        console.error('\nStack trace:', error.stack);
        process.exit(1);
    }
}

// Run tests
runTests().catch(error => {
    console.error('Fatal error during tests:', error);
    process.exit(1);
});
