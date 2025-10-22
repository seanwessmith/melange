# Release Guide

## Quick Release

The easiest way to create a new release:

```bash
# For a patch release (1.0.0 → 1.0.1)
bun run release

# For a minor release (1.0.0 → 1.1.0)
bun run release minor

# For a major release (1.0.0 → 2.0.0)
bun run release major
```

This script will:
1. ✅ Bump the version in `package.json` and `public/manifest.json`
2. ✅ Build the extension
3. ✅ Create a git commit
4. ✅ Create a git tag

Then just push:
```bash
git push origin main --tags
```

## Manual Release

If you prefer to do it manually:

1. **Update version** in both:
   - `package.json`
   - `public/manifest.json`

2. **Build the extension:**
   ```bash
   bun run build
   ```

3. **Commit and tag:**
   ```bash
   git add package.json public/manifest.json
   git commit -m "chore: bump version to X.Y.Z"
   git tag vX.Y.Z
   ```

4. **Push to GitHub:**
   ```bash
   git push origin main
   git push origin vX.Y.Z
   ```

## Auto-Release via GitHub Actions

When you push a tag (e.g., `v1.0.0`), GitHub Actions will automatically:

1. 🔨 Build the extension
2. 📦 Create a release on GitHub
3. 📎 Attach `melange-ext-vX.Y.Z.zip` to the release
4. 📝 Generate release notes

The release will appear at: https://github.com/yourusername/melange/releases

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **Major** (X.0.0): Breaking changes
- **Minor** (1.X.0): New features, backwards compatible
- **Patch** (1.0.X): Bug fixes, backwards compatible

## Testing Before Release

Before creating a release, always:

1. Test locally:
   ```bash
   bun run build
   # Load dist/ folder in Chrome
   ```

2. Test on multiple websites
3. Check console for errors
4. Verify all features work

## Hotfix Release

For urgent fixes:

```bash
# Create a hotfix branch
git checkout -b hotfix/1.0.1

# Make your fix and commit
git add .
git commit -m "fix: critical bug"

# Release
bun run release patch

# Push
git push origin hotfix/1.0.1 --tags

# Merge back to main
git checkout main
git merge hotfix/1.0.1
git push origin main
```

