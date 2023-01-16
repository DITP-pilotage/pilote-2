export function calculerMoyenne(valeurs: (number | null)[]) {
  const valeursFiltrées = valeurs.filter((valeur): valeur is number => valeur !== null);
  const somme = valeursFiltrées.reduce(
    (accumulateur, valeur) => accumulateur + valeur,
    0,
  );

  return valeursFiltrées.length === 0 ? null : somme / valeursFiltrées.length;
}
