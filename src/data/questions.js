import logoUrl from "../assets/afluentes-logo.webp";
import posterUrl from "../assets/retrato-amazonia-mobile.webp";

export const LETTERS = ["a", "b", "c", "d"];

/** Substitua pelos caminhos reais dos seus assets. */
export const ASSETS = {
  video: "/assets/intro-loop.mp4",
  poster: posterUrl,
  logo: logoUrl,
};

/** Pontuação mínima para virar Guardião (halo + fanfarra). */
export const GUARDIAN_SCORE = 9;

const ph = (n, l) => `/assets/q${n}-${l}.jpg`;

const options = (n, label = "Opção") =>
  LETTERS.map((l) => ({ image: ph(n, l), alt: `${label} ${l.toUpperCase()}` }));

/** Perguntas 1 e 2 vêm do documento; 3–10 são placeholders para preencher. */
export const DEFAULT_QUESTIONS = [
  {
    id: "acai",
    prompt:
      "A Amazônia é o maior produtor de açaí do mundo. Lá as pessoas costumam comê-lo com peixe. Qual dessas fotos representa o açaí?",
    options: options(1),
    correct: 0,
  },
  {
    id: "mapa",
    prompt: "A Amazônia é a maior floresta tropical do mundo. Mas você sabe onde ela fica?",
    options: options(2, "Mapa"),
    correct: 0,
  },
  ...Array.from({ length: 8 }, (_, i) => {
    const n = i + 3;
    return { id: `q${n}`, prompt: `[PERGUNTA ${n}]`, options: options(n), correct: 0 };
  }),
];

/** Mensagens do resultado, conforme o documento. */
export function resultMessage(score) {
  if (score >= GUARDIAN_SCORE) return "Você está pronto para ser um Guardião da Amazônia.";
  if (score >= 7) return "Quase lá!";
  return "Visite a exposição e conheça mais sobre a Amazônia.";
}
