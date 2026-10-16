const DEVICE_KEY = "afluentes:device-id";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** UUID fixo do aparelho: é o que separa pessoas diferentes que compartilham o mesmo Wi‑Fi. */
function deviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    // Aba anônima ou storage bloqueado: identifica só esta sessão
    return (deviceId.fallback ??= crypto.randomUUID());
  }
}

// O SDK só é baixado na primeira partida, sem pesar no carregamento inicial.
// A versão "lite" (REST) é bem menor que a completa e basta para gravar documentos.
let db;
async function firestore() {
  if (!firebaseConfig.projectId) return null; // Sem .env.local, o tracking fica desligado
  if (!db) {
    const [{ initializeApp }, lite] = await Promise.all([import("firebase/app"), import("firebase/firestore/lite")]);
    db = { lite, instance: lite.getFirestore(initializeApp(firebaseConfig)) };
  }
  return db;
}

async function write(fn) {
  try {
    const fs = await firestore();
    if (fs) await fn(fs.lite, fs.instance);
  } catch (err) {
    console.warn("[tracking]", err);
  }
}

let current = null;

export function trackStart(total) {
  const play = { id: crypto.randomUUID(), startedAt: performance.now() };
  current = play;
  play.created = write(({ doc, setDoc, serverTimestamp }, db) =>
    setDoc(doc(db, "plays", play.id), {
      deviceId: deviceId(),
      total,
      userAgent: navigator.userAgent.slice(0, 512),
      startedAt: serverTimestamp(),
    }),
  );
}

export function trackFinish(answers) {
  const play = current;
  if (!play) return;
  current = null;
  const durationMs = Math.round(performance.now() - play.startedAt);
  // Espera a criação terminar, senão o update pode chegar antes do documento existir
  play.created.then(() =>
    write(({ doc, updateDoc, serverTimestamp }, db) =>
      updateDoc(doc(db, "plays", play.id), {
        finishedAt: serverTimestamp(),
        durationMs,
        score: answers.filter(Boolean).length,
        answers,
      }),
    ),
  );
}
