import { normaliserChaîneDeCaractères } from '@/client/utils/strings';

function rechercheUnTexteContenuDansUnContenant(texteRecherché: string, texteContenant: string): boolean {
  return normaliserChaîneDeCaractères(texteContenant)
    .includes(normaliserChaîneDeCaractères(texteRecherché));
}

export default rechercheUnTexteContenuDansUnContenant;
