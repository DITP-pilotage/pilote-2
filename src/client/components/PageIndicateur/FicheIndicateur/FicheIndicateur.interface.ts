import { MetadataParametrageIndicateurContrat } from "@/server/app/contrats/MetadataParametrageIndicateurContrat";
import { MapInformationMetadataIndicateurContrat } from "@/server/app/contrats/InformationMetadataContrat";
import { ChantierSynthétisé } from "@/server/domain/chantier/Chantier.interface";
import { InformationHistorisationMetadataIndicateurContrat } from "@/server/parametrage-indicateur/app/InformationDerniereModificationMetadataIndicateurContrat";

export default interface FicheIndicateurProps {
  indicateur: MetadataParametrageIndicateurContrat;
  informationHistorisationIndicateur: InformationHistorisationMetadataIndicateurContrat;
  estEnCoursDeModification: boolean;
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat;
  chantiers: ChantierSynthétisé[];
}
