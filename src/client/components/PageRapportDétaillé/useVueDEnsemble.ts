import { ChantierVueDEnsemble } from '@/server/domain/chantier/Chantier.interface';
import {
  AvancementsStatistiquesAccueilContrat,
} from '@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat';
import { ChantierRapportDetailleContrat } from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';
import { useRemontéesAlertesChantiers } from './useRemontéesAlertesChantiers';

export default function useVueDEnsemble(chantiersFiltrés: ChantierRapportDetailleContrat[], territoireCode: string, filtresComptesCalculés: Record<string, { nombre: number }>, avancementsAgrégés: AvancementsStatistiquesAccueilContrat) {
  const chantiersVueDEnsemble: ChantierVueDEnsemble[] = chantiersFiltrés.map(chantier => ({
    id: chantier.id,
    nom: chantier.nom,
    avancement: chantier.avancementGlobal,
    météo: chantier.météo,
    typologie: { estBaromètre: chantier.estBaromètre, estTerritorialisé: chantier.estTerritorialisé, estBrouillon: chantier.statut === 'BROUILLON' },
    porteur: chantier.responsables.porteur,
    tendance: chantier.tendance,
    écart: chantier.écart,
    dateDeMàjDonnéesQualitatives: chantier.dateDeMàjDonnéesQualitatives,
    dateDeMàjDonnéesQuantitatives: chantier.dateDeMàjDonnéesQuantitatives,
  }));

  const { remontéesAlertes } = useRemontéesAlertesChantiers(territoireCode, filtresComptesCalculés);

  return {
    avancementsAgrégés: avancementsAgrégés ?? null,
    chantiersVueDEnsemble,
    remontéesAlertes,
  };
}
