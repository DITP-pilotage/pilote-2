import { useMemo } from 'react';
import { actionsTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { CartographieDonnées } from '@/components/_commons/Cartographie/Cartographie.interface';
import { CartographieDonnéesValeurActuelle } from '@/components/_commons/Cartographie/CartographieValeurActuelle/CartographieValeurActuelle.interface';
import { valeurMaximum, valeurMinimum } from '@/client/utils/statistiques/statistiques';
import { interpolerCouleurs } from '@/client/utils/couleur/couleur';
import { ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS } from '@/client/constants/légendes/élémentsDeLégendesCartographieAvancement';
import { CartographieÉlémentsDeLégende } from '@/client/components/_commons/Cartographie/Légende/CartographieLégende.interface';

const COULEUR_DÉPART = '#8bcdb1';
const COULEUR_ARRIVÉE = '#083a25';
const REMPLISSAGE_PAR_DÉFAUT = ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS.DÉFAUT.remplissage;


function déterminerValeurAffichée(valeur: number | null, estApplicable: boolean | null, unité?: string | null) {
  const unitéAffichée = unité?.toLocaleLowerCase() === 'pourcentage' ? '%' : ''; 
  if (estApplicable === false) {
    return 'Non applicable';
  }
  return valeur === null ? 'Non renseigné' : valeur.toLocaleString() + unitéAffichée;
}

function déterminerRemplissage(valeur: number | null, valeurMin: number | null, valeurMax: number | null, estApplicable: boolean | null) {

  if (estApplicable === false) {
    return ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS.NON_APPLICABLE.remplissage;
  }

  if (valeur === null || valeurMin === null || valeurMax === null)
    return REMPLISSAGE_PAR_DÉFAUT;

  if (valeurMin === valeurMax)
    return COULEUR_DÉPART;

  const pourcentageInterpolation = 100 * (valeur - valeurMin) / (valeurMax - valeurMin);
  return interpolerCouleurs(COULEUR_DÉPART, COULEUR_ARRIVÉE, pourcentageInterpolation);
}

export default function useCartographieValeurActuelle(données: CartographieDonnéesValeurActuelle, élémentsDeLégende: CartographieÉlémentsDeLégende, unité?: string | null) {
  const { récupérerDétailsSurUnTerritoireAvecCodeInsee } = actionsTerritoiresStore();

  const valeurMin = useMemo(() => valeurMinimum(données.map(donnée => donnée.valeur)), [données]);
  const valeurMax = useMemo(() => valeurMaximum(données.map(donnée => donnée.valeur)), [données]);

  const légendeAdditionnelle = useMemo(() => {
    
    const tousApplicables: Boolean = données.map(d => d.estApplicable).every(el => el === true);
    const tousNonNull: Boolean = données.map(d => d.valeur !== null).every(el => el === true);

    let légendeAffichée = Object.values(élémentsDeLégende);
    if (tousApplicables) {
      légendeAffichée = légendeAffichée
        .filter(el => el.libellé !== 'Territoire où le chantier prioritaire ne s’applique pas');
    }

    if (tousNonNull) {
      légendeAffichée = légendeAffichée
        .filter(el => el.libellé !== 'Territoire pour lequel la donnée n’est pas renseignée/disponible');
    }
    
    légendeAffichée = légendeAffichée.map(({ remplissage, libellé }) => ({
      libellé,
      remplissage,
    }));

    return légendeAffichée;

  }, [élémentsDeLégende, données]);

  const légende = useMemo(() => ({
    libellé: unité === null || unité == undefined ? '' : `En ${unité.toLocaleLowerCase()}`,
    valeurMin: valeurMin !== null ? valeurMin.toLocaleString() : '-',
    valeurMax: valeurMax !== null ? valeurMax.toLocaleString() : '-',
    couleurMin: COULEUR_DÉPART,
    couleurMax: COULEUR_ARRIVÉE,
  }), [valeurMax, valeurMin, unité]);

  const donnéesCartographie = useMemo(() => {
    let donnéesFormatées: CartographieDonnées = {};
    
    données.forEach(({ valeur, codeInsee, estApplicable }) => {
      const territoireGéographique = récupérerDétailsSurUnTerritoireAvecCodeInsee(codeInsee);
      donnéesFormatées[codeInsee] = {
        valeurAffichée: déterminerValeurAffichée(valeur, estApplicable, unité),
        remplissage: déterminerRemplissage(valeur, valeurMin, valeurMax, estApplicable),
        libellé: territoireGéographique.nomAffiché,
      };
    });

    return donnéesFormatées;
  }, [données, récupérerDétailsSurUnTerritoireAvecCodeInsee, valeurMax, valeurMin, unité]);

  return {
    légende,
    donnéesCartographie,
    légendeAdditionnelle,
  };
}
