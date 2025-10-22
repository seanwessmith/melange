#!/usr/bin/env bun

/**
 * Release script to create a new version tag and push it
 * Usage: bun run release.ts [major|minor|patch]
 */

import { $ } from "bun";
import { readFile, writeFile } from "node:fs/promises";

const args = process.argv.slice(2);
const bumpType = args[0] || "patch"; // default to patch

if (!["major", "minor", "patch"].includes(bumpType)) {
  console.error("Usage: bun run release.ts [major|minor|patch]");
  process.exit(1);
}

// Read current version from package.json
const packageJson = JSON.parse(await readFile("package.json", "utf-8"));
const currentVersion = packageJson.version;

// Parse version
const [major, minor, patch] = currentVersion.split(".").map(Number);

// Bump version
let newVersion: string;
switch (bumpType) {
  case "major":
    newVersion = `${major + 1}.0.0`;
    break;
  case "minor":
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case "patch":
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
  default:
    throw new Error("Invalid bump type");
}

console.log(`📦 Bumping version: ${currentVersion} → ${newVersion}`);

// Update package.json
packageJson.version = newVersion;
await writeFile("package.json", JSON.stringify(packageJson, null, 2) + "\n");
console.log("✓ Updated package.json");

// Update manifest.json
const manifestJson = JSON.parse(
  await readFile("public/manifest.json", "utf-8")
);
manifestJson.version = newVersion;
await writeFile(
  "public/manifest.json",
  JSON.stringify(manifestJson, null, 2) + "\n"
);
console.log("✓ Updated public/manifest.json");

// Build the extension
console.log("\n🔨 Building extension...");
await $`bun run build`;

// Git operations
console.log("\n📝 Creating git commit and tag...");
await $`git add package.json public/manifest.json`;
await $`git commit -m "chore: bump version to ${newVersion}"`;
await $`git tag v${newVersion}`;

console.log("\n✅ Release prepared!");
console.log(
  `\n🚀 To publish, run: git push origin main && git push origin v${newVersion}`
);
console.log(`\nOr push everything at once: git push origin main --tags`);
