import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { Meteo } from "@/server/domain/météo/Météo.interface";
import { SyntheseDesResultatsV2 } from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface";

export class RecupererBrouillonSyntheseDesResultatsQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async run(
    chantierId: string,
    territoireCode: string,
    utilisateurId: string,
  ): Promise<SyntheseDesResultatsV2 | null> {
    const brouillon = await this.deps.prisma
      .getInstance()
      .synthese_des_resultats.findFirst({
        where: {
          chantier_id: chantierId,
          territoire_code: territoireCode,
          statut: $Enums.statut_publication.BROUILLON,
          auteur_modification_id: utilisateurId,
        },
        orderBy: { date_modification: "desc" },
      });

    if (!brouillon) return null;

    return {
      id: brouillon.id,
      chantierId: brouillon.chantier_id,
      territoireCode: brouillon.territoire_code,
      auteurCreationId: brouillon.auteur_creation_id,
      dateCreation: brouillon.date_creation.toISOString(),
      statut: brouillon.statut,
      contenu: brouillon.commentaire ?? "",
      meteo: (brouillon.meteo as Meteo) ?? "NON_RENSEIGNEE",
      auteurModificationId: brouillon.auteur_modification_id,
      dateModification: brouillon.date_modification.toISOString(),
    };
  }
}
