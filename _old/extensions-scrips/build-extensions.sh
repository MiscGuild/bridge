#!/bin/bash

echo "🏗️  Building Mineflayer Extension System..."

# Ensure we're in the project root
cd "$(dirname "$0")"

# Check if TypeScript is installed
if ! command -v tsc &> /dev/null; then
    echo "❌ TypeScript compiler (tsc) not found. Installing..."
    npm install -g typescript
fi

# Build the main extension system
echo "📦 Compiling TypeScript files..."
tsc --project tsconfig.json

# Build example extension
if [ -d "extensions/example-stats" ]; then
    echo "📦 Building example extension..."
    cd extensions/example-stats
    
    # Create a simple tsconfig for the extension
    cat > tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": [
    "*.ts"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
EOF
    
    # Compile the extension
    tsc
    
    cd ../..
    echo "✅ Example extension built"
fi

echo "✅ Build completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Run the test script: node test-extensions.mjs"
echo "   2. Start your bot to test the extension system"
echo "   3. Create new extensions with: node src/plugin-system/mineflayer-extension-cli.js create"
