import { useCallback, useEffect, useRef } from "react";

export const useAutosave = ({ onAutosave }: { onAutosave?: () => void }) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const onAutosaveRef = useRef(onAutosave);

  useEffect(() => {
    onAutosaveRef.current = onAutosave;
  }, [onAutosave]);

  const onChange = useCallback(() => {
    if (!onAutosaveRef.current) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onAutosaveRef.current?.();
    }, 400);
  }, []);

  const onBlur = useCallback(() => {
    if (!onAutosaveRef.current) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    onAutosaveRef.current();
  }, []);

  return { onChange, onBlur };
};
