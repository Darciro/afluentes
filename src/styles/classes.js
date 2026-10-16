/* Classes Tailwind compartilhadas entre componentes. */

/** Anel de foco visível para elementos interativos. */
export const FOCUS = "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-gq-gold";

/** Tela no formato celular; centralizada com cantos arredondados em telas maiores. */
export const SCREEN =
  "relative flex min-h-dvh w-full max-w-[480px] overflow-hidden min-[481px]:my-auto min-[481px]:min-h-[min(100dvh,920px)] min-[481px]:rounded-[28px]";

/** Coluna centralizada das telas de início e resultado. */
export const STACK =
  "relative z-[1] flex w-full flex-col items-center px-6 pt-6 pb-[max(40px,env(safe-area-inset-bottom))] text-center";

export const GROW = "min-h-4 flex-auto";

export const CTA = `flex h-16 w-full max-w-[300px] cursor-pointer items-center justify-center gap-2.5 rounded-full border-none bg-gq-red font-display tracking-[.06em] text-white shadow-[0_10px_30px_rgba(216,30,58,.45)] transition-transform duration-[120ms] ease-in-out active:scale-[.97] ${FOCUS}`;

