import { existsSync, readdirSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const RECENT_LIMIT = 50;
const TEMPLATE = join(dirname(fileURLToPath(import.meta.url)), "../base-report.html");

const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error("VITE_FIREBASE_PROJECT_ID não definido. Preencha o .env.local.");
  process.exit(1);
}

function credential() {
  const keyFile =
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    readdirSync(".").find((f) => /-firebase-adminsdk-.*\.json$/.test(f));
  if (keyFile) {
    if (!existsSync(keyFile)) {
      console.error(`Chave de serviço não encontrada: ${keyFile}`);
      process.exit(1);
    }
    return cert(keyFile);
  }
  // Sem checar antes, o SDK tenta o servidor de metadados do Google Cloud e só falha depois de um timeout
  if (existsSync(join(homedir(), ".config/gcloud/application_default_credentials.json"))) {
    return applicationDefault();
  }
  console.error(`Nenhuma credencial do Firebase encontrada.

O Firestore bloqueia leitura pelo app, então o relatório precisa de uma chave de serviço:
  1. Console do Firebase → Configurações do projeto → Contas de serviço
     → Gerar nova chave privada
  2. Salve o .json na raiz do projeto (o nome padrão *-firebase-adminsdk-*.json
     já está no .gitignore) ou aponte para ele no .env.local:
     FIREBASE_SERVICE_ACCOUNT=caminho/da/chave.json
  3. Rode npm run report de novo`);
  process.exit(1);
}

initializeApp({ credential: credential(), projectId });
const snapshot = await getFirestore().collection("plays").get();

const plays = snapshot.docs.map((d) => {
  const data = d.data();
  return {
    id: d.id,
    ...data,
    startedAt: data.startedAt?.toDate(),
    finishedAt: data.finishedAt?.toDate(),
  };
});
plays.sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0));

const finished = plays.filter((p) => p.finishedAt);
const avg = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
const toSec = (ms) => (ms == null ? null : Math.round(ms / 1000));
// Dia local no formato AAAA-MM-DD (sv-SE formata datas assim)
const dayKey = (d) => d.toLocaleDateString("sv-SE");

// As respostas são gravadas uma a uma, então partidas não concluídas também contam
// (partidas antigas só têm respostas se foram concluídas)
const totalQuestions = Math.max(0, ...plays.map((p) => p.total ?? 0));
const perguntas = Array.from({ length: totalQuestions }, (_, i) => {
  const answered = plays.filter((p) => p.answers?.length > i);
  return { n: i + 1, titulo: "", respostas: answered.length, acertos: answered.filter((p) => p.answers[i]).length };
});

const distribuicaoPontuacao = Array.from(
  { length: totalQuestions + 1 },
  (_, s) => finished.filter((p) => p.score === s).length,
);

const byDay = new Map();
for (const p of plays) {
  if (!p.startedAt) continue;
  const dia = dayKey(p.startedAt);
  const entry = byDay.get(dia) ?? { dia, iniciadas: 0, concluidas: 0 };
  entry.iniciadas++;
  if (p.finishedAt) entry.concluidas++;
  byDay.set(dia, entry);
}
const porDia = [...byDay.values()].sort((a, b) => a.dia.localeCompare(b.dia));

const generatedAt = new Date();
const data = {
  projeto: projectId,
  geradoEm: generatedAt.toISOString(),
  periodo: porDia.length ? { inicio: porDia[0].dia, fim: porDia.at(-1).dia } : null,
  totalPerguntas: totalQuestions,
  partidas: {
    iniciadas: plays.length,
    concluidas: finished.length,
    aparelhosUnicos: new Set(plays.map((p) => p.deviceId)).size,
    duracaoMediaSeg: toSec(avg(finished.map((p) => p.durationMs))),
  },
  perguntas,
  distribuicaoPontuacao,
  porDia,
  ultimasPartidas: plays
    .filter((p) => p.startedAt)
    .slice(0, RECENT_LIMIT)
    .map((p) => ({
      inicio: p.startedAt.toISOString(),
      concluida: Boolean(p.finishedAt),
      pontuacao: p.finishedAt ? p.score : null,
      duracaoSeg: toSec(p.durationMs),
      aparelho: p.deviceId?.slice(0, 8) ?? "—",
    })),
};

// O modelo calcula tudo a partir do JSON em <script id="report-data">; só ele é trocado
const template = await readFile(TEMPLATE, "utf8");
const dataBlock = /(<script type="application\/json" id="report-data">)[\s\S]*?(<\/script>)/;
if (!dataBlock.test(template)) {
  console.error(`Bloco <script id="report-data"> não encontrado em ${TEMPLATE}`);
  process.exit(1);
}
// Escapar "<" impede que um valor feche a tag <script> antes da hora
const json = JSON.stringify(data, null, 2).replace(/</g, "\\u003c");
const html = template.replace(dataBlock, (_, open, close) => `${open}\n${json}\n${close}`);

// Data e hora locais no nome do arquivo (sv-SE formata como "2026-10-16 17:09")
const stamp = generatedAt.toLocaleString("sv-SE").slice(0, 16).replace(/[ :]/g, "-");
const file = `reports/relatorio-${stamp}.html`;
await mkdir("reports", { recursive: true });
await writeFile(file, html);
console.log(`Relatório salvo em ${file} (${plays.length} partidas)`);
