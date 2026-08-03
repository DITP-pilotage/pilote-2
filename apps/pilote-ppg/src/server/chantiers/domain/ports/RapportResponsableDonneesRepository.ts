import { $Enums } from "@prisma/client";
import { RapportResponsableDonnees } from "@/server/chantiers/domain/RapportResponsableDonnees";

export interface RapportResponsableDonneesRepository {
  sauvegarder(rapport: RapportResponsableDonnees): Promise<void>;
  recupererRapportsParStatut(
    statut: $Enums.statut_envoi_rapport,
  ): Promise<RapportResponsableDonnees[]>;
}
