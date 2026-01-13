const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const TARGET_DIRS = ["app", "components", "lib", "styles"];
const IGNORE = new Set([path.join(ROOT, "styles", "tokens.ts")]);
const COLOR_REGEX = /#[0-9a-fA-F]{3,8}|(?:rgb|rgba|hsl|hsla)\(/;

function shouldScan(filePath) {
  const ext = path.extname(filePath);
  return [".ts", ".tsx", ".js", ".jsx"].includes(ext);
}

function walk(dir, entries = []) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  items.forEach((item) => {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (["node_modules", ".git", "build", "dist"].includes(item.name)) return;
      walk(fullPath, entries);
      return;
    }
    if (shouldScan(fullPath)) entries.push(fullPath);
  });
  return entries;
}

function checkFile(filePath) {
  if (IGNORE.has(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  const hits = [];
  lines.forEach((line, index) => {
    if (COLOR_REGEX.test(line)) {
      hits.push({ filePath, line: index + 1, text: line.trim() });
    }
  });
  return hits;
}

function main() {
  const files = TARGET_DIRS.flatMap((dir) => walk(path.join(ROOT, dir)));
  const violations = files.flatMap(checkFile);

  if (!violations.length) {
    console.log("Color token check passed.");
    return;
  }

  console.error("Color token check failed. Move colors into styles/tokens.ts:");
  violations.forEach((violation) => {
    console.error(`- ${violation.filePath}:${violation.line} ${violation.text}`);
  });
  process.exit(1);
}

main();
