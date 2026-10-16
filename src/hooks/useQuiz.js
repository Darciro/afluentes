import { useEffect, useState } from "react";
import { GUARDIAN_SCORE } from "../data/questions";
import { trackFinish, trackStart } from "../lib/tracking";

const preload = (question) =>
  question?.options.forEach((o) => {
    new Image().src = o.image;
  });

/** Estado e transições do quiz: início → perguntas → resultado. */
export function useQuiz(questions, sfx) {
  const [phase, setPhase] = useState("start");
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [answers, setAnswers] = useState([]);

  const question = questions[index];
  const score = answers.filter(Boolean).length;

  // Pré-carrega as imagens da pergunta atual (na tela inicial) e da próxima
  useEffect(() => {
    preload(questions[phase === "start" ? index : index + 1]);
  }, [phase, index, questions]);

  const start = () => {
    sfx.unlock();
    setIndex(0);
    setPicked(null);
    setAnswers([]);
    setPhase("question");
    trackStart(questions.length);
  };

  const choose = (i) => {
    if (picked !== null) return;
    const ok = i === question.correct;
    setPicked(i);
    setAnswers((a) => [...a, ok]);
    if (ok) {
      sfx.correct();
    } else {
      sfx.wrong();
      navigator.vibrate?.(60);
    }
  };

  const next = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPicked(null);
      return;
    }
    setPhase("result");
    trackFinish(answers);
    if (score >= GUARDIAN_SCORE) sfx.fanfare();
  };

  return { phase, index, question, picked, answers, score, start, choose, next };
}
