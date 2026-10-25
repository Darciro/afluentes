import { spawn } from "node:child_process";
import { createHash, timingSafeEqual } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, readdir, stat } from "node:fs/promises";
import { join, resolve } from "node:path";

// Sem "/" nem "..": o nome vem da URL e vira caminho dentro de reports/
const REPORT_FILE = /^relatorio-[\w-]+\.html$/;
const RUN_TIMEOUT_MS = 2 * 60 * 1000;

const sha256 = (s) => createHash("sha256").update(s).digest();
// Compara os hashes, que têm sempre o mesmo tamanho, para não vazar nada pelo tempo de resposta
const sameSecret = (a, b) => timingSafeEqual(sha256(a), sha256(b));

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const HTML2PDF_URL = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
// Blocos que não podem ser cortados na virada de página. Ficam de fora os itens de grade
// (.kpi, .tier…): o html2pdf quebra a página inserindo um espaçador antes, e ele viraria uma célula
const PDF_AVOID_BREAK = ["header", ".summary", ".kpis", "section.block", ".block-head", ".tiers", ".callouts", ".card", "tr"];

const formatDate = (d) => d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

/**
 * Middleware (estilo Connect) da área /report: gera relatórios com scripts/report.js
 * e lista todos, que abrem em /report/<nome>.html. Tudo nela exige usuário e senha (HTTP Basic Auth).
 * Outras rotas seguem para next().
 */
