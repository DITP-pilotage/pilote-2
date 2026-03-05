import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { Météo } from "@/server/domain/météo/Météo.interface";

export type DernierBrouillonSyntheseDesResultats = {
  id: string;
  chantierId: string;
  territoireCode: string;
  auteur_creation_id: string;
  date_creation: string;
  statut: $Enums.statut_synthese_des_resultats;
  contenu: string;
  meteo: Météo;
};

export class RecupererDernierBrouillonSyntheseDesResultatsQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async run(
    chantierId: string,
    territoireCode: string,
    utilisateurId: string,
  ): Promise<DernierBrouillonSyntheseDesResultats | null> {
    const brouillon = await this.deps.prisma
      .getInstance()
      .synthese_des_resultats.findFirst({
        where: {
          chantier_id: chantierId,
          territoire_code: territoireCode,
          statut: $Enums.statut_synthese_des_resultats.BROUILLON,
          auteur_modification_id: utilisateurId,
        },
        orderBy: { date_modification: "desc" },
      });

    if (!brouillon) return null;

    return {
      id: brouillon.id,
      chantierId: brouillon.chantier_id,
      territoireCode: brouillon.territoire_code,
      auteur_creation_id: brouillon.auteur_creation_id ?? "",
      date_creation: brouillon.date_creation.toISOString(),
      statut: brouillon.statut,
      contenu: brouillon.commentaire ?? "",
      meteo: (brouillon.meteo as Météo) ?? "NON_RENSEIGNEE",
    };
  }
}
