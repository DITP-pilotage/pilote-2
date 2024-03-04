import { filtrerValeurs } from '@/client/utils/statistiques/statistiques';

export const presenterEnTauxAvancementAnnuelTerritoireContrat = (listeTauxAvancementAnnuel: (number | null)[]): number | null => {

  const valeursFiltrées = filtrerValeurs(listeTauxAvancementAnnuel);
  const somme = valeursFiltrées.reduce(
    (accumulateur, valeur) => accumulateur + valeur, 0,
  );

  return valeursFiltrées.length === 0 ? null : somme / valeursFiltrées.length;
};
