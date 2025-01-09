import { useMemo } from 'react';
import { actionsTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { CartographieDonnées } from '@/components/_commons/Cartographie/Cartographie.interface';
import { valeurMaximum, valeurMinimum } from '@/client/utils/statistiques/statistiques';
import { interpolerCouleurs } from '@/client/utils/couleur/couleur';
import {
  ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS,
} from '@/client/constants/légendes/élémentsDeLégendesCartographieAvancement';
import {
  CartographieÉlémentsDeLégende,
} from '@/client/components/_commons/Cartographie/Légende/CartographieLégende.interface';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import {
  getDateBasculeAffichageValeursAnneePrecedente,
} from '@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getDateBasculeAffichageValeursAnneePrecedente';
import api from '@/server/infrastructure/api/trpc/api';
import { CartographieDonnéesValeurActuelle } from './CartographieValeurActuelle.interface';

const COULEUR_DÉPART = '#8bcdb1';
const COULEUR_ARRIVÉE = '#083a25';
const REMPLISSAGE_PAR_DÉFAUT = ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS.DÉFAUT.remplissage;

function déterminerValeurAffichée(valeur: number | null, valeurCible: number | null, valeurCibleAnnuelle: number | null, estApplicable: boolean | null, dateBascule: string, unité?: string | null) {
  const unitéAffichée = unité?.toLocaleLowerCase() === 'pourcentage' ? '%' : '';
  const anneeCourante: number = new Date().getFullYear();
  const labelTooltipVCAnnuel: string = getDateBasculeAffichageValeursAnneePrecedente(dateBascule).dateBasculeDepassee
    ? 'VC ' + anneeCourante + ' :'
    : 'VC ' + (anneeCourante - 1) + ' :';

  if (estApplicable === false) {
    return (
      <div className='fr-text--bold'>
        Non applicable
      </div>
    );
  }
  return (
    <>
      <div className='flex justify-center align-center fr-text--bold'>
        <div className='fr-mr-1w'>
          VA :
        </div>
        <div>
          {valeur === null ? 'Non renseigné' : valeur.toLocaleString() + unitéAffichée}
        </div>
      </div>
      <div className='flex justify-center align-center'>
        <div className='fr-mr-1w'>
          {labelTooltipVCAnnuel}
        </div>
        <div>
          {valeurCibleAnnuelle === null ? 'Non renseigné' : valeurCibleAnnuelle.toLocaleString() + unitéAffichée}
        </div>
      </div>
      <div className='flex justify-center align-center'>
        <div className='fr-mr-1w'>
          VC 2026 :
        </div>
        <div>
          {valeurCible === null ? 'Non renseigné' : valeurCible.toLocaleString() + unitéAffichée}
        </div>
      </div>
    </>
  );
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

export default function useCartographieValeurActuelle(données: CartographieDonnéesValeurActuelle, élémentsDeLégende: CartographieÉlémentsDeLégende, mailleSelectionnee: MailleInterne, unité?: string | null) {
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();

  const { data: dateBasculeTauxAnnuelAnneeCouranteString } = api.gestionContenu.récupérerVariableContenu.useQuery({ nomVariableContenu: 'NEXT_PUBLIC_DATE_BASCULE_AFFICHAGE_VALEURS_ANNEE_PRECEDENTE' });

  const valeurMin = useMemo(() => valeurMinimum(données.map(donnée => donnée.valeur)), [données]);
  const valeurMax = useMemo(() => valeurMaximum(données.map(donnée => donnée.valeur)), [données]);

  const légendeAdditionnelle = useMemo(() => {
    const tousApplicables: Boolean = données.every(donnee => donnee.estApplicable);
    const tousNonNull: Boolean = données.every(donnee => donnee.valeur !== null);

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

    données.forEach(({ valeur, valeurCible, valeurCibleAnnuelle, territoireCode, estApplicable }) => {
      const territoireGéographique = récupérerDétailsSurUnTerritoire(territoireCode);

      donnéesFormatées[territoireCode] = {
        contenu: déterminerValeurAffichée(valeur, valeurCible, valeurCibleAnnuelle, estApplicable, dateBasculeTauxAnnuelAnneeCouranteString as string, unité),
        remplissage: déterminerRemplissage(valeur, valeurMin, valeurMax, estApplicable),
        libellé: territoireGéographique?.nomAffiché,
        estApplicable,
      };
    });

    return donnéesFormatées;
  }, [données, récupérerDétailsSurUnTerritoire, dateBasculeTauxAnnuelAnneeCouranteString, unité, valeurMin, valeurMax]);

  return {
    légende,
    donnéesCartographie,
    légendeAdditionnelle,
  };
}
