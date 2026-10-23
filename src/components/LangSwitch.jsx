import { LANG_GROUP_LABEL, LANG_META, LANGS } from "../i18n/strings";
import { useLang } from "../i18n/useLang";
import { FOCUS } from "../styles/classes";

/**
 * Seletor de idioma.
 * @param {"full" | "compact"} variant "full" = nomes por extenso (tela inicial, fundo escuro); "compact" = PT | NO.
 */
export default function LangSwitch({ variant = "compact" }) {
  const { lang, setLang } = useLang();
  const full = variant === "full";

  return (
    <div
      role="group"
      aria-label={LANG_GROUP_LABEL}
      className={`flex gap-0.5 rounded-full p-[3px] ${full ? "border border-white/40 bg-black/35" : "border-[1.5px] border-gq-blue"}`}
    >
      {LANGS.map((l) => {
        const on = l === lang;
        return (
          <button
            key={l}
            type="button"
            lang={LANG_META[l].htmlLang}
            aria-pressed={on}
            aria-label={full ? undefined : LANG_META[l].name}
            className={`min-w-11 cursor-pointer rounded-full border-none font-body text-sm transition-colors duration-200 ${FOCUS} ${
              full
                ? `h-[38px] px-3.5 ${on ? "bg-white font-extrabold text-gq-night" : "bg-transparent font-semibold text-white"}`
                : `h-9 px-2.5 font-extrabold tracking-[.04em] ${on ? "bg-gq-blue text-white" : "bg-transparent text-gq-blue"}`
            }`}
            onClick={() => setLang(l)}
          >
            {full ? LANG_META[l].name : LANG_META[l].short}
          </button>
        );
      })}
    </div>
  );
}
