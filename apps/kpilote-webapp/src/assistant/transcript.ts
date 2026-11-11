/** Ce que la dictée a reconnu, ajouté à la suite de ce qui est déjà saisi. */
export const appendTranscript = (current: string, transcript: string): string => {
  const text = transcript.trim()
  if (!text) return current
  const before = current.trimEnd()
  return before ? `${before} ${text}` : text
}
