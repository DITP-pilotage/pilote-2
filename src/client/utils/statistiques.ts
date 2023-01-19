function filtrerValeurs(valeurs: (number | null)[]) {
  return valeurs.filter((valeur): valeur is number => valeur !== null);
}

export function calculerMoyenne(valeurs: (number | null)[]) {
  const valeursFiltrées = filtrerValeurs(valeurs);
  const somme = valeursFiltrées.reduce(
    (accumulateur, valeur) => accumulateur + valeur,
    0,
  );

  return valeursFiltrées.length === 0 ? null : somme / valeursFiltrées.length;
}

export function calculerMédiane(valeurs: (number | null)[]) {
  const valeursFiltrées = filtrerValeurs(valeurs);
  valeursFiltrées.sort((a, b) => a - b);
  const longueur = valeursFiltrées.length;
  
  return longueur % 2 === 0 ? (valeursFiltrées[longueur / 2 - 1] + valeursFiltrées[longueur / 2]) / 2 : valeursFiltrées[(longueur - 1) / 2];
}

export function valeurMinimum(valeurs: (number | null)[]) {
  const valeursFiltrées = filtrerValeurs(valeurs);
  return Math.min(...valeursFiltrées);
}


export function valeurMaximum(valeurs: (number | null)[]) {
  const valeursFiltrées = filtrerValeurs(valeurs);
  return Math.max(...valeursFiltrées);
}
