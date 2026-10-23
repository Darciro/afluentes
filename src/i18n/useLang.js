import { createContext, useContext } from "react";
import { UI } from "./strings";

export const LangContext = createContext(null);

/**
 * `t`: textos da interface no idioma atual.
 * `tx`: escolhe o idioma de um texto do conteúdo ({ pt, no }); strings simples passam direto.
 */
export function useLang() {
  const { lang, setLang } = useContext(LangContext);
  const tx = (v) => (typeof v === "string" ? v : (v?.[lang] ?? v?.pt));
  return { lang, setLang, t: UI[lang], tx };
}
