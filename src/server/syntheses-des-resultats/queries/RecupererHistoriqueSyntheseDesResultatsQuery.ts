import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { Météo } from "@/server/domain/météo/Météo.interface";

export type SyntheseDesResultatsHistoriqueItem = {
  chantierId: string;
  territoireCode: string;
  contenu: string;
  meteo: Météo;
  dateCreation: string;
  dateModification: string;
  auteurModificationNom: string;
};

export class RecupererHistoriqueSyntheseDesResultatsQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

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
      meteo: (synthese.meteo as Météo) ?? "NON_RENSEIGNEE",
      dateCreation: synthese.date_creation.toISOString(),
      dateModification: synthese.date_modification.toISOString(),
      auteurModificationNom: synthese.auteur_modification
        ? `${synthese.auteur_modification.prenom} ${synthese.auteur_modification.nom}`
        : "Auteur Inconnu",
    }));
  }
}
