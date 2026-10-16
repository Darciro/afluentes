/** Breadcrumb de progresso: um segmento por pergunta. */
export default function ProgressSteps({ questions, index }) {
  return (
    <ol
      className="m-0 grid list-none grid-cols-10 gap-1 p-0"
      aria-label={`Pergunta ${index + 1} de ${questions.length}`}
    >
      {questions.map((q, i) => (
        <li
          key={q.id}
          className={`h-2.5 border-[1.5px] border-gq-blue-2 transition-colors duration-300 ${
            i <= index ? "bg-gq-blue-2" : ""
          }`}
          aria-current={i === index ? "step" : undefined}
        />
      ))}
    </ol>
  );
}
