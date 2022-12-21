import { normaliserChaîneDeCaractères } from '@/client/utils/strings';

function recherche(texte: string, valeurDeLaRecherche: string): boolean {
  return normaliserChaîneDeCaractères(texte)
    .includes(normaliserChaîneDeCaractères(valeurDeLaRecherche));
}

export default recherche;
