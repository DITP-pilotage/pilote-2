function uniformiserChaîneDeCaractères(chaîneDeCaractères: string) {
  return chaîneDeCaractères
    .trim()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036F]/g, ''); // Enlève les diacritiques
}

function recherche(texte: string, valeurDeLaRecherche: string): boolean {
  return uniformiserChaîneDeCaractères(texte)
    .includes(uniformiserChaîneDeCaractères(valeurDeLaRecherche));
}

export default recherche;
