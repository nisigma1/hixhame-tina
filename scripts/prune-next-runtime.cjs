const fs = require("fs");
const path = require("path");

const outDir = path.resolve(__dirname, "..", ".next-production");

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath, files);
    else if (entry.isFile() && entry.name.endsWith(".html")) files.push(fullPath);
  }
  return files;
}

for (const file of walk(outDir)) {
  const original = fs.readFileSync(file, "utf8");
  const pruned = original
    .replace(/<link rel="preload" as="script"[^>]+href="\/_next\/static\/chunks\/[^"]+"[^>]*\/?>/g, "")
    .replace(/<script[^>]+src="\/_next\/static\/chunks\/[^"]+"[^>]*><\/script>/g, "")
    .replace(/<script>\(self\.__next_f[\s\S]*?<\/script>/g, "")
    .replace(/<script>self\.__next_f\.push\([\s\S]*?<\/script>/g, "");

  if (pruned !== original) {
    fs.writeFileSync(file, pruned);
  }
}

console.log(`Pruned Next runtime scripts from ${walk(outDir).length} HTML files.`);
