const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const consola = require('consola');

/**
 * Build script for Mineflayer extensions
 * Automatically compiles all TypeScript extensions
 */

async function buildExtensions() {
    consola.info('🏗️  Building Mineflayer Extensions...');

    const extensionsDir = path.join(process.cwd(), 'extensions');

    // Check if extensions directory exists
    if (!fs.existsSync(extensionsDir)) {
        consola.info('📁 No extensions directory found, creating...');
        fs.mkdirSync(extensionsDir, { recursive: true });
        consola.success('✅ Extensions directory created');
        return;
    }

    // Get all extension directories
    const extensionDirs = fs
        .readdirSync(extensionsDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

    if (extensionDirs.length === 0) {
        consola.info('📦 No extensions found to build');
        return;
    }

    consola.info(`📦 Found ${extensionDirs.length} extension(s) to build`);

    let built = 0;
    let skipped = 0;

    for (const extensionDir of extensionDirs) {
        const extensionPath = path.join(extensionsDir, extensionDir);
        const tsConfigPath = path.join(extensionPath, 'tsconfig.json');
        const indexTsPath = path.join(extensionPath, 'index.ts');
        const packageJsonPath = path.join(extensionPath, 'package.json');

        // Check if this is a valid TypeScript extension
        if (!fs.existsSync(indexTsPath)) {
            consola.warn(`⚠️  Skipping ${extensionDir}: no index.ts found`);
            skipped++;
            continue;
        }

        try {
            // Create tsconfig.json if it doesn't exist
            if (!fs.existsSync(tsConfigPath)) {
                const tsConfig = {
                    compilerOptions: {
                        target: 'ES2020',
                        module: 'commonjs',
                        lib: ['ES2020'],
                        outDir: './dist',
                        rootDir: './',
                        strict: true,
                        esModuleInterop: true,
                        skipLibCheck: true,
                        forceConsistentCasingInFileNames: true,
                        declaration: true,
                        declarationMap: true,
                        sourceMap: true,
                        moduleResolution: 'node',
                    },
                    include: ['*.ts'],
                    exclude: ['node_modules', 'dist'],
                };

                fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));
                consola.debug(`📝 Created tsconfig.json for ${extensionDir}`);
            }

            // Build the extension
            consola.start(`🔨 Building ${extensionDir}...`);

            process.chdir(extensionPath);
            execSync('npx tsc', { stdio: 'pipe' });

            consola.success(`✅ Built ${extensionDir}`);
            built++;
        } catch (error) {
            consola.error(`❌ Failed to build ${extensionDir}:`, error.message);

            // Show more details if in debug mode
            if (process.env.NODE_ENV === 'development') {
                consola.debug(
                    'Build error details:',
                    error.stdout?.toString() || error.stderr?.toString()
                );
            }
        } finally {
            // Return to project root
            process.chdir(path.join(__dirname, '..'));
        }
    }

    // Summary
    consola.box({
        title: 'Extension Build Summary',
        message: [
            `📦 Total: ${extensionDirs.length} extensions`,
            `✅ Built: ${built} extensions`,
            `⚠️  Skipped: ${skipped} extensions`,
            built > 0 ? '🎉 Build completed successfully!' : '📋 No extensions were built',
        ].join('\n'),
    });
}

// Run the build
buildExtensions().catch((error) => {
    consola.error('❌ Extension build failed:', error);
    process.exit(1);
});
