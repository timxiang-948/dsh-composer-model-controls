// Validates the package and produces a publishable tarball.
//
//   node scripts/package.mjs [--pnpm <path-to-pnpm.mjs>] [--out <dir>]
//
// Output:
//   dist/dsh-composer-model-controls-<version>.tgz   (pnpm pack)
//   dist/dsh-composer-model-controls.tgz             (version-free copy for GitHub Release)
//   dist/CONTENTS.txt                                (tarball file list)
//   dist/SHA256SUMS                                  (checksums)
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const args = process.argv.slice(2);

function argValue(flag, fallback) {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const outDir = path.resolve(root, argValue("--out", "dist"));
const pnpm = argValue(
  "--pnpm",
  process.env.DSH_PNPM || process.env.PNPM_BIN || "pnpm",
);
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

const problems = [];
function requireFile(relative) {
  if (!fs.existsSync(path.join(root, relative))) problems.push("missing file: " + relative);
}

console.log("package: " + pkg.name + "@" + pkg.version);

// 1. required layout
for (const relative of [
  "package.json",
  "lib/client.js",
  "lib/index.js",
  "cordis.patch.yml",
  "README.md",
  "CHANGELOG.md",
  "LICENSE",
  "screenshots.json",
  "assets/screenshot-1.png",
  "assets/screenshot-2.png",
  "assets/screenshot-3.png",
  "assets/screenshot-4.png",
  "assets/icon-180.png",
]) {
  requireFile(relative);
}
if (!pkg.dsh || !pkg.dsh.bundle || !pkg.dsh.bundle.patch) {
  problems.push("package.json must declare dsh.bundle.patch (market requirement)");
}
if (!pkg.dsh || !pkg.dsh.client || pkg.dsh.client.platform !== "web") {
  problems.push("package.json must declare dsh.client.platform = web");
}
if (pkg.name !== "dsh-composer-model-controls") {
  problems.push("unexpected package name: " + pkg.name);
}
if (!pkg.repository || !pkg.repository.url) {
  problems.push("package.json must declare repository.url");
}
if (!pkg.files || !pkg.files.includes("lib")) {
  problems.push("package.json files must include lib");
}

// 2. syntax checks
for (const file of ["lib/client.js", "lib/index.js"]) {
  const checked = spawnSync(process.execPath, ["--check", path.join(root, file)], { stdio: "inherit" });
  if (checked.status !== 0) problems.push("node --check failed: " + file);
}

// 3. JSON / YAML sanity
try {
  JSON.parse(fs.readFileSync(path.join(root, "screenshots.json"), "utf8"));
} catch (error) {
  problems.push("screenshots.json is not valid JSON: " + error.message);
}
const patch = fs.readFileSync(path.join(root, "cordis.patch.yml"), "utf8");
if (!patch.includes("composer-model-controls")) problems.push("cordis.patch.yml does not mention composer-model-controls");

// 4. screenshots.json paths must exist and stay inside the package
const shots = JSON.parse(fs.readFileSync(path.join(root, "screenshots.json"), "utf8"));
const shotList = Array.isArray(shots) ? shots : shots.screenshots;
if (!Array.isArray(shotList) || shotList.length < 1 || shotList.length > 8) {
  problems.push("screenshots.json must list 1-8 screenshots");
} else {
  for (const shot of shotList) {
    if (shot.startsWith("/") || shot.includes("..")) problems.push("invalid screenshot path: " + shot);
    else requireFile(shot);
  }
}

if (problems.length > 0) {
  console.error("\npackage check failed:");
  for (const problem of problems) console.error(" - " + problem);
  process.exit(1);
}
console.log("layout/syntax checks: ok");

// 5. pack
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
const pnpmArgs = /pnpm\.m?js$/.test(pnpm) ? [pnpm, "pack"] : ["pack"];
const command = /pnpm\.m?js$/.test(pnpm) ? process.execPath : pnpm;
// npm / pnpm 在 Windows 上是 .cmd 包装脚本，CreateProcess 不能直接执行，
// 必须经由 shell 启动；走 shell 时路径要自己补引号。
const useShell = process.platform === "win32";
const packDest = useShell ? `"${outDir}"` : outDir;
const packed = spawnSync(command, [...pnpmArgs, "--pack-destination", packDest], {
  cwd: root,
  stdio: "inherit",
  shell: useShell,
});
if (packed.status !== 0) {
  const detail = packed.error ? ` (${packed.error.code})` : "";
  console.error("\npack failed with status " + packed.status + detail);
  process.exit(packed.status ?? 1);
}

const versioned = path.join(outDir, `${pkg.name}-${pkg.version}.tgz`);
if (!fs.existsSync(versioned)) {
  console.error("expected tarball not found: " + versioned);
  process.exit(1);
}
const releaseCopy = path.join(outDir, `${pkg.name}.tgz`);
fs.copyFileSync(versioned, releaseCopy);

// 6. contents + checksums
const listing = spawnSync("tar.exe", ["-tzf", versioned], { encoding: "utf8" });
const contents = listing.status === 0 ? listing.stdout : "(tar listing unavailable)";
fs.writeFileSync(path.join(outDir, "CONTENTS.txt"), contents, "utf8");

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}
const sums = [versioned, releaseCopy]
  .map((file) => `${sha256(file)}  ${path.basename(file)}`)
  .join("\n");
fs.writeFileSync(path.join(outDir, "SHA256SUMS"), sums + "\n", "utf8");

const sizeKb = (fs.statSync(versioned).size / 1024).toFixed(1);
console.log("\nrelease files:");
console.log(" " + versioned + " (" + sizeKb + " KB)");
console.log(" " + releaseCopy);
console.log(" " + path.join(outDir, "CONTENTS.txt"));
console.log(" " + path.join(outDir, "SHA256SUMS"));

// 7. package size guard (marketplace-friendly)
if (fs.statSync(versioned).size > 200 * 1024) {
  console.warn("\nwarning: tarball exceeds 200 KB, consider trimming files[]");
}
