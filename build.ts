await Bun.build({
  entrypoints: ["./src/popup/index.tsx", "./src/content/content_script.tsx"],
  outdir: "./dist",
  target: "browser",
});

// Copy static files to the dist directory
const filesToCopy = [
  { src: "./public/manifest.json", dest: "./dist/manifest.json" },
  { src: "./public/background.ts", dest: "./dist/background.js" },
  { src: "./src/index.html", dest: "./dist/index.html" },
  {
    src: "./src/content/hacker_news.css",
    dest: "./dist/content/hacker_news.css",
  },
  {
    src: "./src/content/redux.css",
    dest: "./dist/content/redux.css",
  },
  // Add any additional files or directories you need to copy
];

for (const file of filesToCopy) {
  const fileText = await Bun.file(file.src).text();
  await Bun.write(file.dest, fileText);
}
import icon16Str from "./public/logo.png?resize=16x16&bunimg";
const icon16 = await Bun.file(icon16Str).arrayBuffer();
import icon48Str from "./public/logo.png?resize=48x48&bunimg";
const icon48 = await Bun.file(icon48Str).arrayBuffer();
import icon128Str from "./public/logo.png?resize=128x128&bunimg";
const icon128 = await Bun.file(icon128Str).arrayBuffer();
await Bun.write("./dist/icon16.png", icon16);
await Bun.write("./dist/icon48.png", icon48);
await Bun.write("./dist/icon128.png", icon128);
