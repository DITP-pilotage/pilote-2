import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { SyntheseDesResultatsAvecNomsAuteurs } from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface";
import { Meteo } from "@/server/domain/météo/Météo.interface";
import type { Inject } from "@/server/syntheses-des-resultats/module";

export class RecupererDerniereSyntheseDesResultatsQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(
    chantierId: string,
    territoireCode: string,
  ): Promise<SyntheseDesResultatsAvecNomsAuteurs | null> {
    const synthese = await this.prisma
      .getInstance()
      .synthese_des_resultats.findFirst({
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

    if (!synthese) return null;

    return {
      id: synthese.id,
      chantierId: synthese.chantier_id,
      territoireCode: synthese.territoire_code,
      contenu: synthese.commentaire ?? "",
      meteo: (synthese.meteo as Meteo) ?? "NON_RENSEIGNEE",
      auteurCreationId: synthese.auteur_creation_id ?? "",
      dateCreation: synthese.date_creation.toISOString(),
      auteurModificationId: synthese.auteur_modification_id ?? "",
      dateModification: synthese.date_modification.toISOString(),
      statut: synthese.statut,
      auteurCreationNom: synthese.auteur_creation
        ? `${synthese.auteur_creation.prenom} ${synthese.auteur_creation.nom}`
        : "Auteur Inconnu",
      auteurModificationNom: synthese.auteur_modification
        ? `${synthese.auteur_modification.prenom} ${synthese.auteur_modification.nom}`
        : "Auteur Inconnu",
    };
  }
}
