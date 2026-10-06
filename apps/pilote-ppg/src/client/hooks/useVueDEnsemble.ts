import { ChantierVueDEnsemble } from "@/shared/chantier/Chantier.interface";
import { AvancementsStatistiquesAccueilContrat } from "@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat";
import { TypeAlerteChantier } from "@/server/chantiers/app/contrats/TypeAlerteChantier";
import { ChantierAccueilContratV2 } from "@/server/chantiers/app/contrats/ChantierAccueilContratV2";
import { useRemontéesAlertesChantiers } from "@/client/hooks/useRemontéesAlertesChantiers";

type ChantierPourVueDEnsemble = Pick<
  ChantierAccueilContratV2,
  | "id"
  | "nom"
  | "avancement"
  | "météo"
  | "estBaromètre"
  | "estTerritorialisé"
  | "statut"
  | "responsables"
  | "tendance"
  | "ecart"
  | "dateDeMàjDonnéesQualitatives"
  | "dateDeMàjDonnéesQuantitatives"
  | "maillesApplicables"
>;

export default function useVueDEnsemble(
  chantiersFiltrés: ChantierPourVueDEnsemble[],
  territoireCode: string,
  filtresComptesCalculés: Record<TypeAlerteChantier, number>,
  avancementsAgrégés: AvancementsStatistiquesAccueilContrat,
) {
  const chantiersVueDEnsemble: ChantierVueDEnsemble[] = chantiersFiltrés.map(
    (chantier) => ({
      id: chantier.id,
      nom: chantier.nom,
      avancement: chantier.avancement,
      météo: chantier.météo,
      typologie: {
        estBaromètre: chantier.estBaromètre,
        estTerritorialisé: chantier.estTerritorialisé,
        estBrouillon: chantier.statut === "BROUILLON",
      },
      porteur: chantier.responsables.porteur,
      tendance: chantier.tendance,
      écart: chantier.ecart,
      dateDeMàjDonnéesQualitatives: chantier.dateDeMàjDonnéesQualitatives,
      dateDeMàjDonnéesQuantitatives: chantier.dateDeMàjDonnéesQuantitatives,
      maillesApplicables: chantier.maillesApplicables,
    }),
  );

  const { remontéesAlertes } = useRemontéesAlertesChantiers(
    territoireCode,
    filtresComptesCalculés,
  );

  return {
    avancementsAgrégés: avancementsAgrégés ?? null,
    chantiersVueDEnsemble,
    remontéesAlertes,
  };
}
