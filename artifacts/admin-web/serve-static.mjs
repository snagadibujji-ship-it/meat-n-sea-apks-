import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { join, extname } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
// Port must match artifact.toml localPort = 5000
const PORT = 5000;
const distDir = join(__dirname, "dist/public");

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
};

const server = createServer((req, res) => {
  const url = req.url.split("?")[0];
  let filePath = join(distDir, url === "/" ? "index.html" : url);

  if (!existsSync(filePath) || !extname(filePath)) {
    filePath = join(distDir, "index.html");
  }

  try {
    const content = readFileSync(filePath);
    const ct = mime[extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": ct });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Meat N Sea Admin — serving on http://0.0.0.0:${PORT}/`);
});

server.on("error", (err) => {
  console.error("[serve-static] server error:", err.message);
  process.exit(1);
});
