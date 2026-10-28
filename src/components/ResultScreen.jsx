import { RESULT_TIERS, isTopTier, tierFor } from "../data/questions";
import { UI } from "../data/strings";
import { useFocusOnChange } from "../hooks/useFocusOnChange";
import { CTA, GROW, SCREEN, STACK } from "../styles/classes";
import { ReplayIcon } from "./icons";

export default function ResultScreen({ score, total, answers, posterSrc, logoSrc, onRestart, tools }) {
  const headingRef = useFocusOnChange();
  const tier = tierFor(score);
  const halo = isTopTier(score);
  const almost = tier === RESULT_TIERS[1];

  return (
    <section className={`${SCREEN} bg-gq-night text-white`} aria-labelledby="gq-r-title">
      <div
        className="absolute -inset-5 bg-cover bg-[50%_30%] blur-[6px] saturate-[.8]"
        style={{ backgroundImage: `url(${posterSrc})` }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[rgba(20,14,10,.78)]" aria-hidden="true" />
      <div className={STACK}>
        <div className="flex w-full items-center justify-between">
          <img className="h-auto w-[150px]" src={logoSrc} alt="Afluentes" />
          {tools}
        </div>
        <div className={GROW} />
        <div
          className={`flex flex-col items-center ${
            halo
              ? "size-[200px] animate-gq-halo justify-center rounded-full bg-[rgba(20,14,10,.55)] motion-reduce:shadow-[0_0_0_4px_var(--color-gq-gold),0_0_40px_10px_rgba(255,210,63,.55)]"
              : ""
          }`}
        >
          <span className="text-sm font-semibold tracking-[.14em] text-white/85 uppercase">{UI.scoreA}</span>
          <span
            className={`mt-1.5 animate-gq-pop-score font-display leading-[.9] font-normal tracking-[.01em] text-gq-gold ${
              halo ? "text-[96px]" : "text-[112px]"
            }`}
          >
            {score}
            <small className="text-[.46em] text-white">/{total}</small>
          </span>
        </div>
        <ol
          className="mx-0 mt-6 mb-0 grid w-full max-w-[280px] list-none grid-cols-10 gap-[5px] p-0"
          aria-label={`${UI.scoreA} ${UI.scoreB(score, total)}`}
        >
          {answers.map((ok, i) => (
            <li key={i} className={`h-2.5 ${ok ? "bg-[#34B24A]" : "bg-[#E4223F]"}`} />
          ))}
        </ol>
        <h1
          id="gq-r-title"
          ref={headingRef}
          tabIndex={-1}
          className={`mx-0 mt-8 mb-0 font-display leading-none font-normal tracking-[.01em] text-balance focus:outline-none ${
            almost ? "text-[64px]" : "text-[clamp(34px,10.5vw,44px)]"
          }`}
        >
          {tier.title}
        </h1>
        <p className="mx-0 mt-4 mb-0 max-w-[320px] text-[17px] leading-[1.35] font-semibold text-pretty text-white/85">
          {tier.message}
        </p>
        <div className={GROW} />
        <button type="button" className={`${CTA} mt-0 text-[clamp(24px,7vw,30px)] whitespace-nowrap`} onClick={onRestart}>
          <ReplayIcon /> {UI.playAgain}
        </button>
      </div>
    </section>
  );
}
