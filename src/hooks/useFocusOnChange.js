import { useEffect, useRef } from "react";

/** Move o foco para o elemento sempre que `key` muda (leitores de tela). */
export function useFocusOnChange(key) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus();
  }, [key]);
  return ref;
}
