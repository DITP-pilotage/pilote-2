import { mailleAssociéeAuTerritoireSélectionnéTerritoiresStore, territoiresComparésTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { IndicateurDonnéesParTerritoire } from './Indicateurs.interface';

export default function useIndicateurs(indicateur: Indicateur) {
  const mailleSéléctionnée = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();
  const territoiresComparés = territoiresComparésTerritoiresStore();

  const indicateurDonnéesParTerritoires: IndicateurDonnéesParTerritoire[] = territoiresComparés.map(territoire => ({ territoire: territoire.nom, données: indicateur.mailles[mailleSéléctionnée][territoire.codeInsee] }));

  return { indicateurDonnéesParTerritoires };
}
