import { FOCUS } from "../styles/classes";
import { CheckIcon, XIcon } from "./icons";

/** Revelação: certa colorida + luz; demais em P&B. */
const STATE_CLASS = {
  idle: "animate-gq-in",
  correct: "animate-gq-glow motion-reduce:shadow-[0_0_0_3px_#2E9A3E,0_0_18px_6px_rgba(72,190,90,.7)]",
  wrong: "animate-gq-shake shadow-[0_0_0_3px_var(--color-gq-red-2)]",
  muted: "",
};

/**
 * Uma alternativa de imagem.
 * @param {"idle" | "correct" | "wrong" | "muted"} state
 */
export default function OptionCard({ option, letter, delay, state, onClick }) {
  const idle = state === "idle";
  const faded = state === "wrong" || state === "muted";
  const suffix = state === "correct" ? " — resposta correta" : state === "wrong" ? " — sua resposta" : "";

  return (
    <button
      type="button"
      className={`group relative aspect-square cursor-pointer overflow-visible border-none bg-none p-0 disabled:cursor-default ${FOCUS} ${STATE_CLASS[state]}`}
      style={idle ? { animationDelay: `${delay}s` } : undefined}
      onClick={onClick}
      disabled={!idle}
      aria-label={`${letter.toUpperCase()}: ${option.alt}${suffix}`}
    >
      <img
        src={option.image}
        alt=""
        decoding="async"
        draggable={false}
        className={`block size-full object-cover select-none transition-[filter,opacity] duration-[450ms] ${
          faded ? "opacity-55 grayscale" : ""
        } ${idle ? "group-active:scale-[.98]" : ""}`}
      />
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
          className={`absolute right-2 bottom-2 grid size-9 animate-gq-pop-spring place-items-center rounded-full text-white ${
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
