#!/bin/bash

# Clean Build Script
# Removes all dist directories from the project (excluding node_modules)

echo "🧹 Cleaning all dist directories..."

# Find and remove all dist directories, excluding node_modules
dist_dirs=$(find . -type d -name "dist" -not -path "*/node_modules/*" 2>/dev/null)

if [ -z "$dist_dirs" ]; then
    echo "✅ No dist directories found to clean"
    exit 0
fi

echo "📁 Found the following dist directories:"
echo "$dist_dirs" | sed 's/^/  /'

echo ""
read -p "🗑️  Remove all these directories? [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "$dist_dirs" | while IFS= read -r dir; do
        if [ -d "$dir" ]; then
            echo "🗑️  Removing $dir"
            rm -rf "$dir"
        fi
    done
    echo "✅ All dist directories removed successfully!"
else
    echo "❌ Operation cancelled"
    exit 1
fi
