import { UI } from "../data/strings";
import { FOCUS } from "../styles/classes";
import { SoundIcon } from "./icons";

export default function SoundToggle({ on, onToggle, dark = false }) {
  return (
    <button
      type="button"
      className={`grid size-11 cursor-pointer place-items-center rounded-full border-[1.5px] ${FOCUS} ${
        dark ? "border-white/45 bg-black/35 text-white" : "border-gq-blue bg-transparent text-gq-blue"
      }`}
      aria-label={on ? UI.soundOff : UI.soundOn}
      aria-pressed={on}
      onClick={onToggle}
    >
      <SoundIcon on={on} />
    </button>
  );
}
