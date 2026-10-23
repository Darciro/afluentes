/* Idiomas do quiz: português e norueguês (bokmål). Traduções em norueguês: revisar com falante nativo. */

export const LANGS = ["pt", "no"];

export const LANG_META = {
  pt: { name: "Português", short: "PT", htmlLang: "pt-BR" },
  no: { name: "Norsk", short: "NO", htmlLang: "nb" },
};

/** Rótulo do seletor nas duas línguas: quem procura o seletor ainda não escolheu. */
export const LANG_GROUP_LABEL = "Idioma / Språk";

/** Textos da interface. */
export const UI = {
  pt: {
    docTitle: "Afluentes — Guardião da Amazônia",
    startTitle: "Venha ser um Guardião da Amazônia",
    startSub: "Responda o quiz e veja se está preparado.",
    play: "Jogar",
    playAgain: "Jogar de novo",
    counter: (n, total) => `Pergunta ${n} de ${total}`,
    hint: "Toque na resposta que você acha correta",
    options: "Opções de resposta",
    correct: "Acertou!",
    wrong: "Não foi dessa vez",
    next: "Próxima",
    seeResult: "Ver resultado",
    isCorrect: "resposta correta",
    yourAnswer: "sua resposta",
    scoreA: "Você acertou",
    scoreB: (score, total) => `${score} de ${total}`,
    scoreC: "perguntas.",
    soundOn: "Ativar som",
    soundOff: "Desativar som",
  },
  no: {
    docTitle: "Afluentes — Amazonas' vokter",
    startTitle: "Bli en vokter av Amazonas",
    startSub: "Svar på quizen og se om du er klar.",
    play: "Spill",
    playAgain: "Spill igjen",
    counter: (n, total) => `Spørsmål ${n} av ${total}`,
    hint: "Trykk på svaret du tror er riktig",
    options: "Svaralternativer",
    correct: "Riktig!",
    wrong: "Ikke denne gangen",
    next: "Neste",
    seeResult: "Se resultatet",
    isCorrect: "riktig svar",
    yourAnswer: "ditt svar",
    scoreA: "Du svarte riktig på",
    scoreB: (score, total) => `${score} av ${total}`,
    scoreC: "spørsmål.",
    soundOn: "Slå på lyd",
    soundOff: "Slå av lyd",
  },
};

const STORAGE_KEY = "afluentes:lang";

const isLang = (l) => LANGS.includes(l);

/** Idioma inicial: ?lang=pt|no na URL → última escolha salva → idioma do aparelho → `fallback`. */
export function detectLang(fallback = "pt") {
  if (typeof window === "undefined") return fallback;
  const fromUrl = new URLSearchParams(window.location.search).get("lang");
  if (isLang(fromUrl)) return fromUrl;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch {
    // Storage bloqueado: segue para o idioma do aparelho
  }
  for (const l of navigator.languages ?? [navigator.language]) {
    const code = l.toLowerCase().slice(0, 2);
    if (code === "nb" || code === "nn" || code === "no") return "no";
    if (code === "pt") return "pt";
  }
  return fallback;
}

export function saveLang(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignora
  }
}
