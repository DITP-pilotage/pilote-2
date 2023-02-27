export const interpolerCouleurs = (couleurDépart: string, couleurArrivée: string, pourcentage: number): `#${string}` => {
  // retire le '#' s'il est présent
  couleurDépart = couleurDépart.replace(/^\s*#|\s*$/g, '');
  couleurArrivée = couleurArrivée.replace(/^\s*#|\s*$/g, '');

  // gère le cas du code hexadécimal abbrégé en 3 caractères
  if (couleurDépart.length === 3) {
    couleurDépart = couleurDépart.replace(/(.)/g, '$1$1');
  }

  if (couleurArrivée.length === 3) {
    couleurArrivée = couleurArrivée.replace(/(.)/g, '$1$1');
  }

  // interprète le code hexadécimal en valeur numérique
  const rougeDépart = Number.parseInt(couleurDépart.slice(0, 2), 16);
  const vertDépart = Number.parseInt(couleurDépart.slice(2, 4), 16);
  const bleuDépart = Number.parseInt(couleurDépart.slice(4, 6), 16);

  const rougeArrivée = Number.parseInt(couleurArrivée.slice(0, 2), 16);
  const vertArrivée = Number.parseInt(couleurArrivée.slice(2, 4), 16);
  const bleuArrivée = Number.parseInt(couleurArrivée.slice(4, 6), 16);

  // réalise l'interpolation linéaire entre les deux couleurs
  let rouge = rougeArrivée - rougeDépart;
  let vert = vertArrivée - vertDépart;
  let bleu = bleuArrivée - bleuDépart;

  rouge = ((rouge * pourcentage / 100) + rougeDépart);
  vert = ((vert * pourcentage / 100) + vertDépart);
  bleu = ((bleu * pourcentage / 100) + bleuDépart);

  // empêche les valeurs de sortir de l'intervalle défini entre la couleur de départ et d'arrivée
  const rougeMin = Math.min(rougeDépart, rougeArrivée);
  const vertMin = Math.min(vertDépart, vertArrivée);
  const bleuMin = Math.min(bleuDépart, bleuArrivée);

  const rougeMax = Math.max(rougeDépart, rougeArrivée);
  const vertMax = Math.max(vertDépart, vertArrivée);
  const bleuMax = Math.max(bleuDépart, bleuArrivée);

  rouge = Math.min(rougeMax, Math.max(rougeMin, rouge));
  vert = Math.min(vertMax, Math.max(vertMin, vert));
  bleu = Math.min(bleuMax, Math.max(bleuMin, bleu));

  let hexaRouge = rouge.toString(16).split('.')[0];
  let hexaVert = vert.toString(16).split('.')[0];
  let hexaBleu = bleu.toString(16).split('.')[0];

  // force la couleur à avoir deux digits
  if (hexaRouge.length === 1) hexaRouge = '0' + hexaRouge;
  if (hexaVert.length === 1) hexaVert = '0' + hexaVert;
  if (hexaBleu.length === 1) hexaBleu = '0' + hexaBleu;

  return `#${hexaRouge}${hexaVert}${hexaBleu}`;
};
