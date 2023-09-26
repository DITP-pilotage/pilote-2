import { useMemo } from 'react';
import { actionsTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { CartographieDonnées } from '@/components/_commons/Cartographie/Cartographie.interface';
import { CartographieDonnéesValeurActuelle } from '@/components/_commons/Cartographie/CartographieValeurActuelle/CartographieValeurActuelle.interface';
import { valeurMaximum, valeurMinimum } from '@/client/utils/statistiques/statistiques';
import { interpolerCouleurs } from '@/client/utils/couleur/couleur';

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

export default function useCartographieValeurActuelle(données: CartographieDonnéesValeurActuelle, unité?: string | null) {
  const { récupérerDétailsSurUnTerritoireAvecCodeInsee } = actionsTerritoiresStore();

  const valeurMin = useMemo(() => valeurMinimum(données.map(donnée => donnée.valeur)), [données]);
  const valeurMax = useMemo(() => valeurMaximum(données.map(donnée => donnée.valeur)), [données]);

  const légende = useMemo(() => ({
    libellé: unité === null || unité == undefined ? '' : `En ${unité.toLocaleLowerCase()}` ,
    valeurMin: valeurMin !== null ? valeurMin.toLocaleString() : '-',
    valeurMax: valeurMax !== null ? valeurMax.toLocaleString() : '-',
    couleurMin: COULEUR_DÉPART,
    couleurMax: COULEUR_ARRIVÉE,
  }), [valeurMax, valeurMin]);

  const donnéesCartographie = useMemo(() => {
    let donnéesFormatées: CartographieDonnées = {};

    données.forEach(({ valeur, codeInsee }) => {
      const territoireGéographique = récupérerDétailsSurUnTerritoireAvecCodeInsee(codeInsee);
      donnéesFormatées[codeInsee] = {
        valeurAffichée: déterminerValeurAffichée(valeur),
        remplissage: déterminerRemplissage(valeur, valeurMin, valeurMax),
        libellé: territoireGéographique.nomAffiché,
      };
    });

    return donnéesFormatées;
  }, [données, récupérerDétailsSurUnTerritoireAvecCodeInsee, valeurMax, valeurMin]);

  return {
    légende,
    donnéesCartographie,
  };
}
