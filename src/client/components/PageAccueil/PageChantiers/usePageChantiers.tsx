import { useSession } from 'next-auth/react';
import { useEffect, useMemo } from 'react';
import {
  actions as actionsFiltresStore,
  désactiverUnFiltreFn,
  filtresActifs as filtresActifsStore,
} from '@/stores/useFiltresStore/useFiltresStore';
import useVueDEnsemble from '@/components/useVueDEnsemble';
import { ChantierAccueilContrat } from '@/server/chantiers/app/contrats/ChantierAccueilContrat';
import api from '@/server/infrastructure/api/trpc/api';
import {
  mailleSélectionnéeTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { ChantierRapportDetailleContrat } from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';
import { statutsSélectionnésStore } from '@/stores/useStatutsStore/useStatutsStore';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import Alerte from '@/server/domain/alerte/Alerte';

const masquerPourDROM = (sessionProfil: string, territoireCode: string) => {
  return sessionProfil === 'DROM' && territoireCode === 'NAT-FR';
};

const useChantiersFiltrés = (chantiers: (ChantierAccueilContrat | ChantierRapportDetailleContrat)[]) => {
  const { data: session } = useSession();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const filtresActifs = filtresActifsStore();
  const statutsSélectionnés = statutsSélectionnésStore();

  const chantiersFiltrésSansFiltreAlerte = useMemo(() => {
    let résultat: (ChantierAccueilContrat | ChantierRapportDetailleContrat)[] = chantiers;

    if (territoireSélectionné) {
      résultat = résultat.filter(chantier =>
        !!chantier.mailles[territoireSélectionné.maille][territoireSélectionné.codeInsee].estApplicable
        && statutsSélectionnés.includes(chantier.statut));
    }

    if (masquerPourDROM(session!.profil, territoireSélectionné!.code)) {
      résultat = résultat.filter(chantier => chantier.périmètreIds.includes('PER-018'));
    }

    if (territoireSélectionné?.code !== 'NAT-FR') {
      const maille = territoireSélectionné?.maille as MailleInterne;
      résultat = résultat.filter(chantier => {
        return chantier.estTerritorialisé || chantier.tauxAvancementDonnéeTerritorialisée[maille] || chantier.météoDonnéeTerritorialisée[maille];
      });
    }

    if (filtresActifs.périmètresMinistériels.length > 0) {
      résultat = résultat.filter(chantier => {
        const périmètrePorteur = chantier.responsables.porteur?.périmètresMinistériels.find(pm => chantier.périmètreIds.includes(pm.id));
        return filtresActifs.périmètresMinistériels.some(filtre => périmètrePorteur?.id === filtre.id);
      });
    }
    if (filtresActifs.axes.length > 0) {
      résultat = résultat.filter(chantier => (
        filtresActifs.axes.some(filtre => chantier.axe === filtre.nom)
      ));
    }
    if (filtresActifs.filtresTypologie.length > 0) {
      résultat = résultat.filter(chantier => (
        filtresActifs.filtresTypologie.some(filtre => chantier[filtre.attribut])
      ));
    }

    return résultat;
  }, [chantiers, territoireSélectionné, session, filtresActifs.périmètresMinistériels, filtresActifs.axes, filtresActifs.filtresTypologie, statutsSélectionnés]);

  const chantiersFiltrés = useMemo(() => {
    let résultat: (ChantierAccueilContrat | ChantierRapportDetailleContrat)[] = chantiersFiltrésSansFiltreAlerte;

    if (filtresActifs.filtresAlerte.length > 0) {
      résultat = résultat.filter(chantier => {
        return filtresActifs.filtresAlerte.some(filtre => {
          const chantierDonnéesTerritoires = chantier.mailles[territoireSélectionné!.maille][territoireSélectionné!.codeInsee];
          return (filtre.id === 'estEnAlerteÉcart' && Alerte.estEnAlerteÉcart(chantierDonnéesTerritoires.écart))
            || (filtre.id === 'estEnAlerteBaisse' && Alerte.estEnAlerteBaisse(chantierDonnéesTerritoires.tendance))
            || (filtre.id === 'estEnAlerteDonnéesNonMàj' && Alerte.estEnAlerteDonnéesNonMàj(chantierDonnéesTerritoires.dateDeMàjDonnéesQualitatives, chantierDonnéesTerritoires.dateDeMàjDonnéesQuantitatives))
            || (filtre.id === 'estEnAlerteTauxAvancementNonCalculé' && Alerte.estEnAlerteTauxAvancementNonCalculé(chantierDonnéesTerritoires.avancement.global));
        });
      });
    }
    return résultat;
  }, [chantiersFiltrésSansFiltreAlerte, filtresActifs.filtresAlerte, territoireSélectionné]);

  useEffect(() => {
    if (territoireSélectionné?.maille === 'nationale') {
      désactiverUnFiltreFn('estEnAlerteÉcart', 'filtresAlerte');
    } else {
      désactiverUnFiltreFn('estEnAlerteTauxAvancementNonCalculé', 'filtresAlerte');
    }
  }, [territoireSélectionné?.maille]);


  return {
    chantiersFiltrésSansFiltreAlerte,
    chantiersFiltrés,
  };
};

export default function usePageChantiers(chantiers: ChantierAccueilContrat[]) {
  const { récupérerNombreFiltresActifs } = actionsFiltresStore();
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();

  const { chantiersFiltrés, chantiersFiltrésSansFiltreAlerte } = useChantiersFiltrés(chantiers);

  const aDesDroitsDeLectureSurAuMoinsUnChantierBrouillon = (chantierIds: string[]) => {
    return chantiers.some(chantier => chantier.statut === 'BROUILLON' && chantierIds.includes(chantier.id));
  };

  let { data: avancementsAgrégés } = api.chantier.récupérerStatistiquesAvancements.useQuery(
    {
      chantiers: chantiersFiltrés.map(chantier => (chantier.id)),
      maille: mailleSélectionnée,
    },
    { keepPreviousData: true },
  );

  const {
    répartitionMétéos,
    avancementsGlobauxTerritoriauxMoyens,
    chantiersVueDEnsemble,
    remontéesAlertes,
  } = useVueDEnsemble(chantiersFiltrés, chantiersFiltrésSansFiltreAlerte, avancementsAgrégés);

  return {
    nombreFiltresActifs: récupérerNombreFiltresActifs(),
    chantiersFiltrés,
    avancementsAgrégés,
    répartitionMétéos,
    donnéesCartographieAvancement: avancementsGlobauxTerritoriauxMoyens,
    donnéesTableauChantiers: chantiersVueDEnsemble,
    remontéesAlertes,
    aDesDroitsDeLectureSurAuMoinsUnChantierBrouillon,
  };
}
