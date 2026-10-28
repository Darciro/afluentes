import { useState } from "react";
import QuestionScreen from "./components/QuestionScreen";
import ResultScreen from "./components/ResultScreen";
import SoundToggle from "./components/SoundToggle";
import StartScreen from "./components/StartScreen";
import { ASSETS, DEFAULT_QUESTIONS } from "./data/questions";
import { useFullscreen } from "./hooks/useFullscreen";
import { useQuiz } from "./hooks/useQuiz";
import { useSfx } from "./hooks/useSfx";

export default function App({
  questions = DEFAULT_QUESTIONS,
  videoSrc = ASSETS.video,
  posterSrc = ASSETS.poster,
  logoSrc = ASSETS.logo,
  soundDefault = true,
}) {
  const [sound, setSound] = useState(soundDefault);
  const sfx = useSfx(sound);
  const quiz = useQuiz(questions, sfx);
  const fullscreen = useFullscreen();

  // O toque em "Jogar" é o gesto do usuário que o navegador exige para entrar em tela cheia
  const start = () => {
    void fullscreen.enter();
    quiz.start();
  };

  const toggleSound = () => {
    sfx.unlock();
    setSound((s) => !s);
  };

  const tools = <SoundToggle on={sound} onToggle={toggleSound} />;

  return (
    <div className="flex min-h-dvh justify-center bg-gq-night font-body text-gq-ink [-webkit-tap-highlight-color:transparent] min-[481px]:items-center min-[481px]:py-6">
      {quiz.phase === "start" && (
        <StartScreen
          videoSrc={videoSrc}
          posterSrc={posterSrc}
          logoSrc={logoSrc}
          onStart={start}
          tools={<SoundToggle on={sound} onToggle={toggleSound} dark />}
        />
      )}

      {quiz.phase === "question" && quiz.question && (
        <QuestionScreen
          questions={questions}
          index={quiz.index}
          question={quiz.question}
          picked={quiz.picked}
          logoSrc={logoSrc}
          onChoose={quiz.choose}
          onNext={quiz.next}
          tools={tools}
        />
      )}

      {quiz.phase === "result" && (
        <ResultScreen
          score={quiz.score}
          total={questions.length}
          answers={quiz.answers}
          posterSrc={posterSrc}
          logoSrc={logoSrc}
          onRestart={quiz.start}
          tools={tools}
        />
      )}
    </div>
  );
}
