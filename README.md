# Afluentes — Guardião da Amazônia

Quiz em React + Vite para totens e celulares: o visitante responde 10 perguntas com fotos e, conforme a pontuação, vira um Guardião da Amazônia. O app é um PWA (funciona em tela cheia e offline depois do primeiro acesso) e grava cada partida no Google Firebase para gerar relatórios.

## Rodando localmente

Requisitos: **Node.js 22.12 ou mais recente** e npm.

```sh
npm install
cp .env.example .env.local   # preencha com os dados do Firebase (veja abaixo)
npm run dev
```

O app abre em http://localhost:5173. Sem o `.env.local` ele funciona normalmente, só não grava as partidas.

| Script            | O que faz                                                   |
| ----------------- | ----------------------------------------------------------- |
| `npm run dev`     | Servidor de desenvolvimento com recarga automática          |
| `npm run build`   | Gera a versão de produção em `dist/`                        |
| `npm run preview` | Serve o `dist/` localmente, útil para testar o PWA e offline |
| `npm run lint`    | Verifica o código com oxlint                                |
| `npm run report`  | Gera um relatório HTML com as partidas salvas no Firestore  |
| `npm start`       | Servidor de produção: serve o `dist/` e a área `/report`     |

### Conteúdo do quiz

As perguntas ficam em [src/data/questions.js](src/data/questions.js). As fotos das opções e o vídeo da abertura são lidos de `public/assets/` (`q1-a.jpg` … `q10-d.jpg` e `intro-loop.mp4`), que precisam ser adicionados ao projeto. A pontuação mínima para virar Guardião é `GUARDIAN_SCORE`, no mesmo arquivo.

## Integração com o Google Firebase

O app usa o **Cloud Firestore** para guardar uma estatística de cada partida. Não há login: cada aparelho recebe um ID aleatório salvo no `localStorage`, o que diferencia pessoas diferentes usando a mesma rede.

### Como os dados são gravados

O código fica em [src/lib/tracking.js](src/lib/tracking.js) e é chamado por [src/hooks/useQuiz.js](src/hooks/useQuiz.js):

1. **Início da partida** (`trackStart`): cria um documento em `plays/{id}` com `deviceId`, `total` de perguntas, `userAgent` e `startedAt`.
2. **Cada resposta** (`trackAnswer`): atualiza `answers` com os acertos e erros até ali. Assim dá para saber em que pergunta uma partida não concluída parou.
3. **Fim da partida** (`trackFinish`): atualiza o mesmo documento com `finishedAt`, `durationMs`, `score` e `answers` (lista de acertos e erros, na ordem das perguntas).

Partidas que não chegam ao fim ficam sem `finishedAt`, com `answers` mostrando até onde foram. O SDK do Firebase (versão *lite*, menor) só é baixado quando a primeira partida começa, então não pesa no carregamento do app. Falhas de rede são apenas registradas no console e nunca travam o quiz.

### Regras de segurança

As regras em [firestore.rules](firestore.rules) permitem que qualquer visitante **crie** a própria partida, **acrescente uma resposta por vez** e a **finalize uma única vez**, validando cada campo. Ninguém consegue ler, apagar ou reescrever dados pelo app. A leitura só acontece pelo console do Firebase ou pelo script de relatório.

### Configurando um projeto Firebase

1. Crie um projeto no [console do Firebase](https://console.firebase.google.com/).
2. Em **Firestore Database**, crie o banco de dados (modo produção).
3. Em **Configurações do projeto → Seus apps**, adicione um app Web e copie os valores de `apiKey`, `authDomain`, `projectId` e `appId` para o `.env.local`:

   ```sh
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

4. Publique as regras de segurança:

   ```sh
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules --project SEU_PROJECT_ID
   ```

Esses valores do app Web não são secretos (vão no bundle público); a proteção dos dados vem das regras acima. Mesmo assim, o `.env.local` não é versionado.

## Gerando relatórios

```sh
npm run report
```

O script [scripts/report.js](scripts/report.js) lê todas as partidas e salva uma página HTML em `reports/relatorio-AAAA-MM-DD-HH-mm.html`. Basta abrir o arquivo no navegador. A pasta `reports/` não é versionada.

O relatório traz:

- **Resumo**: partidas iniciadas e concluídas, aparelhos únicos, pontuação média, duração média e número de Guardiões
- **Acerto por pergunta**
- **Distribuição de pontuação**
- **Partidas por dia**
- **Últimas 50 partidas**

### Credencial para o relatório

Como as regras bloqueiam leitura pelo app, o script usa o **Firebase Admin SDK**, que precisa de uma chave de conta de serviço:

1. No console do Firebase, vá em **Configurações do projeto → Contas de serviço → Gerar nova chave privada**.
2. Salve o `.json` baixado na raiz do projeto, mantendo o nome original (`*-firebase-adminsdk-*.json`). Esse padrão está no `.gitignore`.
3. Rode `npm run report`.

Se preferir guardar a chave em outro lugar, informe o caminho no `.env.local`:

```sh
FIREBASE_SERVICE_ACCOUNT=/caminho/da/chave.json
```

O script procura a credencial nesta ordem: `FIREBASE_SERVICE_ACCOUNT`, `GOOGLE_APPLICATION_CREDENTIALS`, um `*-firebase-adminsdk-*.json` na raiz e, por fim, o login do `gcloud auth application-default login`. O projeto lido é o de `VITE_FIREBASE_PROJECT_ID`.

### Área /report (navegador)

Em `/report` há uma página para **gerar um novo relatório** (roda o mesmo `scripts/report.js`) e **baixar o último gerado**. Ela é protegida por usuário e senha (HTTP Basic Auth), definidos no `.env.local`:

```sh
REPORT_USER=...
REPORT_PASSWORD=...
```

Sem essas variáveis, `/report` responde 503. A área funciona no `npm run dev`, no `npm run preview` e em produção.

### Produção

Em produção o app roda com o servidor Node em [server/index.js](server/index.js), sem dependências extras:

```sh
npm ci
npm run build
npm start          # porta 3000 por padrão (PORT=...)
```

**Na Hostinger (Node.js web app)**, o projeto é detectado como Vite e publicado só como site estático, sem o servidor (e `/report` dá 404). Nas configurações de build, escolha o framework **Express** (ou **Other**) e o **Entry file** `server/index.js`, com saída em `dist`. Como a Hostinger apaga os arquivos a cada deploy, cadastre as variáveis no painel em vez do `.env.local`: os `VITE_FIREBASE_*`, `REPORT_USER`, `REPORT_PASSWORD`, `FIREBASE_SERVICE_ACCOUNT` com **o conteúdo JSON da chave** (numa linha só) e, para os relatórios sobreviverem aos deploys, `REPORTS_DIR` apontando para fora de `hbuilds/` (ex.: `/home/USUARIO/domains/afluentes.online/reports`).

Em outros servidores, precisam estar o `.env.local` (com `VITE_FIREBASE_PROJECT_ID`, `REPORT_USER` e `REPORT_PASSWORD`) e a chave de conta de serviço. Os relatórios ficam em `reports/` (ou em `REPORTS_DIR`). Para as datas saírem no horário de Brasília, defina `TZ=America/Sao_Paulo`. Se houver Nginx ou Apache na frente, faça proxy de todo o tráfego para a porta do Node e **use HTTPS**: no Basic Auth a senha viaja só codificada, não criptografada.

> A chave de serviço dá acesso total ao projeto. Nunca a coloque no repositório nem a compartilhe.
