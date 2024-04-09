import { useMemo } from 'react';
import { ChantierVueDEnsemble } from '@/server/domain/chantier/Chantier.interface';
import { AgrégateurChantiersParTerritoire } from '@/client/utils/chantier/agrégateur/agrégateur';
import {
  mailleSélectionnéeTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { objectEntries } from '@/client/utils/objects/objects';
import CompteurFiltre from '@/client/utils/filtres/CompteurFiltre';
import { useRemontéesAlertesChantiers } from '@/components/PageAccueil/PageChantiers/useRemontéesAlertesChantiers';
import { ChantierAccueilContrat } from '@/server/chantiers/app/contrats/ChantierAccueilContrat';
import {
  AvancementsStatistiquesAccueilContrat,
} from '@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat';

export default function useVueDEnsemble(chantiersFiltrés: ChantierAccueilContrat[], chantiersFiltrésSansFiltreAlerte: ChantierAccueilContrat[], avancementsAgrégés?: AvancementsStatistiquesAccueilContrat) {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  const donnéesTerritoiresAgrégées = useMemo(() => {
    return new AgrégateurChantiersParTerritoire(chantiersFiltrés).agréger();
  }, [chantiersFiltrés]);

  if (avancementsAgrégés) {
    avancementsAgrégés.global.moyenne = donnéesTerritoiresAgrégées[territoireSélectionné!.maille].territoires[territoireSélectionné!.codeInsee].répartition.avancements.global.moyenne;
    avancementsAgrégés.annuel.moyenne = donnéesTerritoiresAgrégées[territoireSélectionné!.maille].territoires[territoireSélectionné!.codeInsee].répartition.avancements.annuel.moyenne;
  }

  const compteurFiltre = new CompteurFiltre(chantiersFiltrés);

  const filtresComptesCalculés = compteurFiltre.compter([{
    nomCritère: 'orage',
    condition: (chantier) => (
      (territoireSélectionné && chantier.mailles[territoireSélectionné.maille][territoireSélectionné.codeInsee].météo === 'ORAGE') ?? false),
  }, {
    nomCritère: 'couvert',
    condition: (chantier) => (
      (territoireSélectionné && chantier.mailles[territoireSélectionné.maille][territoireSélectionné.codeInsee].météo === 'COUVERT') ?? false),
  }, {
    nomCritère: 'nuage',
    condition: (chantier) => (
      (territoireSélectionné && chantier.mailles[territoireSélectionné.maille][territoireSélectionné.codeInsee].météo === 'NUAGE') ?? false),
  }, {
    nomCritère: 'soleil',
    condition: (chantier) => (
      (territoireSélectionné && chantier.mailles[territoireSélectionné.maille][territoireSélectionné.codeInsee].météo === 'SOLEIL') ?? false),
  }]);

  const répartitionMétéos = {
    ORAGE: filtresComptesCalculés.orage.nombre,
    COUVERT: filtresComptesCalculés.couvert.nombre,
    NUAGE: filtresComptesCalculés.nuage.nombre,
    SOLEIL: filtresComptesCalculés.soleil.nombre,
  };

  const avancementsGlobauxTerritoriauxMoyens = useMemo(() => {
    return objectEntries(donnéesTerritoiresAgrégées[mailleSélectionnée].territoires).map(([codeInsee, territoire]) => ({
      valeur: territoire.répartition.avancements.global.moyenne,
      codeInsee: codeInsee,
      estApplicable: null,
    }));
  }, [donnéesTerritoiresAgrégées, mailleSélectionnée]);

  const chantiersVueDEnsemble: ChantierVueDEnsemble[] = chantiersFiltrés.map(chantier => ({
    id: chantier.id,
    nom: chantier.nom,
    avancement: chantier.mailles[territoireSélectionné!.maille][territoireSélectionné!.codeInsee].avancement.global,
    météo: chantier.mailles[territoireSélectionné!.maille][territoireSélectionné!.codeInsee].météo,
    typologie: { estBaromètre: chantier.estBaromètre, estTerritorialisé: chantier.estTerritorialisé, estBrouillon: chantier.statut === 'BROUILLON' },
    porteur: chantier.responsables.porteur,
    tendance: chantier.mailles[territoireSélectionné!.maille][territoireSélectionné!.codeInsee].tendance,
    écart: chantier.mailles[territoireSélectionné!.maille][territoireSélectionné!.codeInsee].écart,
    dateDeMàjDonnéesQualitatives: chantier.mailles[territoireSélectionné!.maille][territoireSélectionné!.codeInsee].dateDeMàjDonnéesQualitatives,
    dateDeMàjDonnéesQuantitatives: chantier.mailles[territoireSélectionné!.maille][territoireSélectionné!.codeInsee].dateDeMàjDonnéesQuantitatives,
  }));

  const { remontéesAlertes } = useRemontéesAlertesChantiers(chantiersFiltrésSansFiltreAlerte);

  return {
    avancementsAgrégés: avancementsAgrégés ?? null,
    répartitionMétéos,
    avancementsGlobauxTerritoriauxMoyens,
    chantiersVueDEnsemble,
    remontéesAlertes,
  };
}
