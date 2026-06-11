import { $Enums } from "@prisma/client";
import { Meteo } from "@/server/domain/météo/Météo.interface";

export type SyntheseDesResultatsHistoriqueItem = {
  chantierId: string;
  territoireCode: string;
  contenu: string;
  meteo: Meteo;
  dateCreation: string;
  dateModification: string;
  auteurCreationNom: string;
  auteurCreationService: string | null;
  auteurCreationFonction: string | null;
  auteurModificationNom: string;
  auteurModificationService: string | null;
  auteurModificationFonction: string | null;
};
import type { Inject } from "@/server/syntheses-des-resultats/module";

export class RecupererHistoriqueSyntheseDesResultatsQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async run(
    chantierId: string,
    territoireCode: string,
  ): Promise<SyntheseDesResultatsHistoriqueItem[]> {
    const syntheses = await this.deps.prisma
      .getInstance()
      .synthese_des_resultats.findMany({
        where: {
          chantier_id: chantierId,
          territoire_code: territoireCode,
          statut: $Enums.statut_publication.PUBLIE,
        },
        include: {
          auteur_creation: true,
          auteur_modification: true,
        },
        orderBy: { date_modification: "desc" },
      });

    return syntheses.map((synthese) => ({
      chantierId: synthese.chantier_id,
      territoireCode: synthese.territoire_code,
      contenu: synthese.commentaire ?? "",
      meteo: (synthese.meteo as Meteo) ?? "NON_RENSEIGNEE",
      dateCreation: synthese.date_creation.toISOString(),
      dateModification: synthese.date_modification.toISOString(),
      auteurCreationNom: `${synthese.auteur_creation.prenom} ${synthese.auteur_creation.nom}`,
      auteurCreationService:
        synthese.auteur_creation.service === "autre"
          ? synthese.auteur_creation.service_autre
          : synthese.auteur_creation.service,
      auteurCreationFonction: synthese.auteur_creation.fonction,
      auteurModificationNom: `${synthese.auteur_modification.prenom} ${synthese.auteur_modification.nom}`,
      auteurModificationService:
        synthese.auteur_modification.service === "autre"
          ? synthese.auteur_modification.service_autre
          : synthese.auteur_modification.service,
      auteurModificationFonction: synthese.auteur_modification.fonction,
    }));
  }
}
