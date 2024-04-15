import { useMemo } from 'react';
import { ChantierVueDEnsemble } from '@/server/domain/chantier/Chantier.interface';
import { objectEntries } from '@/client/utils/objects/objects';
import CompteurFiltre from '@/client/utils/filtres/CompteurFiltre';
import { ChantierAccueilContrat } from '@/server/chantiers/app/contrats/ChantierAccueilContrat';
import {
  AvancementsStatistiquesAccueilContrat,
} from '@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat';
import { AgrégatParTerritoire } from '@/client/utils/chantier/agrégateurNew/agrégateur.interface';
import { useRemontéesAlertesChantiers } from './useRemontéesAlertesChantiers';

export default function useVueDEnsemble(chantiersFiltrés: ChantierAccueilContrat[], territoireCode: string, mailleSelectionnee: 'départementale' | 'régionale', filtresComptesCalculés: Record<string, { nombre: number }>, avancementsAgrégés: AvancementsStatistiquesAccueilContrat, donnéesTerritoiresAgrégées: AgrégatParTerritoire) {
  const [maille, codeInseeSelectionne] = territoireCode.split('-');

  const mailleChantier = maille === 'NAT' ? 'nationale' : maille === 'REG' ? 'régionale' : 'départementale';

  const compteurFiltre = new CompteurFiltre(chantiersFiltrés);

  const filtresMétéoComptesCalculés = compteurFiltre.compter([{
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
    ORAGE: filtresMétéoComptesCalculés.orage.nombre,
    COUVERT: filtresMétéoComptesCalculés.couvert.nombre,
    NUAGE: filtresMétéoComptesCalculés.nuage.nombre,
    SOLEIL: filtresMétéoComptesCalculés.soleil.nombre,
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

  const { remontéesAlertes } = useRemontéesAlertesChantiers(territoireCode, filtresComptesCalculés);

  return {
    avancementsAgrégés: avancementsAgrégés ?? null,
    répartitionMétéos,
    avancementsGlobauxTerritoriauxMoyens,
    chantiersVueDEnsemble,
    remontéesAlertes,
  };
}
