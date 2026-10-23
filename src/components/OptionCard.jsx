import { useLang } from "../i18n/useLang";
import { FOCUS } from "../styles/classes";
import { CheckIcon, XIcon } from "./icons";

/** Revelação: certa colorida + luz; demais em P&B. */
const MEDIA_STATE_CLASS = {
  idle: "group-active:scale-[.98]",
  correct: "animate-gq-glow motion-reduce:shadow-[0_0_0_3px_#2E9A3E,0_0_18px_6px_rgba(72,190,90,.7)]",
  wrong: "animate-gq-shake shadow-[0_0_0_3px_var(--color-gq-red-2)]",
  muted: "",
};

/**
 * Uma alternativa: foto, mapa/bandeira (com legenda opcional) ou número.
 * @param {"idle" | "correct" | "wrong" | "muted"} state
 */
export default function OptionCard({ option, letter, delay, state, onClick }) {
  const { t, tx } = useLang();
  const idle = state === "idle";
  const faded = state === "wrong" || state === "muted";
  const isImage = option.kind === "image";
  const contain = isImage && option.fit === "contain";
  const caption = isImage ? tx(option.caption) : undefined;
  const name = caption ?? tx(option.alt) ?? option.text;
  const suffix = state === "correct" ? ` — ${t.isCorrect}` : state === "wrong" ? ` — ${t.yourAnswer}` : "";

  return (
    <button
      type="button"
      className={`group relative flex animate-gq-in cursor-pointer flex-col border-none bg-none p-0 font-[inherit] text-inherit disabled:cursor-default ${FOCUS}`}
      style={{ animationDelay: `${delay}s` }}
      onClick={onClick}
      disabled={!idle}
      aria-label={`${letter.toUpperCase()}: ${name}${suffix}`}
    >
      <span
        className={`relative grid w-full place-items-center overflow-hidden ${caption ? "aspect-[4/3]" : "aspect-square"} ${
          contain ? "px-1 pt-[34px] pb-1" : ""
        } ${MEDIA_STATE_CLASS[state]}`}
      >
        {isImage ? (
          <img
            src={option.src}
            alt=""
            decoding="async"
            draggable={false}
            className={`block size-full select-none transition-[filter,opacity] duration-[450ms] ${
              contain ? "object-contain" : "object-cover"
            } ${faded ? "opacity-50 grayscale" : ""}`}
          />
        ) : (
          <span
            className={`text-[clamp(56px,17vw,80px)] leading-none font-extrabold transition-colors duration-[450ms] ${
              faded ? "text-[#9C958B]" : "text-gq-red"
            }`}
          >
            {option.text}
          </span>
        )}
      </span>
      {caption && (
        <span
          className={`mt-1.5 text-center text-base font-extrabold transition-colors duration-[450ms] ${faded ? "text-[#9C958B]" : ""}`}
        >
          {caption}
        </span>
      )}
      <span
        className={`absolute top-0 left-0 grid size-[34px] place-items-center font-[Georgia,serif] text-[22px] font-bold text-white transition-colors duration-300 ${
          state === "correct" ? "bg-gq-green" : faded ? "bg-gq-red-2" : "bg-gq-blue"
        }`}
        aria-hidden="true"
      >
        {letter}
      </span>
      {(state === "correct" || state === "wrong") && (
        <span
          className={`absolute top-2 right-2 grid size-[34px] animate-gq-pop-spring place-items-center rounded-full text-white ${
            state === "correct" ? "bg-gq-green" : "bg-gq-red-2"
          }`}
          aria-hidden="true"
        >
          {state === "correct" ? <CheckIcon /> : <XIcon />}
        </span>
      )}
    </button>
  );
}
