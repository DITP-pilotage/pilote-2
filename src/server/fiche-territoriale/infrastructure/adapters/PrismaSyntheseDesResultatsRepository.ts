import { $Enums } from "@prisma/client";
import { SyntheseDesResultatsRepository } from "@/server/fiche-territoriale/domain/ports/SyntheseDesResultatsRepository";
import { SyntheseDesResultats } from "@/server/fiche-territoriale/domain/SyntheseDesResultats";
import { prisma } from "@/server/db/prisma";

export class PrismaSyntheseDesResultatsRepository implements SyntheseDesResultatsRepository {
  async recupererMapSyntheseDesResultatsParListeChantierIdEtTerritoire({
    listeChantierId,
    maille,
    codeInsee,
  }: {
    listeChantierId: string[];
    maille: string;
    codeInsee: string;
  }): Promise<Map<string, SyntheseDesResultats[]>> {
    const result = await prisma.synthese_des_resultats.findMany({
      where: {
        chantier_id: {
          in: listeChantierId,
        },
        statut: $Enums.statut_publication.PUBLIE,
        code_insee: codeInsee,
        maille,
      },
    });

    return result.reduce((acc, val) => {
      const syntheseDesResultats =
        SyntheseDesResultats.creerSyntheseDesResultats({
          dateMeteo: val.date_modification?.toISOString() || "",
          dateCommentaire: val.date_modification?.toISOString() || "",
        });

      acc.set(val.chantier_id, [
        ...(acc.get(val.chantier_id) || []),
        syntheseDesResultats,
      ]);
      return acc;
    }, new Map<string, SyntheseDesResultats[]>());
  }
}
