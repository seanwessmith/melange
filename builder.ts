import { $ } from "bun";
import { watch } from "node:fs";

// Validate command line arguments.
const args = process.argv.slice(2);
const env = args[0]; // e.g. "dev" or "stage" or "prod"
const VALID_ENVS = ["dev", "stage", "prod"];

if (!env || !VALID_ENVS.includes(env)) {
  console.error(`Usage: bun run builder.ts [${VALID_ENVS.join("|")}]`);
  process.exit(1);
}

// Directories to watch for changes.
const DIRECTORIES = ["src", "public"];

/**
 * Runs the build script in hot-reload mode with the given environment.
 */
const runBuild = async (changedFile?: string, count?: number) => {
  const envVars = {
    HOT_RELOAD: "true",
    NODE_ENV: env,
    COUNT: count?.toString() || "",
  };

  try {
    if (changedFile) {
      // Partial build for changed file
      await $`FILENAME=${changedFile} bun run build.ts`.env(envVars);
    } else {
      // Full build
      await $`bun run build.ts`.env(envVars);
    }
  } catch (error) {
    console.error("Error running build:", error);
  }
};

// Run the build once on startup
await runBuild();

// Set up watchers to rerun the build on file changes
const watchers = DIRECTORIES.map((dir) => {
  let count = 0;
  let prevChangedFilename: string | undefined;
  return watch(
    dir,
    { recursive: true, encoding: "utf-8" },
    async (event, changedFilename) => {
      if (!changedFilename) return;

      // Ignore changes to build scripts themselves (avoid infinite loop)
      if (changedFilename === "build.ts" || changedFilename === "builder.ts") {
        return;
      }

      // If it's a new filename, reset the count
      if (prevChangedFilename !== changedFilename) {
        count = 0;
      } else {
        count++;
      }
      prevChangedFilename = changedFilename;

      const fullPath = `${dir}/${changedFilename}`;
      await runBuild(fullPath, count);
    }
  );
});

// Handle graceful shutdown on SIGINT (Ctrl+C)
process.on("SIGINT", () => {
  console.log("Shutting down watchers...");
  watchers.forEach((watcher) => watcher.close());
  process.exit(0);
});