export function createReportHandler({ user, password, root }) {
  const reportsDir = resolve(root, process.env.REPORTS_DIR || "reports");
  let running = null;
  let lastRun = null;

  async function report(name) {
    if (!REPORT_FILE.test(name)) return null;
    const path = join(reportsDir, name);
    const info = await stat(path).catch(() => null);
    return info?.isFile() ? { name, path, size: info.size, mtime: info.mtime } : null;
  }

  async function listReports() {
    const names = (await readdir(reportsDir).catch(() => [])).filter((f) => REPORT_FILE.test(f));
    // O nome traz data e hora (AAAA-MM-DD-HH-mm), então a ordem alfabética invertida é a do mais novo ao mais antigo
    const reports = await Promise.all(names.sort().reverse().map(report));
    return reports.filter(Boolean);
  }

  /**
   * O relatório com um script que o converte em PDF e baixa sozinho. O PDF sai sempre
   * no tema claro, então as cores claras do :root também valem no modo escuro.
   */
  async function renderPdfSource(res, found) {
    const html = await readFile(found.path, "utf8");
    const lightRoot = html.match(/:root\s*\{[^}]*\}/)?.[0] ?? "";
    const options = {
      margin: [10, 0, 10, 0],
      filename: found.name.replace(/\.html$/, ".pdf"),
      image: { type: "jpeg", quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css"], avoid: PDF_AVOID_BREAK },
    };
    const inject = `<style>
  @media (prefers-color-scheme: dark) { ${lightRoot} }
  /* Largura da folha A4: os gráficos são desenhados já no tamanho em que vão para o PDF */
  body { background: #fff; width: 210mm; }
  details.data { display: none; }
  /* Sem rolagem lateral no papel: a coluna Resultado quebra o texto para a tabela caber na folha */
  th, td { padding: 8px 10px; font-size: 13px; }
  #tUlt td:nth-child(4) { white-space: normal; }
</style>
<script src="${HTML2PDF_URL}"></script>
<script>
  // Sem animação os gráficos já estão completos quando a página é capturada
  if (window.Chart) Object.assign(Chart.defaults, { animation: false, devicePixelRatio: 2 });
  addEventListener("load", async () => {
    const done = (ok, erro) => parent !== window && parent.postMessage({ tipo: "relatorio-pdf", ok, erro }, location.origin);
    try {
      await document.fonts.ready;
      // O html2canvas sobrepõe palavras quando um texto quebra de linha; com uma palavra
      // por <span>, cada uma é desenhada na própria caixa
      const walker = document.createTreeWalker(document.querySelector("main"), NodeFilter.SHOW_TEXT);
      const textos = [];
      while (walker.nextNode()) if (/\\S\\s+\\S/.test(walker.currentNode.data)) textos.push(walker.currentNode);
      for (const t of textos) {
        const spans = t.data.split(/(\\s+)/).map((p) => {
          if (!p.trim()) return p;
          const s = document.createElement("span");
          s.textContent = p;
          return s;
        });
        t.replaceWith(...spans);
      }
      await html2pdf().set(${JSON.stringify(options).replace(/</g, "\\u003c")}).from(document.body).save();
      done(true);
    } catch (err) {
      done(false, String(err));
    }
  });
</script>
</head>`;
    send(res, 200, html.replace("</head>", () => inject), { "Content-Type": "text/html; charset=utf-8" });
  }

  function runReport() {
    return new Promise((resolve) => {
      const child = spawn(process.execPath, ["--env-file-if-exists=.env.local", "scripts/report.js"], {
        cwd: root,
        timeout: RUN_TIMEOUT_MS,
      });
      let output = "";
      child.stdout.on("data", (chunk) => (output += chunk));
      child.stderr.on("data", (chunk) => (output += chunk));
      child.on("error", (err) => resolve({ ok: false, output: err.message, at: new Date() }));
      child.on("close", (code, signal) => {
        if (signal) output += `\nInterrompido (${signal}) depois de ${RUN_TIMEOUT_MS / 1000}s.`;
        resolve({ ok: code === 0, output: output.trim(), at: new Date() });
      });
    });
  }

  function authorized(req) {
    const [scheme, encoded] = (req.headers.authorization ?? "").split(" ");
    if (scheme !== "Basic" || !encoded) return false;
    const decoded = Buffer.from(encoded, "base64").toString("utf8");
    const sep = decoded.indexOf(":");
    if (sep < 0) return false;
    // Avalia as duas comparações sempre, para o tempo não indicar qual delas falhou
    const userOk = sameSecret(decoded.slice(0, sep), user);
    const passwordOk = sameSecret(decoded.slice(sep + 1), password);
    return userOk && passwordOk;
  }

  function send(res, status, body, headers = {}) {
    res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", ...headers });
    res.end(body);
  }

  async function renderPage(res) {
    const reports = await listReports();
    const status = lastRun
      ? `<div class="status ${lastRun.ok ? "ok" : "erro"}">
           <p class="k"><span class="dot" aria-hidden="true"></span>${lastRun.ok ? "Relatório gerado" : "Falha ao gerar o relatório"}</p>
           <p class="d">${formatDate(lastRun.at)}</p>
           ${lastRun.output ? `<pre>${escapeHtml(lastRun.output)}</pre>` : ""}
         </div>`
      : "";
    const list = reports.length
      ? `<ul class="lista">${reports
          .map((r) => {
            const href = `/report/${encodeURIComponent(r.name)}`;
            return `<li>
              <div class="item">
                <a class="nome" href="${href}">${escapeHtml(r.name)}</a>
                <span class="data">${formatDate(r.mtime)} · ${Math.round(r.size / 1024)} KB</span>
              </div>
              <span class="baixar">
                <a class="btn secundario pequeno" href="${href}?download">HTML</a>
                <button class="btn secundario pequeno" type="button" data-pdf="${href}?pdf">PDF</button>
              </span>
            </li>`;
          })
          .join("")}</ul>`
      : `<p class="info">Nenhum relatório gerado ainda.</p>`;

    send(
      res,
      200,
      `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Relatórios · Afluentes</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bangers&family=Fira+Sans:wght@400;500;600;800&display=swap">
<style>
  /* Mesmos tokens, fontes e padrões visuais dos relatórios gerados por scripts/report.js */
  :root {
    --bg: #FBF9EC; --card: #FFFFFF; --ink: #1A1612; --ink-2: #4A4238; --muted: #6E655A;
    --line: #E7E2CF; --grid: #EEEADB;
    --blue: #0A6FB0; --ok: #23843A; --bad: #C41A34;
    --display: 'Bangers', Impact, 'Arial Narrow', sans-serif;
    --body: 'Fira Sans', system-ui, -apple-system, sans-serif;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #15110E; --card: #1F1A16; --ink: #F3EFE4; --ink-2: #CFC7B8; --muted: #A69C8D;
      --line: #342C25; --grid: #2A231D;
      --blue: #5AAEE8; --ok: #5CC173; --bad: #F0607A;
    }
  }
  * { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.55 var(--body); }
  .stripe { height: 14px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='14' viewBox='0 0 28 14'%3E%3Cpath d='M0 14 L7 2 L14 14 Z' fill='%23E4223F'/%3E%3Cpath d='M14 0 L21 12 L28 0 Z' fill='%23E4223F'/%3E%3C/svg%3E"); background-size: 28px 14px; }
  main { max-width: 760px; margin: 0 auto; padding: 32px 16px 64px; }

  header { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px 24px; }
  .eyebrow { margin: 0; font-size: 13px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--blue); }
  h1 { margin: 4px 0 0; font-family: var(--display); font-weight: 400; font-size: clamp(34px, 6vw, 48px); line-height: 1; letter-spacing: .01em; }
  .meta { margin: 0; color: var(--muted); font-size: 14px; text-align: right; }
  .meta strong { color: var(--ink-2); font-weight: 600; }
  @media (max-width: 640px) { .meta { text-align: left; } }

  .summary { margin: 28px 0 0; padding: 20px 22px; background: var(--card); border: 1px solid var(--line); border-radius: 14px; }
  .summary h2 { margin: 0 0 8px; font-size: 14px; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: .08em; }
  .summary .info { margin-bottom: 16px; }
  .info { color: var(--ink-2); margin: 0; }

  section.block { margin-top: 40px; }
  .block-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 16px; margin-bottom: 12px; }
  .block-head h2 { margin: 0; font-size: 20px; font-weight: 800; }
  .block-head p { margin: 0; color: var(--muted); font-size: 14px; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 18px; }

  form { margin: 0; }
  .btn { display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 99px; padding: 12px 24px;
         font: inherit; font-weight: 600; text-decoration: none; cursor: pointer; background: var(--blue); color: #fff; }
  .btn.secundario { background: transparent; color: var(--blue); box-shadow: inset 0 0 0 1px currentColor; }
  .btn.secundario:hover { background: var(--grid); }
  .btn.pequeno { padding: 2px 12px; font-size: 13px; min-height: 28px; }
  .btn:disabled, .btn.desativado { opacity: .5; cursor: default; }

  .status { margin-top: 16px; border: 1px solid var(--line); border-radius: 12px; padding: 12px 14px; }
  .status p { margin: 0; }
  .status .k { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; display: flex; align-items: center; gap: 6px; }
  .status .d { font-size: 13px; color: var(--muted); }
  .status.ok .k { color: var(--ok); }
  .status.erro .k { color: var(--bad); }
  .dot { width: 8px; height: 8px; border-radius: 99px; display: inline-block; background: currentColor; }

  .lista { margin: 0; padding: 0; list-style: none; }
  .lista li { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 16px; padding: 12px 0; border-top: 1px solid var(--line); }
  .lista li:first-child { border-top: 0; padding-top: 0; }
  .lista li:last-child { padding-bottom: 0; }
  .item { display: flex; flex-direction: column; min-width: 0; }
  .nome { color: var(--ink); font-weight: 600; text-decoration: none; overflow-wrap: anywhere; }
  .nome:hover { color: var(--blue); text-decoration: underline; }
  .data { color: var(--muted); font-size: 13px; font-variant-numeric: tabular-nums; }
  .baixar { display: flex; gap: 8px; }
  pre { margin: 8px 0 0; white-space: pre-wrap; word-break: break-word; font-size: 12px; color: var(--muted); }

  footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid var(--line); color: var(--muted); font-size: 13px; }
  footer p { margin: 4px 0; }
</style>
</head>
<body>
<div class="stripe" aria-hidden="true"></div>
<main>
  <header>
    <div>
      <p class="eyebrow">Afluentes · Área restrita</p>
      <h1>Relatórios de uso</h1>
    </div>
    <p class="meta"><strong>${reports.length}</strong> ${reports.length === 1 ? "relatório gerado" : "relatórios gerados"}</p>
  </header>

  <section class="summary" aria-labelledby="h-novo">
    <h2 id="h-novo">Novo relatório</h2>
    <p class="info">Consolida as partidas registradas até agora num novo arquivo HTML.</p>
    <form method="post" action="/report/gerar"
          onsubmit="const b = this.querySelector('button'); b.disabled = true; b.textContent = 'Gerando…';">
      <button class="btn" type="submit">Gerar novo relatório</button>
    </form>
    ${status}
  </section>

  <section class="block" aria-labelledby="h-lista">
    <div class="block-head">
      <h2 id="h-lista">Relatórios gerados</h2>
      <p>Do mais novo ao mais antigo</p>
    </div>
    <div class="card">${list}</div>
  </section>

  <footer>
    <p>Cada relatório abre no navegador; use <strong>HTML</strong> para baixar o arquivo ou <strong>PDF</strong> para gerar a versão em folha A4.</p>
  </footer>
</main>
<script>
  // O relatório é montado no navegador (gráficos, fontes), então o PDF também: ele carrega
  // num iframe fora da tela, que gera o arquivo, baixa e avisa aqui quando termina
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-pdf]");
    if (!b || b.disabled) return;
    const frame = document.createElement("iframe");
    const finish = (erro) => {
      clearTimeout(timer);
      removeEventListener("message", onMessage);
      frame.remove();
      b.disabled = false;
      b.textContent = "PDF";
      if (erro) alert("Não foi possível gerar o PDF: " + erro);
    };
    const onMessage = (m) => {
      if (m.source === frame.contentWindow && m.data?.tipo === "relatorio-pdf") finish(m.data.ok ? null : m.data.erro);
    };
    const timer = setTimeout(() => finish("tempo esgotado"), 60000);
    addEventListener("message", onMessage);
    b.disabled = true;
    b.textContent = "Gerando…";
    frame.style.cssText = "position:fixed;left:-10000px;top:0;width:800px;height:800px;border:0";
    frame.src = b.dataset.pdf;
    document.body.append(frame);
  });
</script>
</body>
</html>`,
      { "Content-Type": "text/html; charset=utf-8" },
    );
  }

  return async function reportHandler(req, res, next) {
    const { pathname } = new URL(req.url, "http://localhost");
    if (pathname !== "/report" && !pathname.startsWith("/report/")) return next();

    try {
      if (!user || !password) {
        return send(res, 503, "Área de relatórios desativada: defina REPORT_USER e REPORT_PASSWORD no ambiente.");
      }
      if (!authorized(req)) {
        return send(res, 401, "Acesso restrito.", { "WWW-Authenticate": 'Basic realm="Relatorios Afluentes", charset="UTF-8"' });
      }

      if (req.method === "GET" && (pathname === "/report" || pathname === "/report/")) {
        return await renderPage(res);
      }

      if (req.method === "POST" && pathname === "/report/gerar") {
        req.resume();
        // O navegador reenvia a senha sozinho, então um formulário de outro site também poderia disparar a geração
        if (req.headers["sec-fetch-site"] === "cross-site") return send(res, 403, "Origem não permitida.");
        // Cliques repetidos esperam a geração em andamento em vez de rodar o script de novo
        running ??= runReport().finally(() => (running = null));
        lastRun = await running;
        return send(res, 303, "", { Location: "/report" });
      }

      if (req.method === "GET") {
        const found = await report(pathname.slice("/report/".length));
        if (!found) return send(res, 404, "Relatório não encontrado.");
        const { searchParams } = new URL(req.url, "http://localhost");
        if (searchParams.has("pdf")) return await renderPdfSource(res, found);
        res.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Length": found.size,
          // ?download baixa o arquivo; sem ele o relatório abre no navegador
          ...(searchParams.has("download") && { "Content-Disposition": `attachment; filename="${found.name}"` }),
          "Cache-Control": "no-store",
        });
        return createReadStream(found.path).pipe(res);
      }

      send(res, 404, "Não encontrado.");
    } catch (err) {
      console.error(err);
      if (!res.headersSent) send(res, 500, "Erro interno.");
    }
  };
}
