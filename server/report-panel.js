import { spawn } from "node:child_process";
import { createHash, timingSafeEqual } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, readdir, stat } from "node:fs/promises";
import { join, resolve } from "node:path";

const REPORT_FILE = /^relatorio-.*\.html$/;
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
 * e baixa o mais recente. Tudo nela exige usuário e senha (HTTP Basic Auth).
 * Outras rotas seguem para next().
 */
export function createReportHandler({ user, password, root }) {
  const reportsDir = resolve(root, process.env.REPORTS_DIR || "reports");
  let running = null;
  let lastRun = null;

  async function latestReport() {
    const names = (await readdir(reportsDir).catch(() => [])).filter((f) => REPORT_FILE.test(f));
    // O nome traz data e hora (AAAA-MM-DD-HH-mm), então a ordem alfabética é a cronológica
    const name = names.sort().at(-1);
    if (!name) return null;
    const path = join(reportsDir, name);
    const { size, mtime } = await stat(path);
    return { name, path, size, mtime };
  }

  /**
   * O relatório com um script que o converte em PDF e baixa sozinho. O PDF sai sempre
   * no tema claro, então as cores claras do :root também valem no modo escuro.
   */
  async function renderPdfSource(res, latest) {
    const html = await readFile(latest.path, "utf8");
    const lightRoot = html.match(/:root\s*\{[^}]*\}/)?.[0] ?? "";
    const options = {
      margin: [10, 0, 10, 0],
      filename: latest.name.replace(/\.html$/, ".pdf"),
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
    const latest = await latestReport();
    const info = latest
      ? `<p class="info">Último relatório: <strong>${escapeHtml(latest.name)}</strong><br>
         Gerado em ${formatDate(latest.mtime)} · ${Math.round(latest.size / 1024)} KB</p>`
      : `<p class="info">Nenhum relatório gerado ainda.</p>`;
    const status = lastRun
      ? `<div class="status ${lastRun.ok ? "ok" : "erro"}">
           <strong>${lastRun.ok ? "Relatório gerado" : "Falha ao gerar o relatório"}</strong> · ${formatDate(lastRun.at)}
           ${lastRun.output ? `<pre>${escapeHtml(lastRun.output)}</pre>` : ""}
         </div>`
      : "";
    const download = latest
      ? `<a class="btn secundario" href="/report/download">Baixar último relatório</a>`
      : `<span class="btn secundario desativado" aria-disabled="true">Baixar último relatório</span>`;
    const downloadPdf = latest
      ? `<button class="btn secundario" type="button" id="pdf">Baixar em PDF</button>`
      : `<span class="btn secundario desativado" aria-disabled="true">Baixar em PDF</span>`;

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
<style>
  :root { --bg: #FBF9EC; --card: #FFFFFF; --ink: #1A1612; --muted: #6E655A; --line: #E7E2CF;
          --blue: #0A6FB0; --ok: #23843A; --bad: #C41A34; }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #15110E; --card: #1F1A16; --ink: #F3EFE4; --muted: #A69C8D; --line: #342C25;
            --blue: #5AAEE8; --ok: #5CC173; --bad: #F0607A; }
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.55 system-ui, -apple-system, sans-serif; }
  main { max-width: 560px; margin: 0 auto; padding: 48px 16px; }
  h1 { margin: 0 0 4px; font-size: 26px; }
  .info { color: var(--muted); margin: 0 0 24px; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 24px; }
  .acoes { display: flex; flex-wrap: wrap; gap: 12px; }
  form { margin: 0; }
  .btn { display: inline-block; border: 0; border-radius: 8px; padding: 12px 20px; font: inherit; font-weight: 600;
         text-decoration: none; cursor: pointer; background: var(--blue); color: #fff; }
  .btn.secundario { background: transparent; color: var(--blue); box-shadow: inset 0 0 0 2px var(--blue); }
  .btn:disabled, .btn.desativado { opacity: .5; cursor: default; }
  .status { margin-top: 24px; padding: 12px 16px; border-radius: 8px; border-left: 4px solid; }
  .status.ok { border-color: var(--ok); }
  .status.erro { border-color: var(--bad); }
  pre { margin: 8px 0 0; white-space: pre-wrap; word-break: break-word; font-size: 13px; color: var(--muted); }
</style>
</head>
<body>
<main>
  <h1>Relatórios</h1>
  ${info}
  <div class="card">
    <div class="acoes">
      <form method="post" action="/report/gerar"
            onsubmit="const b = this.querySelector('button'); b.disabled = true; b.textContent = 'Gerando…';">
        <button class="btn" type="submit">Gerar novo relatório</button>
      </form>
      ${download}
      ${downloadPdf}
    </div>
    ${status}
  </div>
</main>
<script>
  // O relatório é montado no navegador (gráficos, fontes), então o PDF também: ele carrega
  // num iframe fora da tela, que gera o arquivo, baixa e avisa aqui quando termina
  document.getElementById("pdf")?.addEventListener("click", (e) => {
    const b = e.currentTarget;
    const frame = document.createElement("iframe");
    const finish = (erro) => {
      clearTimeout(timer);
      removeEventListener("message", onMessage);
      frame.remove();
      b.disabled = false;
      b.textContent = "Baixar em PDF";
      if (erro) alert("Não foi possível gerar o PDF: " + erro);
    };
    const onMessage = (m) => {
      if (m.source === frame.contentWindow && m.data?.tipo === "relatorio-pdf") finish(m.data.ok ? null : m.data.erro);
    };
    const timer = setTimeout(() => finish("tempo esgotado"), 60000);
    addEventListener("message", onMessage);
    b.disabled = true;
    b.textContent = "Gerando PDF…";
    frame.style.cssText = "position:fixed;left:-10000px;top:0;width:800px;height:800px;border:0";
    frame.src = "/report/pdf";
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

      if (req.method === "GET" && pathname === "/report/download") {
        const latest = await latestReport();
        if (!latest) return send(res, 404, "Nenhum relatório gerado ainda.");
        res.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Length": latest.size,
          "Content-Disposition": `attachment; filename="${latest.name}"`,
          "Cache-Control": "no-store",
        });
        return createReadStream(latest.path).pipe(res);
      }

      if (req.method === "GET" && pathname === "/report/pdf") {
        const latest = await latestReport();
        if (!latest) return send(res, 404, "Nenhum relatório gerado ainda.");
        return await renderPdfSource(res, latest);
      }

      send(res, 404, "Não encontrado.");
    } catch (err) {
      console.error(err);
      if (!res.headersSent) send(res, 500, "Erro interno.");
    }
  };
}
