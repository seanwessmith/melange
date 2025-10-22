# Release Guide

## 🚀 Auto-Release (Automatic)

The extension **automatically releases** when you push to `main`!

### How It Works:

1. **Make your changes** and commit them
2. **Bump the version** in both:
   - `package.json`
   - `public/manifest.json`
3. **Push to main**
4. **GitHub Actions automatically:**
   - ✅ Builds the extension
   - ✅ Creates a git tag
   - ✅ Creates a GitHub Release
   - ✅ Attaches the ZIP file
   - ✅ Includes your commit messages in the release notes

### Quick Release Workflow:

```bash
# Use the release script to bump version and commit
bun run release        # patch: 1.0.0 → 1.0.1
bun run release minor  # minor: 1.0.0 → 1.1.0
bun run release major  # major: 1.0.0 → 2.0.0

# Push to main (this triggers the release!)
git push origin main

# That's it! Check GitHub releases in a minute
```

The `bun run release` script will:
1. Bump version in `package.json` and `public/manifest.json`
2. Build the extension locally (to verify it works)
3. Create a commit with the version bump
4. Wait for you to push

### What Gets Released:

Every push to `main` triggers a release **EXCEPT:**
- Changes to `*.md` files (documentation)
- Changes to `.gitignore`
- Changes to `LICENSE`

So you can update the README without triggering a release!

## 📝 Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **Major** (X.0.0): Breaking changes, major new features
- **Minor** (1.X.0): New features, backwards compatible
- **Patch** (1.0.X): Bug fixes, small improvements

### When to Bump:

- **Patch**: Bug fixes, typos, small tweaks
- **Minor**: New features (like adding new dictionary sources)
- **Major**: Breaking changes, complete redesigns

## 🔄 Manual Release (Without Script)

If you prefer to do it manually:

```bash
# 1. Update versions manually
# Edit package.json and public/manifest.json

# 2. Commit the version change
git add package.json public/manifest.json
git commit -m "chore: bump version to 1.2.3"

# 3. Push to main
git push origin main

# GitHub Actions handles the rest!
```

## 🧪 Testing Before Release

**Important:** Test locally before pushing to main!

```bash
# 1. Build and test locally
bun run build

# 2. Load the dist/ folder in Chrome
# Test all features

# 3. Once verified, push to main
git push origin main
```

## 🔧 Hotfix Workflow

For urgent fixes:

```bash
# 1. Make the fix
git add .
git commit -m "fix: critical bug in dictionary popup"

# 2. Bump patch version
bun run release patch

# 3. Push (auto-releases!)
git push origin main
```

## 📦 What Happens on GitHub

When you push to main:

1. **Build Test** runs first (tests the build)
2. **Release** workflow runs:
   - Reads version from `public/manifest.json`
   - Builds the extension
   - Creates a git tag (e.g., `v1.0.1`)
   - Creates GitHub Release with:
     - Release notes with your commit messages
     - `melange-ext-v1.0.1.zip` attachment
     - Installation instructions

Check your releases at:
`https://github.com/yourusername/melange/releases`

## 🎯 Pro Tips

1. **Write good commit messages** - They appear in release notes!
   ```bash
   git commit -m "feat: add dark mode support"
   git commit -m "fix: popup positioning on mobile"
   git commit -m "docs: update installation guide"
   ```

2. **Batch small changes** - Multiple commits, one release
   ```bash
   git commit -m "fix: typo in tooltip"
   git commit -m "fix: loading state color"
   git commit -m "chore: bump version to 1.0.2"
   git push origin main  # One release with all changes
   ```

3. **Test locally first** - Always build and test before pushing

4. **Use conventional commits** - Makes release notes cleaner:
   - `feat:` - New features
   - `fix:` - Bug fixes
   - `docs:` - Documentation
   - `chore:` - Maintenance
   - `refactor:` - Code improvements
   - `perf:` - Performance improvements

## ❓ Troubleshooting

**Release failed?**
- Check the Actions tab on GitHub
- Make sure versions are updated in both files
- Ensure the build passes locally first

**Need to re-release the same version?**
The workflow will automatically delete and recreate the release if it already exists.

**Want to skip a release?**
Only update `.md` files, or add `[skip ci]` to your commit message.
