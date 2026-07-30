const { spawn } = require("node:child_process");
const { join } = require("node:path");

const cwd = join(__dirname, "..");

const child = spawn("cmd.exe", ["/d", "/s", "/c", "npm.cmd run dev -- -p 3000"], {
  cwd,
  detached: true,
  stdio: "ignore",
  windowsHide: true,
});

child.unref();
console.log(`Started hixhame-tina dev server on pid ${child.pid}`);
