import logoUrl from "../assets/afluentes-logo.webp";
import posterUrl from "../assets/retrato-amazonia-mobile.webp";

export const LETTERS = ["a", "b", "c", "d"];

/** Substitua pelos caminhos reais dos seus assets. */
export const ASSETS = {
  video: "/assets/intro-loop.mp4",
  poster: posterUrl,
  logo: logoUrl,
};

/** Fotos das perguntas em /public/quiz-assets (pacote quiz-assets.zip). */
const QUIZ_ASSETS = "/quiz-assets";

/*
 * Opções: foto ("cover"), mapa/bandeira ("contain", inteira, sem corte, com legenda opcional)
 * ou um número/texto grande. `alt` é o nome lido pelo leitor de tela; a legenda aparece na tela.
 */
const img = (file, alt, extra = {}) => ({ kind: "image", src: `${QUIZ_ASSETS}/${file}`, alt, fit: "cover", ...extra });
const map = (file, alt) => img(file, alt, { fit: "contain" });
const flag = (file, name) => img(file, name, { fit: "contain", caption: name });
const num = (n) => ({ kind: "text", text: n, alt: n });

/** Textos do documento "quiz-noruegues" (só norueguês). Índice da correta: 0 = a, 1 = b, 2 = c, 3 = d. */
export const DEFAULT_QUESTIONS = [
  {
    id: "mapa",
    prompt: "Omtrent 60 % av Amazonas ligger i Brasil. Vet du hvor Amazonas ligger på kartet?",
    options: [
      map("q01-a.png", "Kart med markering i Sentral-Afrika"),
      map("q01-b.png", "Kart med markering i Sørøst-Asia"),
      map("q01-c.png", "Kart med markering nord i Sør-Amerika"),
      map("q01-d.png", "Kart med markering i Australia"),
    ],
    correct: 2,
  },
  {
    id: "ccpi",
    prompt:
      "Senteret for internasjonalt politisamarbeid i Amazonas samler ni land for å beskytte regionen mot trusler som ulovlig gullutvinning og smugling. Hvilket av disse landene er ikke med?",
    options: [flag("q02-a.png", "Mexico"), flag("q02-b.png", "Surinam"), flag("q02-c.png", "Peru"), flag("q02-d.png", "Colombia")],
    correct: 0,
  },
  {
    id: "noruegas",
    prompt: "Amazonas er verdens største tropiske skog. Hvor mange ganger får Norges areal plass i Brasils Amazônia Legal?",
    options: [num("2"), num("3"), num("13"), num("33")],
    correct: 2,
  },
  {
    id: "arara",
    prompt:
      "Araer flyr gjerne parvis. Arter som finnes i Amazonas, kan bli opptil 90 cm lange. Hvilket av disse dyrene er en araen?",
    options: [
      img("q04-a.jpg", "Rød fugl med blå og grønne vinger på en trestubbe"),
      img("q04-b.jpg", "Grønn papegøye med gult hode"),
      img("q04-c.jpg", "Hvit hegre blant vannplanter"),
      img("q04-d.jpg", "Hegre med blått nebb i vannet"),
    ],
    correct: 0,
  },
  {
    id: "acai",
    prompt: "I Amazonas spises açaí gjerne sammen med fisk og kassavamel. Vet du hvordan açaífrukten ser ut?",
    options: [
      img("q05-a.jpg", "Hender over små, mørk lilla frukter"),
      img("q05-b.jpg", "Hånd med røde og svarte frø"),
      img("q05-c.jpg", "Bolle med hvite korn"),
      img("q05-d.jpg", "Blanke brune frø"),
    ],
    correct: 0,
  },
  {
    id: "apex",
    prompt:
      "ApexBrasil støtter bedrifter og samvirker i Amazonas slik at de kan eksportere produktene sine til hele verden. Hvilket av disse produktene er ikke produsert av en brasiliansk bedrift?",
    options: [
      img("q06-a.jpg", "Pose med ristede açaífrø fra Raízes do Açaí"),
      img("q06-b.jpg", "Pose med tapiokagranola fra Manioca"),
      img("q06-c.jpg", "Eske med frosne torskestykker fra Riberalves"),
      img("q06-d.jpg", "Pose med kaffe fra Harufo ved siden av en kaffekopp"),
    ],
    // Riberalves (bacalhau) é um produto de Portugal; os demais são de empresas brasileiras
    correct: 2,
  },
  {
    id: "povos",
    prompt: "Amazonas har over 180 urfolk. Hvilket av disse urfolkene lever ikke i Amazonas?",
    options: [
      img("q07-a.jpg", "Menn med fargerike fjærpryder og kroppsmaling"),
      img("q07-b.jpg", "Tre kvinner som sitter på et tregulv"),
      img("q07-c.jpg", "Familie foran et trehus"),
      img("q07-d.jpg", "Gruppe i røde drakter og hvite fjærhatter"),
    ],
    correct: 3,
  },
  {
    id: "babacu",
    prompt:
      "Babassu er en frukt som blant annet brukes til å lage olje, mel og trekull. Hvilket bilde viser noen som knekker en babassunøtt?",
    options: [
      img("q08-a.jpg", "Hender som holder en bomullsdott"),
      img("q08-b.jpg", "Hender som knekker en nøtt mot et økseblad"),
      img("q08-c.jpg", "Hånd som sorterer frø i en sil"),
      img("q08-d.jpg", "Kvinne som rører mel i en stor panne"),
    ],
    correct: 1,
  },
  {
    id: "barcos",
    prompt:
      "Folk bruker ulike typer båter for å ferdes på sideelvene i Amazonas. Hvilken av disse båtene er ikke typisk for regionen?",
    options: [
      img("q09-a.jpg", "Passasjerbåt i to etasjer på en elv"),
      img("q09-b.jpg", "Kano med motor på en bred elv"),
      img("q09-c.jpg", "Grønn båt sett ovenfra på en mørk elv"),
      img("q09-d.jpg", "Lang, utskåret trekano på gresset"),
    ],
    correct: 3,
  },
  {
    id: "fundo",
    prompt:
      "Alle landene nedenfor er givere til Amazonasfondet og støtter bevaringen av skogen. Men hvilket av dem har gitt mest penger?",
    options: [
      flag("q10-a.png", "Tyskland"),
      flag("q10-b.png", "Storbritannia"),
      flag("q10-c.png", "Norge"),
      flag("q10-d.png", "Japan"),
    ],
    correct: 2,
  },
];

/** Faixas de resultado (0–4 / 5–7 / 8–10), da maior pontuação mínima para a menor. */
export const RESULT_TIERS = [
  {
    min: 8,
    title: "Du er klar til å beskytte Amazonas!",
    message: "Besøk utstillingen og oppdag enda mer om Amazonas og historiene til dem som tar vare på skogen.",
  },
  {
    min: 5,
    title: "Nesten i mål!",
    message: "Besøk utstillingen og bli klar til å bli en vokter av Amazonas!",
  },
  {
    min: 0,
    title: "Alle voktere må begynne et sted!",
    message: "Besøk utstillingen og lær mer om Amazonas!",
  },
];

export const tierFor = (score) => RESULT_TIERS.find((t) => score >= t.min) ?? RESULT_TIERS.at(-1);

/** Faixa mais alta: ganha fanfarra e destaque no título. */
export const isTopTier = (score) => tierFor(score) === RESULT_TIERS[0];
