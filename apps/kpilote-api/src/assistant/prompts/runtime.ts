export const buildRuntimeContext = ({ now }: { now: Date }): string =>
  `Contexte du tour :
- Date du jour : ${now.toISOString().slice(0, 10)}`
