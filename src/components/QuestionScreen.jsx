import { LETTERS } from "../data/questions";
import { UI } from "../data/strings";
import { useFocusOnChange } from "../hooks/useFocusOnChange";
import { FOCUS, SCREEN } from "../styles/classes";
import { ArrowIcon } from "./icons";
import OptionCard from "./OptionCard";
import ProgressSteps from "./ProgressSteps";
import SideBorder from "./SideBorder";

function optionState(i, picked, correct) {
  if (picked === null) return "idle";
  if (i === correct) return "correct";
  return i === picked ? "wrong" : "muted";
}

export default function QuestionScreen({ questions, index, question, picked, logoSrc, onChoose, onNext, tools }) {
  const headingRef = useFocusOnChange(index);
  const total = questions.length;
  const revealed = picked !== null;
  const isRight = picked === question.correct;

  return (
    <section className={`${SCREEN} bg-gq-cream`} aria-labelledby="gq-q-title">
      <SideBorder />
      <div className="flex min-w-0 flex-auto flex-col gap-5 px-5 pt-5 pb-[max(28px,env(safe-area-inset-bottom))]">
        <img className="-mb-1.5 block h-auto w-[170px]" src={logoSrc} alt="Afluentes" />
        <div className="flex w-full items-center justify-between">
          <span className="text-sm font-semibold text-gq-blue">
            {UI.counter(index + 1, total)}
          </span>
          {tools}
        </div>

        <ProgressSteps questions={questions} index={index} />

        <h1
          id="gq-q-title"
          ref={headingRef}
          tabIndex={-1}
          key={question.id}
          className="mt-1 mb-0 animate-gq-in text-[clamp(20px,5.9vw,26px)] leading-[1.22] font-extrabold text-pretty text-gq-blue focus:outline-none"
        >
          {question.prompt}
        </h1>

        <div className="mt-1 grid grid-cols-2 gap-3" role="group" aria-label={UI.options}>
          {question.options.map((opt, i) => (
            <OptionCard
              key={`${question.id}-${i}`}
              option={opt}
              letter={LETTERS[i]}
              delay={i * 0.05}
              state={optionState(i, picked, question.correct)}
              onClick={() => onChoose(i)}
            />
          ))}
        </div>

        <div className="mt-auto flex min-h-14 items-center justify-between gap-3" aria-live="polite">
          {!revealed ? (
            <p className="mx-auto my-0 text-center text-sm text-[#4A4238]">{UI.hint}</p>
          ) : (
            <>
              <p
                className={`m-0 animate-gq-pop font-display text-[32px] leading-none font-normal tracking-[.01em] ${
                  isRight ? "text-gq-green" : "text-gq-red-2"
                }`}
              >
                {isRight ? UI.correct : UI.wrong}
              </p>
              <button
                type="button"
                className={`flex h-13 shrink-0 animate-gq-in-late cursor-pointer items-center gap-2 rounded-full border-none bg-gq-blue px-[22px] font-body text-base font-extrabold text-white ${FOCUS}`}
                onClick={onNext}
                autoFocus
              >
                {index + 1 >= total ? UI.seeResult : UI.next} <ArrowIcon />
              </button>
            </>
          )}
        </div>
      </div>
      <SideBorder flip />
    </section>
  );
}
