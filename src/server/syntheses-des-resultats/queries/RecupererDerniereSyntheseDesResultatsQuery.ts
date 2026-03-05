import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { SyntheseDesResultatsAvecNomsAuteurs } from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface";
import { Météo } from "@/server/domain/météo/Météo.interface";

export class RecupererDerniereSyntheseDesResultatsQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async run(
    chantierId: string,
    territoireCode: string,
    utilisateurId: string,
  ): Promise<SyntheseDesResultatsAvecNomsAuteurs | null> {
    const synthese = await this.deps.prisma
      .getInstance()
      .synthese_des_resultats.findFirst({
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

    if (!synthese) return null;

    const dernierBrouillonAuteur = await this.deps.prisma
      .getInstance()
      .synthese_des_resultats.findFirst({
        where: {
          chantier_id: chantierId,
          territoire_code: territoireCode,
          auteur_modification_id: utilisateurId,
          statut: $Enums.statut_synthese_des_resultats.BROUILLON,
        },
        orderBy: { date_modification: "desc" },
      });

    const dateDernierBrouillon = dernierBrouillonAuteur
      ? dernierBrouillonAuteur.date_modification.toISOString()
      : null;

    return {
      id: synthese.id,
      chantierId: synthese.chantier_id,
      territoireCode: synthese.territoire_code,
      contenu: synthese.commentaire ?? "",
      meteo: (synthese.meteo as Météo) ?? "NON_RENSEIGNEE",
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
      dateDernierBrouillon,
    };
  }
}
