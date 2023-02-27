import { territoiresComparésTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { IndicateurMétriques } from '@/server/domain/indicateur/Indicateur.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { IndicateurDonnéesParTerritoire } from './Indicateurs.interface';

export default function useIndicateurs(indicateurMétriques: Record<CodeInsee, IndicateurMétriques>) {
  const territoiresComparés = territoiresComparésTerritoiresStore();

  const indicateurDonnéesParTerritoires: IndicateurDonnéesParTerritoire[] = territoiresComparés.map(territoire => ({ territoire: territoire.nom, données: indicateurMétriques[territoire.codeInsee] }));

  return { indicateurDonnéesParTerritoires };
}
