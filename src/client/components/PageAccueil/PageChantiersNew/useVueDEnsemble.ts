import { useMemo } from 'react';
import { ChantierVueDEnsemble } from '@/server/domain/chantier/Chantier.interface';
import { AgrégateurChantiersParTerritoire } from '@/client/utils/chantier/agrégateurNew/agrégateur';
import { objectEntries } from '@/client/utils/objects/objects';
import CompteurFiltre from '@/client/utils/filtres/CompteurFiltre';
import { ChantierAccueilContrat } from '@/server/chantiers/app/contrats/ChantierAccueilContrat';
import {
  AvancementsStatistiquesAccueilContrat,
} from '@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat';
import { useRemontéesAlertesChantiers } from './useRemontéesAlertesChantiers';

export default function useVueDEnsemble(chantiersFiltrés: ChantierAccueilContrat[], chantiersFiltrésSansFiltreAlerte: ChantierAccueilContrat[], territoireCode: string, mailleSelectionnee: 'départementale' | 'régionale', avancementsAgrégés?: AvancementsStatistiquesAccueilContrat) {
  const [maille, codeInseeSelectionne] = territoireCode.split('-');

  const mailleChantier = maille === 'NAT' ? 'nationale' : maille === 'REG' ? 'régionale' : 'départementale';

  const donnéesTerritoiresAgrégées = useMemo(() => {
    return new AgrégateurChantiersParTerritoire(chantiersFiltrés, mailleSelectionnee).agréger();
  }, [chantiersFiltrés, mailleSelectionnee]);


  if (avancementsAgrégés) {
    avancementsAgrégés.global.moyenne = donnéesTerritoiresAgrégées[mailleChantier].territoires[codeInseeSelectionne].répartition.avancements.global.moyenne;
    avancementsAgrégés.annuel.moyenne = donnéesTerritoiresAgrégées[mailleChantier].territoires[codeInseeSelectionne].répartition.avancements.annuel.moyenne;
  }

  const compteurFiltre = new CompteurFiltre(chantiersFiltrés);

  const filtresComptesCalculés = compteurFiltre.compter([{
    nomCritère: 'orage',
    condition: (chantier) => (
      chantier.mailles[mailleChantier][codeInseeSelectionne].météo === 'ORAGE'
    ) ?? false,
  }, {
    nomCritère: 'couvert',
    condition: (chantier) => (
      chantier.mailles[mailleChantier][codeInseeSelectionne].météo === 'COUVERT'
    ) ?? false,
  }, {
    nomCritère: 'nuage',
    condition: (chantier) => (
      chantier.mailles[mailleChantier][codeInseeSelectionne].météo === 'NUAGE'
    ) ?? false,
  }, {
    nomCritère: 'soleil',
    condition: (chantier) => (
      chantier.mailles[mailleChantier][codeInseeSelectionne].météo === 'SOLEIL'
    ) ?? false,
  }]);

  const répartitionMétéos = {
    ORAGE: filtresComptesCalculés.orage.nombre,
    COUVERT: filtresComptesCalculés.couvert.nombre,
    NUAGE: filtresComptesCalculés.nuage.nombre,
    SOLEIL: filtresComptesCalculés.soleil.nombre,
  };

  const avancementsGlobauxTerritoriauxMoyens = useMemo(() => {
    return objectEntries(donnéesTerritoiresAgrégées[mailleSelectionnee].territoires).map(([codeInsee, territoire]) => ({
      valeur: territoire.répartition.avancements.global.moyenne,
      codeInsee: codeInsee,
      estApplicable: null,
    }));
  }, [donnéesTerritoiresAgrégées, mailleSelectionnee]);

  const chantiersVueDEnsemble: ChantierVueDEnsemble[] = chantiersFiltrés.map(chantier => ({
    id: chantier.id,
    nom: chantier.nom,
    avancement: chantier.mailles[mailleChantier][codeInseeSelectionne].avancement.global,
    météo: chantier.mailles[mailleChantier][codeInseeSelectionne].météo,
    typologie: { estBaromètre: chantier.estBaromètre, estTerritorialisé: chantier.estTerritorialisé, estBrouillon: chantier.statut === 'BROUILLON' },
    porteur: chantier.responsables.porteur,
    tendance: chantier.mailles[mailleChantier][codeInseeSelectionne].tendance,
    écart: chantier.mailles[mailleChantier][codeInseeSelectionne].écart,
    dateDeMàjDonnéesQualitatives: chantier.mailles[mailleChantier][codeInseeSelectionne].dateDeMàjDonnéesQualitatives,
    dateDeMàjDonnéesQuantitatives: chantier.mailles[mailleChantier][codeInseeSelectionne].dateDeMàjDonnéesQuantitatives,
  }));

  const { remontéesAlertes } = useRemontéesAlertesChantiers(chantiersFiltrésSansFiltreAlerte, territoireCode);

  return {
    avancementsAgrégés: avancementsAgrégés ?? null,
    répartitionMétéos,
    avancementsGlobauxTerritoriauxMoyens,
    chantiersVueDEnsemble,
    remontéesAlertes,
  };
}
