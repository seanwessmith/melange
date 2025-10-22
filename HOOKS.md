# Git Hooks Guide

## 🪝 Auto-Version Bump on Push

This repo uses a **pre-push hook** that automatically bumps the version when you push to `main`.

### How It Works:

When you run `git push origin main`, the hook:

1. ✅ **Checks** if version has changed since last release
2. 🤖 **Auto-bumps** patch version if unchanged
3. 📝 **Amends** your last commit with version changes
4. 🚀 **Continues** with the push

**You don't need to do anything!** Just commit and push normally.

### Example Workflow:

```bash
# Make your changes
git add .
git commit -m "feat: add new feature"

# Just push! Version will auto-bump
git push origin main

# Behind the scenes:
# - Hook detects version hasn't changed
# - Auto-bumps: 1.0.1 → 1.0.2
# - Amends commit with version changes
# - Pushes everything
# - GitHub Actions creates release!
```

### Manual Version Bump

If you want to control the version bump type:

```bash
# Bump version manually before pushing
bun run release        # patch: 1.0.0 → 1.0.1
bun run release minor  # minor: 1.0.0 → 1.1.0  
bun run release major  # major: 1.0.0 → 2.0.0

# Then push (hook will see version changed and skip)
git push origin main
```

### Bypassing the Hook

If you need to push without version changes (rare):

```bash
git push origin main --no-verify
```

**Note:** This will cause the release to overwrite the previous one.

### What Gets Auto-Bumped:

The hook automatically updates:
- ✅ `package.json` → `"version": "1.0.2"`
- ✅ `public/manifest.json` → `"version": "1.0.2"`

### Troubleshooting

**Hook not running?**
```bash
# Reinstall husky
bun install
bun run prepare
```

**Hook failing?**
```bash
# Check hook is executable
chmod +x .husky/pre-push

# Test the hook manually
./.husky/pre-push
```

**Want to disable?**
```bash
# Temporary: use --no-verify
git push origin main --no-verify

# Permanent: remove the hook
rm .husky/pre-push
```

### How It's Different from Manual Releases

**Before (Manual):**
```bash
git commit -m "feat: new feature"
bun run release          # ← Easy to forget!
git push origin main
```

**Now (Automatic):**
```bash
git commit -m "feat: new feature"
git push origin main     # ← That's it!
```

The hook ensures you **never forget** to bump the version! 🎉

### Version Bump Logic

The hook uses **patch** bumps by default:
- `1.0.0` → `1.0.1` (bug fixes, small changes)

For bigger releases, manually bump before pushing:
- `bun run release minor` → `1.0.0` → `1.1.0` (new features)
- `bun run release major` → `1.0.0` → `2.0.0` (breaking changes)

### New Contributors

If you clone this repo:

1. Install dependencies: `bun install`
2. Hooks install automatically via `prepare` script
3. Start committing - the hook works automatically!

No setup needed! 🚀

