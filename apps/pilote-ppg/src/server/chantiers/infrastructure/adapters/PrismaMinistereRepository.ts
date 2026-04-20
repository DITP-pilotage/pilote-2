import PérimètreMinistériel from "@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface";
import Ministère from "@/server/domain/ministère/Ministère.interface";
import { prisma } from "@/server/db/prisma";
import { MinistereRepository } from "@/server/chantiers/domain/ports/MinistereRepository";

type MinistèreQueryResult = {
  nom: string;
  id: string;
  acronyme: string;
  icone: string;
  perimetre_ids: string[];
  perimetre_noms: string[];
};

export default class PrismaMinistereRepository implements MinistereRepository {
  async getListe(): Promise<Ministère[]> {
    const queryResults: MinistèreQueryResult[] = await prisma.$queryRaw`
        select p.ministere_id as id,
               m.nom,
               m.acronyme,
               m.icone,
               array_agg(p.id order by p.nom) as perimetre_ids,
               array_agg(p.nom order by p.nom) as perimetre_noms
        from perimetre p
                 left join ministere m on p.ministere_id = m.id
        group by m.nom, p.ministere_id, m.icone, m.acronyme
        order by m.nom, p.ministere_id;
    `;
    return queryResults.map((queryResult) => this.parseMinistère(queryResult));
  }

  private parseMinistère(
    ministèreQueryResult: MinistèreQueryResult,
  ): Ministère {
    const périmètres: PérimètreMinistériel[] = [];
    for (let i = 0; i < ministèreQueryResult.perimetre_ids.length; ++i) {
      périmètres.push({
        id: ministèreQueryResult.perimetre_ids[i],
        nom: ministèreQueryResult.perimetre_noms[i],
        ministèreId: ministèreQueryResult.id,
        ministèreNom: ministèreQueryResult.nom,
      });
    }

    return {
      id: ministèreQueryResult.id,
      acronyme: ministèreQueryResult.acronyme,
      nom: ministèreQueryResult.nom,
      périmètresMinistériels: périmètres,
      icône: ministèreQueryResult.icone ?? null,
    };
  }
}
