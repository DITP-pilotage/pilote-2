import { filtrerValeurs } from '@/client/utils/statistiques/statistiques';

export const presenterEnTauxAvancementGlobalTerritoireContrat = (listeTauxAvancementGlobal: (number | null)[]): number | null => {

  const valeursFiltrées = filtrerValeurs(listeTauxAvancementGlobal);
  const somme = valeursFiltrées.reduce(
    (accumulateur, valeur) => accumulateur + valeur, 0,
  );

  return valeursFiltrées.length === 0 ? null : somme / valeursFiltrées.length;
};
