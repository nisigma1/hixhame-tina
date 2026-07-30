const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const projectRoot = path.join(__dirname, "..");
const reportDir = path.join(projectRoot, "qa", "i18n");
const port = Number(process.env.LIGHTHOUSE_PORT || 4320);
const url = `http://127.0.0.1:${port}/sq/`;
const chromeCandidates = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
];
const chromePath = chromeCandidates.find(fs.existsSync);
let server;

function findLighthouseCli() {
  const cacheRoot = path.join(
    os.homedir(),
    "AppData",
    "Local",
    "npm-cache",
    "_npx",
  );
  if (!fs.existsSync(cacheRoot)) return null;
  for (const directory of fs.readdirSync(cacheRoot)) {
    const candidate = path.join(
      cacheRoot,
      directory,
      "node_modules",
      "lighthouse",
      "cli",
      "index.js",
    );
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

async function waitForServer(attempts = 80) {
  for (let index = 0; index < attempts; index += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 125));
  }
  throw new Error(`Static server did not become ready at ${url}`);
}

function run(command, args, completedOutput) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      stdio: "inherit",
      windowsHide: true,
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else if (
        completedOutput &&
        fs.existsSync(completedOutput) &&
        fs.statSync(completedOutput).size > 1000
      ) {
        console.warn(
          `Lighthouse returned ${code} after writing its report; continuing.`,
        );
        resolve();
      } else {
        reject(new Error(`${path.basename(command)} exited with ${code}`));
      }
    });
  });
}

function summarize(reportPath) {
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  const categories = report.categories;
  const audits = report.audits;
  const scripts = audits["resource-summary"]?.details?.items?.find(
    (item) => item.resourceType === "script",
  );
  return {
    url: report.finalDisplayedUrl,
    scores: Object.fromEntries(
      Object.entries(categories).map(([key, category]) => [
        key,
        Math.round(category.score * 100),
      ]),
    ),
    metrics: {
      firstContentfulPaint: audits["first-contentful-paint"].numericValue,
      largestContentfulPaint: audits["largest-contentful-paint"].numericValue,
      totalBlockingTime: audits["total-blocking-time"].numericValue,
      cumulativeLayoutShift: audits["cumulative-layout-shift"].numericValue,
      speedIndex: audits["speed-index"].numericValue,
    },
    requests: audits["network-requests"]?.details?.items?.length,
    transferredBytes: audits["total-byte-weight"]?.numericValue,
    scriptRequests: scripts?.requestCount || 0,
    scriptBytes: scripts?.transferSize || 0,
  };
}

async function main() {
  const lighthouseCli = findLighthouseCli();
  if (!lighthouseCli) {
    throw new Error("A cached Lighthouse CLI installation was not found.");
  }
  if (!chromePath) {
    throw new Error("Chrome or Edge was not found.");
  }
  fs.mkdirSync(reportDir, { recursive: true });

  server = spawn(
    process.execPath,
    [
      path.join(__dirname, "serve-static.cjs"),
      path.join(projectRoot, ".next-production"),
      String(port),
    ],
    {
      cwd: projectRoot,
      stdio: "ignore",
      windowsHide: true,
    },
  );
  await waitForServer();

  const reports = {};
  try {
    for (const mode of ["mobile", "desktop"]) {
      const outputPath = path.join(reportDir, `lighthouse-${mode}.json`);
      const args = [
        lighthouseCli,
        url,
        "--quiet",
        "--output=json",
        `--output-path=${outputPath}`,
        `--chrome-path=${chromePath}`,
        "--chrome-flags=--headless=new --no-sandbox --disable-gpu",
        "--only-categories=performance,accessibility,best-practices,seo",
        "--max-wait-for-load=45000",
      ];
      if (mode === "desktop") args.push("--preset=desktop");
      await run(process.execPath, args, outputPath);
      reports[mode] = summarize(outputPath);
    }
  } finally {
    server.kill();
  }

  fs.writeFileSync(
    path.join(reportDir, "lighthouse-summary.json"),
    JSON.stringify(reports, null, 2),
  );
  console.log(JSON.stringify(reports, null, 2));

  const failed = Object.values(reports).some(
    (report) =>
      report.scores.performance < 90 ||
      report.scores.accessibility < 95 ||
      report.scores["best-practices"] < 95 ||
      report.scores.seo < 95,
  );
  if (failed) process.exit(1);
}

main().catch((error) => {
  if (server) server.kill();
  console.error(error);
  process.exit(1);
});
