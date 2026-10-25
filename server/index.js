import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createReportHandler } from "./report-panel.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
};

if (!existsSync(join(DIST, "index.html"))) {
  console.error("dist/ não encontrado. Rode npm run build antes de npm start.");
  process.exit(1);
}
if (!process.env.REPORT_USER || !process.env.REPORT_PASSWORD) {
  console.warn("REPORT_USER e REPORT_PASSWORD não definidos: /report ficará desativado.");
}

const reportHandler = createReportHandler({
  user: process.env.REPORT_USER,
  password: process.env.REPORT_PASSWORD,
  root: ROOT,
});

async function serveStatic(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    return res.end();
  }
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    res.writeHead(400);
    return res.end();
  }
  let file = join(DIST, pathname);
  // Bloqueia "../" para fora do dist/
  if (file !== DIST && !file.startsWith(DIST + sep)) {
    res.writeHead(403);
    return res.end();
  }
  let info = await stat(file).catch(() => null);
  if (info?.isDirectory()) {
    file = join(file, "index.html");
    info = await stat(file).catch(() => null);
  }
  if (!info) {
    // Rotas do app (sem extensão) caem no index.html; arquivos que faltam dão 404
    if (extname(pathname)) {
      res.writeHead(404);
      return res.end();
    }
    file = join(DIST, "index.html");
    info = await stat(file);
  }
  res.writeHead(200, {
    "Content-Type": MIME[extname(file)] ?? "application/octet-stream",
    "Content-Length": info.size,
    // Arquivos em /assets têm hash no nome; o resto (index.html, sw.js…) precisa ser revalidado
    "Cache-Control": pathname.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "no-cache",
  });
  if (req.method === "HEAD") return res.end();
  createReadStream(file).pipe(res);
}

createServer((req, res) => {
  reportHandler(req, res, () =>
    serveStatic(req, res).catch((err) => {
      console.error(err);
      if (!res.headersSent) res.writeHead(500);
      res.end();
    }),
  );
}).listen(PORT, HOST, () => {
  console.log(`Afluentes em http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT} (relatórios em /report)`);
});
