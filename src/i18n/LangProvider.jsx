import { useEffect, useState } from "react";
import { detectLang, LANG_META, saveLang, UI } from "./strings";
import { LangContext } from "./useLang";

/** Guarda o idioma atual; trocar no meio do quiz mantém progresso e respostas, só o texto muda. */
export default function LangProvider({ defaultLang = "pt", children }) {
  const [lang, setLangState] = useState(() => detectLang(defaultLang));

  useEffect(() => {
    document.documentElement.lang = LANG_META[lang].htmlLang;
    document.title = UI[lang].docTitle;
  }, [lang]);

  const setLang = (l) => {
    setLangState(l);
    saveLang(l);
  };

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}
