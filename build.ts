import { $, build, type BuildOutput } from "bun";
import path from "node:path";
import {
  mkdir,
  readFile,
  readdir,
  cp,
  stat,
  writeFile,
  rm,
} from "node:fs/promises";
import bc, { padEndAnsi, padStartAnsi } from "./src/utils/colors";
import readline from "readline";

const VALID_ENVS = ["dev", "stage", "prod"];

const isProd = process.env.NODE_ENV === "prod";
const isHotReload = process.env.HOT_RELOAD === "true";
const filename = process.env.FILENAME;

// Validate NODE_ENV
if (!process.env.NODE_ENV || !VALID_ENVS.includes(process.env.NODE_ENV)) {
  console.error(`Invalid NODE_ENV. Must be one of: ${VALID_ENVS.join(", ")}.`);
  process.exit(1);
}

/**
 * Formats file sizes in a human-readable manner.
 */
const formatSize = (bytes: number): string => {
  const sizes = ["B", "kB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 B";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
};

/**
 * Returns a colorized file name based on its extension.
 */
const getColoredFileName = (fileName: string): string => {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case ".css":
      return bc.magenta(fileName);
    case ".js":
      return bc.cyan(fileName);
    default:
      return bc.green(fileName);
  }
};

/**
 * Recursively fetches all file paths in a given directory.
 */
const getAllFiles = async (dirPath: string): Promise<string[]> => {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const filesPromises = entries.map(async (entry) => {
    const fullPath = path.join(dirPath, entry.name);
    return entry.isDirectory() ? getAllFiles(fullPath) : [fullPath];
  });
  const files = await Promise.all(filesPromises);
  return files.flat();
};

const buildHtml = async (htmlFiles: string[]) => {
  console.log("Building HTML...", htmlFiles);
  const htmlPromises = htmlFiles.map(async (htmlFile) => {
    Bun.file(htmlFile).text().then((html) => {
      const htmlPath = path.join("dist", path.relative("src", htmlFile));
      Bun.write(htmlPath, html);
    });
  });
  await Promise.all(htmlPromises);
};

/**
 * Compiles SCSS files into CSS using PostCSS.
 */
const compileScss = async (filenames: string[]): Promise<void> => {
  if (filenames.length === 0) return;
  const fileMap = filenames.map((scssFile) => {
    const cssFile = scssFile.replace(".scss", ".css");
    const name = path.basename(cssFile);
    return { scssFile, cssFile: `./dist/${name}` };
  });

  const inputFiles = fileMap.map(({ scssFile }) => scssFile).join(" ");
  const outputFiles = fileMap.map(({ cssFile }) => cssFile).join(" ");

  await $`bun x postcss ${inputFiles} -o ${outputFiles}`;
};

/**
 * Colorizes build time based on magnitude.
 */
const buildColor = (time: string, suffix?: string) => {
  const colors = [bc.green, bc.yellow, bc.red, bc.magenta];
  const num = parseInt(time, 10);
  let colorFunc = colors[0];

  if (num >= 1000 && num < 10000) {
    colorFunc = colors[1];
  } else if (num >= 10000 && num < 100000) {
    colorFunc = colors[2];
  } else if (num >= 100000 && num < 1000000) {
    colorFunc = colors[3];
  }

  return colorFunc(time + (suffix || ""));
};

/**
 * Builds the project using Bun's build API.
 */
const builder = async (entrypoints: string[]): Promise<BuildOutput> => {
  return build({
    entrypoints,
    root: "src",
    outdir: "dist",
    sourcemap: !isHotReload ? "none" : "external",
    packages: "bundle",
    minify: !isHotReload,
    loader: {
      ".ts": "ts",
      ".js": "js",
      ".json": "json",
      ".png": "file",
      ".html": "text",
    },
  });
};

/**
 * Loads the class name cache from disk.
 */
