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
 * ou um número/texto grande. Textos no formato { pt, no } (ver src/i18n).
 */
const img = (file, pt, no, extra = {}) => ({ kind: "image", src: `${QUIZ_ASSETS}/${file}`, alt: { pt, no }, fit: "cover", ...extra });
const map = (file, pt, no) => img(file, pt, no, { fit: "contain" });
const flag = (file, pt, no) => img(file, pt, no, { fit: "contain", caption: { pt, no } });
const num = (n) => ({ kind: "text", text: n, alt: n });

/** Textos e gabarito do PDF "quiz". Índice da correta: 0 = a, 1 = b, 2 = c, 3 = d. Norueguês: revisar com falante nativo. */
export const DEFAULT_QUESTIONS = [
  {
    id: "mapa",
    prompt: {
      pt: "Cerca de 60% da Amazônia fica no Brasil. Você sabe onde se localiza no mapa?",
      no: "Rundt 60 % av Amazonas ligger i Brasil. Vet du hvor det er på kartet?",
    },
    options: [
      map("q01-a.png", "Mapa com destaque na África Central", "Kart med markering i Sentral-Afrika"),
      map("q01-b.png", "Mapa com destaque no Sudeste Asiático", "Kart med markering i Sørøst-Asia"),
      map("q01-c.png", "Mapa com destaque no norte da América do Sul", "Kart med markering nord i Sør-Amerika"),
      map("q01-d.png", "Mapa com destaque na Austrália", "Kart med markering i Australia"),
    ],
    correct: 2,
  },
  {
    id: "ccpi",
    prompt: {
      pt: "O Centro de Cooperação Policial Internacional da Amazônia reúne 9 países para proteger a região de ameaças como o garimpo ilegal e o tráfico. Qual desses não faz parte?",
      no: "Det internasjonale politisamarbeidssenteret for Amazonas samler 9 land for å beskytte regionen mot trusler som ulovlig gullgraving og smugling. Hvilket av disse landene er ikke med?",
    },
    options: [
      flag("q02-a.png", "Uruguai", "Uruguay"),
      flag("q02-b.png", "Suriname", "Surinam"),
      flag("q02-c.png", "Peru", "Peru"),
      flag("q02-d.png", "Colômbia", "Colombia"),
    ],
    correct: 0,
  },
  {
    id: "noruegas",
    prompt: {
      pt: "A Amazônia é a maior floresta tropical do mundo. Quantas Noruegas caberiam dentro da Amazônia Legal brasileira?",
      no: "Amazonas er verdens største tropiske regnskog. Hvor mange ganger får Norge plass i det brasilianske Amazonas-området (Amazônia Legal)?",
    },
    options: [num("2"), num("3"), num("13"), num("33")],
    correct: 2,
  },
  {
    id: "arara",
    prompt: {
      pt: "As araras costumam voar em dupla. Espécies encontradas na Amazônia podem medir até 90cm. Qual desses animais é a arara?",
      no: "Araer flyr ofte i par. Arter som finnes i Amazonas kan bli opptil 90 cm lange. Hvilket av disse dyrene er araen?",
    },
    options: [
      img("q04-a.jpg", "Ave vermelha com asas azuis e verdes pousada num tronco", "Rød fugl med blå og grønne vinger på en trestubbe"),
      img("q04-b.jpg", "Papagaio verde com cabeça amarela", "Grønn papegøye med gult hode"),
      img("q04-c.jpg", "Garça branca entre plantas aquáticas", "Hvit hegre blant vannplanter"),
      img("q04-d.jpg", "Garça de bico azul dentro d'água", "Hegre med blått nebb i vannet"),
    ],
    correct: 0,
  },
  {
    id: "acai",
    prompt: {
      pt: "Na Amazônia, o açaí costuma ser comido com peixe e farinha de mandioca. Você sabe como é o fruto do açaí?",
      no: "I Amazonas spises açaí ofte med fisk og maniokmel. Vet du hvordan açaí-frukten ser ut?",
    },
    options: [
      img("q05-a.jpg", "Mãos sobre frutinhas roxas escuras", "Hender over små, mørk lilla frukter"),
      img("q05-b.jpg", "Mão com sementes vermelhas e pretas", "Hånd med røde og svarte frø"),
      img("q05-c.jpg", "Tigela com grãos brancos", "Bolle med hvite korn"),
      img("q05-d.jpg", "Sementes marrons brilhantes", "Blanke brune frø"),
    ],
    correct: 0,
  },
  {
    id: "castanha",
    prompt: {
      pt: "A castanha-do-Brasil pode ser consumida em pratos salgados, doces ou ao natural. Você sabe qual dessas imagens vai virar a castanha que você come?",
      no: "Paranøtter kan spises i salte og søte retter eller som de er. Vet du hvilket av disse bildene som blir til paranøtten du spiser?",
    },
    options: [
      img("q06-a.jpg", "Sementes rajadas num saco", "Stripete frø i en sekk"),
      img("q06-b.jpg", "Pessoa carregando raízes grandes", "Person som bærer store røtter"),
      img("q06-c.jpg", "Mãos segurando sementes de casca escura e angulosa", "Hender som holder frø med mørkt, kantete skall"),
      img("q06-d.jpg", "Mãos segurando frutos vermelhos com casca escamosa", "Hender som holder røde frukter med skjellete skall"),
    ],
    correct: 2,
  },
  {
    id: "povos",
    prompt: {
      pt: "A Amazônia tem mais de 180 povos indígenas. Qual desses povos não vive na Amazônia?",
      no: "Amazonas har mer enn 180 urfolk. Hvilket av disse folkene bor ikke i Amazonas?",
    },
    options: [
      img("q07-a.jpg", "Homens com cocares coloridos e pintura corporal", "Menn med fargerike fjærpryder og kroppsmaling"),
      img("q07-b.jpg", "Três mulheres sentadas num assoalho de madeira", "Tre kvinner som sitter på et tregulv"),
      img("q07-c.jpg", "Família em frente a uma casa de madeira", "Familie foran et trehus"),
      img("q07-d.jpg", "Grupo com trajes vermelhos e chapéus de penas brancas", "Gruppe i røde drakter og hvite fjærhatter"),
    ],
    correct: 3,
  },
  {
    id: "babacu",
    prompt: {
      pt: "O babaçu é um fruto usado para fazer óleo, farinha, carvão, entre outros produtos. Qual foto mostra alguém manipulando o coco babaçu?",
      no: "Babassu er en frukt som brukes til å lage olje, mel, trekull og andre produkter. Hvilket bilde viser noen som bearbeider babassunøtter?",
    },
    options: [
      img("q08-a.jpg", "Mãos segurando um chumaço de algodão", "Hender som holder en bomullsdott"),
      img("q08-b.jpg", "Mãos quebrando um coco sobre a lâmina de um machado", "Hender som knekker en nøtt mot et økseblad"),
      img("q08-c.jpg", "Mão separando sementes numa peneira", "Hånd som sorterer frø i en sil"),
      img("q08-d.jpg", "Mulher mexendo farinha num grande tacho", "Kvinne som rører mel i en stor panne"),
    ],
    correct: 1,
  },
  {
    id: "barcos",
    prompt: {
      pt: "Para se navegar pelos afluentes amazônicos, a população utiliza vários tipos de embarcações. Qual desses barcos não é típico da região?",
      no: "For å ferdes på Amazonas' sideelver bruker folk mange typer båter. Hvilken av disse båtene er ikke typisk for regionen?",
    },
    options: [
      img("q09-a.jpg", "Barco de passageiros de dois andares num rio", "Passasjerbåt i to etasjer på en elv"),
      img("q09-b.jpg", "Canoa com motor de rabeta num rio largo", "Kano med motor på en bred elv"),
      img("q09-c.jpg", "Lancha verde vista de cima num rio escuro", "Grønn båt sett ovenfra på en mørk elv"),
      img("q09-d.jpg", "Canoa longa entalhada em madeira sobre a grama", "Lang, utskåret trekano på gresset"),
    ],
    correct: 3,
  },
  {
    id: "fundo",
    prompt: {
      pt: "Os países abaixo são todos doadores do Fundo Amazônia, apoiando a conservação da floresta. Mas qual deles doou mais recursos?",
      no: "Landene nedenfor har alle gitt penger til Amazonasfondet for å bevare skogen. Men hvilket av dem har gitt mest?",
    },
    options: [
      flag("q10-a.png", "Alemanha", "Tyskland"),
      flag("q10-b.png", "Reino Unido", "Storbritannia"),
      flag("q10-c.png", "Noruega", "Norge"),
      flag("q10-d.png", "Japão", "Japan"),
    ],
    correct: 2,
  },
];

