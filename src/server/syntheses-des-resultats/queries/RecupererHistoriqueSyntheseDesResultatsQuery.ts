import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { Météo } from "@/server/domain/météo/Météo.interface";
import { SyntheseDesResultatsAvecNomsAuteurs } from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface";

export class RecupererHistoriqueSyntheseDesResultatsQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async run(
    chantierId: string,
    territoireCode: string,
  ): Promise<SyntheseDesResultatsAvecNomsAuteurs[]> {
    const syntheses = await this.deps.prisma
      .getInstance()
      .synthese_des_resultats.findMany({
        where: {
          chantier_id: chantierId,
          territoire_code: territoireCode,
          statut: $Enums.statut_synthese_des_resultats.PUBLIE,
        },
        include: {
          auteur_creation: true,
          auteur_modification: true,
        },
        orderBy: { date_modification: "desc" },
      });

    return syntheses.map((synthese) => ({
      id: synthese.id,
      chantierId: synthese.chantier_id,
      territoireCode: synthese.territoire_code,
      contenu: synthese.commentaire ?? "",
      météo: (synthese.meteo as Météo) ?? "NON_RENSEIGNEE",
      auteur_creation_id: synthese.auteur_creation_id ?? "",
      date_creation: synthese.date_creation.toISOString(),
      auteur_modification_id: synthese.auteur_modification_id ?? "",
      date_modification: synthese.date_modification.toISOString(),
      statut: synthese.statut,
      auteur_creation_nom: synthese.auteur_creation
        ? `${synthese.auteur_creation.prenom} ${synthese.auteur_creation.nom}`
        : "Auteur Inconnu",
      auteur_modification_nom: synthese.auteur_modification
        ? `${synthese.auteur_modification.prenom} ${synthese.auteur_modification.nom}`
        : "Auteur Inconnu",
    }));
  }
}
