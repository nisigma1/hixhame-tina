const { createReadStream, existsSync, statSync } = require("node:fs");
const { createServer } = require("node:http");
const { extname, join, normalize, resolve, sep } = require("node:path");

const root = resolve(process.argv[2] || ".next-production");
const port = Number(process.argv[3] || process.env.PORT || 3000);

const types = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".xml": "application/xml; charset=utf-8",
};

function fileFor(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const safePath = normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  let candidate = resolve(join(root, safePath));
  if (!candidate.startsWith(root + sep) && candidate !== root) return null;
  if (existsSync(candidate) && statSync(candidate).isDirectory()) {
    candidate = join(candidate, "index.html");
  }
  if (!existsSync(candidate) && !extname(candidate)) {
    candidate = join(candidate, "index.html");
  }
  return candidate;
}

createServer((request, response) => {
  const candidate = fileFor(request.url || "/");
  if (!candidate || !existsSync(candidate) || !statSync(candidate).isFile()) {
    const notFoundPage = join(root, "404.html");
    if (existsSync(notFoundPage)) {
      response.writeHead(404, {
        "cache-control": "no-store",
        "content-type": "text/html; charset=utf-8",
      });
      createReadStream(notFoundPage).pipe(response);
      return;
    }
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "cache-control": extname(candidate) === ".html" ? "no-store" : "public, max-age=31536000, immutable",
    "content-type": types[extname(candidate)] || "application/octet-stream",
  });
  createReadStream(candidate).pipe(response);
}).listen(port, "127.0.0.1", () => {
  console.log(`Serving ${root} on http://localhost:${port}`);
});
