import { useEffect, useMemo } from 'react';
import {
  actions as actionsFiltresStore,
  désactiverUnFiltreFn,
  filtresActifs as filtresActifsStore,
} from '@/stores/useFiltresStore/useFiltresStore';
import { ChantierAccueilContrat } from '@/server/chantiers/app/contrats/ChantierAccueilContrat';
import api from '@/server/infrastructure/api/trpc/api';
import { ChantierRapportDetailleContrat } from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';
import { statutsSélectionnésStore } from '@/stores/useStatutsStore/useStatutsStore';
import Alerte from '@/server/domain/alerte/Alerte';
import useVueDEnsemble from './useVueDEnsemble';

const useChantiersFiltrés = (chantiers: (ChantierAccueilContrat | ChantierRapportDetailleContrat)[], territoireCode: string) => {
  const filtresActifs = filtresActifsStore();
  const statutsSélectionnés = statutsSélectionnésStore();

  const [maille, codeInsee] = territoireCode.split('-');
  const mailleChantier = maille === 'NAT' ? 'nationale' : maille === 'REG' ? 'régionale' : 'départementale';


  const chantiersFiltrésSansFiltreAlerte = useMemo(() => {
    let résultat: (ChantierAccueilContrat | ChantierRapportDetailleContrat)[] = chantiers;

    résultat = résultat.filter(chantier => statutsSélectionnés.includes(chantier.statut));

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
    if (filtresActifs.ppg.length > 0) {
      résultat = résultat.filter(chantier => (
        filtresActifs.ppg.some(filtre => chantier.ppg === filtre.nom)
      ));
    }
    if (filtresActifs.filtresTypologie.length > 0) {
      résultat = résultat.filter(chantier => (
        filtresActifs.filtresTypologie.some(filtre => chantier[filtre.attribut])
      ));
    }

    return résultat;
  }, [chantiers, filtresActifs.axes, filtresActifs.filtresTypologie, filtresActifs.ppg, filtresActifs.périmètresMinistériels, statutsSélectionnés]);

  const chantiersFiltrés = useMemo(() => {
    let résultat: (ChantierAccueilContrat | ChantierRapportDetailleContrat)[] = chantiersFiltrésSansFiltreAlerte;

    if (filtresActifs.filtresAlerte.length > 0) {
      résultat = résultat.filter(chantier => {
        return filtresActifs.filtresAlerte.some(filtre => {
          const chantierDonnéesTerritoires = chantier.mailles[mailleChantier][codeInsee];
          return (filtre.id === 'estEnAlerteÉcart' && Alerte.estEnAlerteÉcart(chantierDonnéesTerritoires.écart))
            || (filtre.id === 'estEnAlerteBaisseOuStagnation' && Alerte.estEnAlerteBaisseOuStagnation(chantierDonnéesTerritoires.tendance))
            || (filtre.id === 'estEnAlerteDonnéesNonMàj' && Alerte.estEnAlerteDonnéesNonMàj(chantierDonnéesTerritoires.dateDeMàjDonnéesQualitatives, chantierDonnéesTerritoires.dateDeMàjDonnéesQuantitatives))
            || (filtre.id === 'estEnAlerteTauxAvancementNonCalculé' && Alerte.estEnAlerteTauxAvancementNonCalculé(chantierDonnéesTerritoires.avancement.global));
        });
      });
    }
    return résultat;
  }, [chantiersFiltrésSansFiltreAlerte, codeInsee, filtresActifs.filtresAlerte, mailleChantier]);

  useEffect(() => {
    if (mailleChantier === 'nationale') {
      désactiverUnFiltreFn('estEnAlerteÉcart', 'filtresAlerte');
    } else {
      désactiverUnFiltreFn('estEnAlerteTauxAvancementNonCalculé', 'filtresAlerte');
    }
  }, [mailleChantier]);


  return {
    chantiersFiltrésSansFiltreAlerte,
    chantiersFiltrés,
  };
};

export default function usePageChantiers(chantiers: ChantierAccueilContrat[], territoireCode: string, mailleSelectionnee: 'départementale' | 'régionale') {
  const { récupérerNombreFiltresActifs } = actionsFiltresStore();

  const { chantiersFiltrés, chantiersFiltrésSansFiltreAlerte } = useChantiersFiltrés(chantiers, territoireCode);

  const aDesDroitsDeLectureSurAuMoinsUnChantierBrouillon = (chantierIds: string[]) => {
    return chantiers.some(chantier => chantier.statut === 'BROUILLON' && chantierIds.includes(chantier.id));
  };

  let { data: avancementsAgrégés } = api.chantier.récupérerStatistiquesAvancements.useQuery(
    {
      chantiers: chantiersFiltrés.map(chantier => (chantier.id)),
      maille: mailleSelectionnee,
    },
    { keepPreviousData: true },
  );

  const {
    répartitionMétéos,
    avancementsGlobauxTerritoriauxMoyens,
    chantiersVueDEnsemble,
    remontéesAlertes,
  } = useVueDEnsemble(chantiersFiltrés, chantiersFiltrésSansFiltreAlerte, territoireCode, mailleSelectionnee, avancementsAgrégés);

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