/** Faixas de resultado do PDF (0–4 / 5–7 / 8–10), da maior pontuação mínima para a menor. */
export const RESULT_TIERS = [
  {
    min: 8,
    title: { pt: "Você está pronto para proteger a Amazônia!", no: "Du er klar til å beskytte Amazonas!" },
    message: {
      pt: "Visite a exposição e descubra ainda mais sobre a Amazônia e as histórias de quem cuida da floresta.",
      no: "Besøk utstillingen og oppdag enda mer om Amazonas og historiene til dem som tar vare på skogen.",
    },
  },
  {
    min: 5,
    title: { pt: "Quase lá!", no: "Nesten!" },
    message: {
      pt: "Visite a exposição e fique pronto para ser um guardião da Amazônia!",
      no: "Besøk utstillingen og bli klar til å bli en vokter av Amazonas!",
    },
  },
  {
    min: 0,
    title: { pt: "Todo guardião começa por algum lugar!", no: "Alle voktere må begynne et sted!" },
    message: {
      pt: "Visite a exposição e aprenda mais sobre a Amazônia!",
      no: "Besøk utstillingen og lær mer om Amazonas!",
    },
  },
];

export const tierFor = (score) => RESULT_TIERS.find((t) => score >= t.min) ?? RESULT_TIERS.at(-1);

/** Faixa mais alta: ganha fanfarra e destaque no título. */
export const isTopTier = (score) => tierFor(score) === RESULT_TIERS[0];
