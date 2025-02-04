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
import { DétailsIndicateurTerritoire } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { objectEntries } from '@/client/utils/objects/objects';

const COULEUR_DÉPART = '#8bcdb1';
const COULEUR_ARRIVÉE = '#083a25';
const REMPLISSAGE_PAR_DÉFAUT = ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS.DÉFAUT.remplissage;

function déterminerValeurAffichée(valeur: number | null, valeurCible: number | null, valeurCibleAnnuelle: number | null, estApplicable: boolean | null, jalon: number, unité?: string | null) {
  const unitéAffichée = unité?.toLocaleLowerCase() === 'pourcentage' ? '%' : '';

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
          {`VC ${jalon} : `}
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

export default function useCartographieValeurActuelleIndicateur(detailsIndicateurTerritoire: DétailsIndicateurTerritoire, élémentsDeLégende: CartographieÉlémentsDeLégende, jalon: number, unité?: string | null) {
  const donnees = objectEntries(detailsIndicateurTerritoire).
    map(([territoireCode, détailsIndicateur]) => ({
      valeur: détailsIndicateur.valeurActuelle ?? null, 
      valeurCible: détailsIndicateur.valeurCible ?? null,
      valeurCibleAnnuelle: détailsIndicateur.valeurCibleAnnuelle ?? null,
      territoireCode: territoireCode,
      estApplicable: détailsIndicateur.est_applicable }));

  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();

  const valeurMin = useMemo(() => valeurMinimum(donnees.map(donnee => donnee.valeur)), [donnees]);
  const valeurMax = useMemo(() => valeurMaximum(donnees.map(donnee => donnee.valeur)), [donnees]);

  const legende = useMemo(() => {
    const tousApplicables: Boolean = donnees.every(donnee => donnee.estApplicable);
    const tousNonNull: Boolean = donnees.every(donnee => donnee.valeur !== null);

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

  }, [élémentsDeLégende, donnees]);

  const legendeDegrade = useMemo(() => ({
    libellé: unité === null || unité == undefined ? '' : `En ${unité.toLocaleLowerCase()}`,
    valeurMin: valeurMin !== null ? valeurMin.toLocaleString() : '-',
    valeurMax: valeurMax !== null ? valeurMax.toLocaleString() : '-',
    couleurMin: COULEUR_DÉPART,
    couleurMax: COULEUR_ARRIVÉE,
  }), [valeurMax, valeurMin, unité]);

  const donneesCartographie = useMemo(() => {
    let donnéesFormatées: CartographieDonnées = {};

    donnees.forEach(({ valeur, valeurCible, valeurCibleAnnuelle, territoireCode, estApplicable }) => {
      const territoireGéographique = récupérerDétailsSurUnTerritoire(territoireCode);

      donnéesFormatées[territoireCode] = {
        contenu: déterminerValeurAffichée(valeur, valeurCible, valeurCibleAnnuelle, estApplicable, jalon, unité),
        remplissage: déterminerRemplissage(valeur, valeurMin, valeurMax, estApplicable),
        libellé: territoireGéographique?.nomAffiché,
        estApplicable,
      };
    });

    return donnéesFormatées;
  }, [donnees, récupérerDétailsSurUnTerritoire, unité, valeurMin, valeurMax, jalon]);

  return {
    legendeDegrade,
    donneesCartographie,
    legende,
  };
}
