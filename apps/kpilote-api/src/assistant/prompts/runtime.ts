export const construireContexteRuntime = ({ maintenant }: { maintenant: Date }): string =>
  `Contexte du tour :
- Date du jour : ${maintenant.toISOString().slice(0, 10)}`