const loadClassNameCache = async (): Promise<Record<string, string[]>> => {
  const CACHE_DIR = ".cache";
  const CACHE_FILE = path.join(CACHE_DIR, "classNames.json");
  await mkdir(CACHE_DIR, { recursive: true });

  try {
    const cacheContent = await readFile(CACHE_FILE, "utf-8");
    return JSON.parse(cacheContent);
  } catch {
    // If no cache or invalid JSON, return empty object
    return {};
  }
};

/**
 * Saves the updated class name cache to disk.
 */
const saveClassNameCache = async (
  cache: Record<string, string[]>
): Promise<void> => {
  const CACHE_DIR = ".cache";
  const CACHE_FILE = path.join(CACHE_DIR, "classNames.json");
  await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");
};

/**
 * Checks if class names have changed since last build.
 */
const hasClassNamesChanged = async (
  filePath: string,
  newClassNames: Set<string>
): Promise<boolean> => {
  const cache = await loadClassNameCache();
  const oldClassNames = new Set(cache[filePath] || []);

  const isEqual =
    newClassNames.size === oldClassNames.size &&
    [...newClassNames].every((cls) => oldClassNames.has(cls));

  // Update cache
  cache[filePath] = [...newClassNames];
  await saveClassNameCache(cache);

  return !isEqual;
};

/**
 * Extracts class names from a TSX file by searching for `className="..."`.
 */
