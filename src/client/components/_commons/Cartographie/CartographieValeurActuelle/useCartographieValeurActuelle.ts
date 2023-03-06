import { useMemo } from 'react';
import { actionsTerritoiresStore, mailleSélectionnéeTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { CartographieDonnées } from '@/components/_commons/Cartographie/Cartographie.interface';
import { CartographieDonnéesValeurActuelle } from '@/components/_commons/Cartographie/CartographieValeurActuelle/CartographieValeurActuelle.interface';
import { valeurMaximum, valeurMinimum } from '@/client/utils/statistiques/statistiques';
import { interpolerCouleurs } from '@/client/utils/couleur/couleur';
import { TerritoireGéographique } from '@/stores/useTerritoiresStore/useTerritoiresStore.interface';

const COULEUR_DÉPART = '#8bcdb1';
const COULEUR_ARRIVÉE = '#083a25';
const REMPLISSAGE_PAR_DÉFAUT = '#bababa';

function déterminerValeurAffichée(valeur: number | null) {
  return valeur === null ? 'Non renseigné' : valeur.toLocaleString();
}

function déterminerRemplissage(valeur: number | null, valeurMin: number | null, valeurMax: number | null) {
  if (valeur === null || valeurMin === null || valeurMax === null)
    return REMPLISSAGE_PAR_DÉFAUT;

  const pourcentageInterpolation = 100 * (valeur - valeurMin) / (valeurMax - valeurMin);
  return interpolerCouleurs(COULEUR_DÉPART, COULEUR_ARRIVÉE, pourcentageInterpolation);
}

function déterminerLibellé(territoireGéographique: TerritoireGéographique | undefined, estDépartement: boolean) {
  if (!territoireGéographique)
    return '-';

  return estDépartement
    ? `${territoireGéographique.codeInsee} - ${territoireGéographique.nom}`
    : territoireGéographique.nom;
}

export default function useCartographieValeurActuelle(données: CartographieDonnéesValeurActuelle) {
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();

  const valeurMin = useMemo(() => valeurMinimum(données.map(donnée => donnée.valeur)), [données]);
  const valeurMax = useMemo(() => valeurMaximum(données.map(donnée => donnée.valeur)), [données]);

  const légende = useMemo(() => ({
    libellé: 'En nombre d’unités',
    valeurMin: valeurMin ? valeurMin.toLocaleString() : '-',
    valeurMax: valeurMax ? valeurMax.toLocaleString() : '-',
    couleurMin: COULEUR_DÉPART,
    couleurMax: COULEUR_ARRIVÉE,
  }), [valeurMax, valeurMin]);

  const donnéesCartographie = useMemo(() => {
    let donnéesFormatées: CartographieDonnées = {};

    données.forEach(({ valeur, codeInsee }) => {
      const territoireGéographique = récupérerDétailsSurUnTerritoire(codeInsee, mailleSélectionnée);
      donnéesFormatées[codeInsee] = {
        valeurAffichée: déterminerValeurAffichée(valeur),
        remplissage: déterminerRemplissage(valeur, valeurMin, valeurMax),
        libellé: déterminerLibellé(territoireGéographique, mailleSélectionnée === 'départementale'),
      };
    });

    return donnéesFormatées;
  }, [données, mailleSélectionnée, récupérerDétailsSurUnTerritoire, valeurMax, valeurMin]);

  return {
    légende,
    donnéesCartographie,
  };
}
