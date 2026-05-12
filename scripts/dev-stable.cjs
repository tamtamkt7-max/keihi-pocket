const { spawn, spawnSync } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");
const args = ["dev", ...process.argv.slice(2)];
const candidates = (process.env.KEIHI_DEV_DRIVE || "K,L,M,N").split(",").map((item) => `${item.trim().replace(/:$/, "")}:`);

function chooseDrive() {
  for (const drive of candidates) {
    spawnSync("cmd.exe", ["/c", "subst", drive, "/D"], { stdio: "ignore" });
    const result = spawnSync("cmd.exe", ["/c", "subst", drive, root], { stdio: "inherit" });
    if (result.status === 0) return drive;
  }
  throw new Error(`Could not create a subst drive. Tried: ${candidates.join(", ")}`);
}

const drive = chooseDrive();
const stableRoot = `${drive}\\`;
const nextBin = path.join(stableRoot, "node_modules", ".bin", process.platform === "win32" ? "next.cmd" : "next");

console.log(`Starting Next.js from ${stableRoot} to avoid non-ASCII Windows path issues.`);
const child = process.platform === "win32" ? spawn("cmd.exe", ["/c", nextBin, ...args], {
  cwd: stableRoot,
  env: process.env,
  stdio: "inherit",
  shell: false,
}) : spawn(nextBin, args, {
  cwd: stableRoot,
  env: process.env,
  stdio: "inherit",
  shell: false,
});

function cleanupAndExit(code) {
  spawnSync("cmd.exe", ["/c", "subst", drive, "/D"], { stdio: "ignore" });
  process.exit(code);
}

child.on("exit", (code) => cleanupAndExit(code || 0));
process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