const extractClassNamesFromTSX = async (
  filePath: string
): Promise<Set<string>> => {
  const content = await Bun.file(filePath).text();
  const classNames = new Set<string>();
  const regex = /className\s*=\s*["'`]{1}([^"'`]+)["'`]{1}/gs;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const classes = match[1].split(/\s+/);
    for (const cls of classes) {
      if (cls.trim()) classNames.add(cls);
    }
  }

  return classNames;
};

/**
 * Handles partial builds when a filename is provided.
 */
const handleFilename = async (filename: string) => {
  try {
    const ext = path.extname(filename).toLowerCase();
    const sourceDir = "src";
    const distDir = "dist";

    switch (true) {
      case filename.endsWith(".scss"): {
        // Recompile just the changed SCSS file
        await compileScss([filename]);
        break;
      }

      case filename.endsWith(".tsx"): {
        // Check if class names changed
        const classNames = await extractClassNamesFromTSX(filename);
        const classNamesChanged = await hasClassNamesChanged(
          filename,
          classNames
        );

        // If class names changed, recompile all SCSS
        if (classNamesChanged) {
          const scssFiles = (await getAllFiles(sourceDir)).filter((file) =>
            file.endsWith(".scss")
          );
          await compileScss(scssFiles);
        }

        // Build only changed TSX
        await builder([filename]);
        break;
      }

      case filename.endsWith(".html"): {
        // For HTML files, just copy to dist
        const relativePath = path.relative("src", filename);
        const destPath = path.join(distDir, relativePath);
        await Bun.write(destPath, await Bun.file(filename).text());
        break;
      }

      case filename.startsWith("public"): {
        // For public files, just copy to dist
        const relativePath = path.relative("public", filename);
        const destPath = path.join(distDir, relativePath);
        await Bun.write(destPath, await Bun.file(filename).arrayBuffer());
        break;
      }

      default:
        // For other file types, just rebuild that file
        await builder([filename]);
        break;
    }

    // HMR message
    const outputFile = filename
      .replace("src/", "dist/")
      .replace(/\.ts(x)?$/, ".js");

    const time = new Date().toLocaleTimeString("en-US", { hour12: true });
    const count = process.env.COUNT ? parseInt(process.env.COUNT, 10) + 1 : 1;
    const updateMsg = `${time} ${bc.cyan("[bake]")} ${bc.green(
      "hmr update"
    )} ${outputFile} ${bc.yellow(`(x${count})`)}`;

    if (count) {
      readline.cursorTo(process.stdout, 0);
      readline.clearLine(process.stdout, 0);
      process.stdout.write(updateMsg);
    } else {
      process.stdout.write("\n" + updateMsg);
    }
  } catch (error) {
    console.error("Error handling filename build:", error);
    process.exit(1);
  }
};

/**
 * Handles the full build process when no filename is provided.
 */
const handleFullBuild = async () => {
  console.log(`Using ${process.env.NODE_ENV} environment`);
  const startTime = Bun.nanoseconds();

  // Gather all files
  const allFiles = await getAllFiles("src");
  const buildableExtensions = [
    "js",
    "ts",
    "tsx",
    "jsx",
    "json",
    "png",
    "scss",
    "html",
  ];
  const allBuildable = allFiles.filter((file) =>
    buildableExtensions.includes(path.extname(file).slice(1))
  );

  // Separate TS/JS from SCSS
  const srcFiles = allBuildable.filter(
    (file) =>
      !file.endsWith(".scss") &&
      !file.endsWith(".d.ts") &&
      !file.endsWith(".html")
  );
  const htmlFiles = allBuildable.filter((file) => file.endsWith(".html"));
  const scssFiles = allBuildable.filter((file) => file.endsWith(".scss"));

  // Build TS/JS/TSX + compile SCSS in parallel
  const buildPromises: Array<Promise<BuildOutput | void>> = [builder(srcFiles)];
  if (htmlFiles.length > 0) {
    buildPromises.push(buildHtml(htmlFiles));
  }
  if (scssFiles.length > 0) {
    buildPromises.push(compileScss(scssFiles));
  }

  const [res] = await Promise.all(buildPromises);
  if (!res || !res.success) {
    console.error("Build failed:", res?.logs);
    process.exit(1);
  }

  // Copy static files
  await cp("public", "dist", { dereference: true, recursive: true });

  // Prepare final output
  const distFiles = await getAllFiles("dist");
  const fileInfos = await Promise.all(
    distFiles.map(async (filePath) => {
      const stats = await stat(filePath);
      const relativePath = `dist/${path.relative("dist", filePath)}`;
      return { filePath: relativePath, size: stats.size };
    })
  );

  console.log(
    `${bc.green("✓")} ${
      srcFiles.length + scssFiles.length
    } modules transformed.`
  );

  // Prepare file size logging
  const coloredFilePaths = fileInfos.map((info) => {
    const dirName = path.dirname(info.filePath) + path.sep;
    const baseName = path.basename(info.filePath);
    const coloredPath = bc.black(dirName);
    const coloredName = getColoredFileName(baseName);
    return { coloredPath, coloredName, size: info.size };
  });

  // Find max lengths for padding
  const maxFilePathLength = Math.max(
    ...coloredFilePaths.map(
      (info) => info.coloredPath.length + info.coloredName.length
    )
  );
  const maxSizeLength = Math.max(
    ...coloredFilePaths.map((info) => bc.black(formatSize(info.size)).length)
  );

  // Sort by size descending and log
  const sortedFilePaths = coloredFilePaths.sort((a, b) => b.size - a.size);
  const SPACING = 5;
  for (const info of sortedFilePaths) {
    // Skip map files in the log
    if (info.coloredName.includes(".map")) continue;

    const paddedPath = padEndAnsi(
      `${info.coloredPath}${info.coloredName}`,
      maxFilePathLength + SPACING
    );
    const sizeStr = padStartAnsi(
      bc.black(formatSize(info.size)),
      maxSizeLength
    );
    console.log(paddedPath + sizeStr);
  }

  // Log build time
  const endTime = Bun.nanoseconds();
  const buildTimeMs = ((endTime - startTime) / 1e6).toFixed(0);
  console.log(bc.green(`✓ built in ${buildColor(buildTimeMs, "ms")}`));

  // If not hot reloading, zip the dist directory and log bundle size
  if (!isHotReload) {
    await $`zip -r -q dist.zip dist`;
    const bundleSize = Bun.file("dist.zip").size;
    console.log("Bundle size:", bc.green(formatSize(bundleSize)));
  }
};

// Main execution
if (filename) {
  await handleFilename(filename);
} else {
  await handleFullBuild();
}
