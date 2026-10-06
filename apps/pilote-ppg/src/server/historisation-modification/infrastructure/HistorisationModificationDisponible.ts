import { Chantier } from "@/shared/chantier/Chantier.interface";
import { Utilisateur } from "@/shared/utilisateur/Utilisateur.interface";
import { convertirEnHistorisationMetadataParametrageIndicateurModel } from "@/server/historisation-modification/domain/ClassConversion/HistorisationMetadataParametrageIndicateur";
import { convertirEnHistorisationMetadataIndicateurModel } from "@/server/historisation-modification/domain/ClassConversion/HistorisationMetadataIndicateur";
import { MetadataParametrageIndicateur } from "@/server/parametrage-indicateur/domain/MetadataParametrageIndicateur";
import { convertirEnHistorisationMetadataIndicateurComplementaireModel } from "@/server/historisation-modification/domain/ClassConversion/HistorisationMetadataIndicateurComplementaire";
import { convertirEnModel as convertirEnUtilisateurModel } from "@/server/gestion-utilisateur/infrastructure/sql/ConvertirUtilisateurEnUtilisateurModel";

export type HistorisationModificationDisponible = {
  metadata_indicateurs: MetadataParametrageIndicateur;
  metadata_parametrages_indicateurs: MetadataParametrageIndicateur;
  metadata_indicateurs_complementaire: MetadataParametrageIndicateur;
  chantier: Chantier;
  utilisateur: Utilisateur;
};
export const tableConversionModification = {
  metadata_indicateurs: convertirEnHistorisationMetadataIndicateurModel,
  metadata_parametrages_indicateurs:
    convertirEnHistorisationMetadataParametrageIndicateurModel,
  metadata_indicateurs_complementaire:
    convertirEnHistorisationMetadataIndicateurComplementaireModel,
  chantier: (chantier: Chantier) => chantier,
  utilisateur: convertirEnUtilisateurModel,
};
export const tableRecuperationId = {
  metadata_indicateurs: (
    obj: HistorisationModificationDisponible["metadata_indicateurs"],
  ) => obj.indicId,
  metadata_parametrages_indicateurs: (
    obj: HistorisationModificationDisponible["metadata_parametrages_indicateurs"],
  ) => obj.indicId,
  metadata_indicateurs_complementaire: (
    obj: HistorisationModificationDisponible["metadata_indicateurs_complementaire"],
  ) => obj.indicId,
  chantier: (obj: HistorisationModificationDisponible["chantier"]) =>
    obj?.id || "identifiant inconnu",
  utilisateur: (obj: HistorisationModificationDisponible["utilisateur"]) =>
    obj?.id || "identifiant inconnu",
};
