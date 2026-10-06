import { Prisma } from "@prisma/client";
import { PérimètreMinistériel } from "@/shared/perimetreMinisteriel/PerimetreMinisteriel.interface";
import { MinistèreRepository } from "@/server/chantiers/infrastructure/sql/MinistereRepository.interface";
import { Ministère } from "@/shared/ministere/Ministere.interface";
import { prisma } from "@/server/framework/persistence/prisma";

type MinistèreQueryResult = {
  nom: string;
  id: string;
  acronyme: string;
  icone: string;
  perimetre_ids: string[];
  perimetre_noms: string[];
};

export class MinistèreSQLRepository implements MinistèreRepository {
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

  async getListePourChantiers(chantierIds: string[]): Promise<Ministère[]> {
    const queryResults: MinistèreQueryResult[] = await prisma.$queryRaw`
        WITH perimetres_visibles AS (
            select DISTINCT unnest(c.perimetre_ids) as perimetre_id from chantier_identite c where c.id IN (${Prisma.join(chantierIds)})
        )
        select p.ministere_id as id,
               m.nom,
               m.acronyme,
               m.icone,
               array_agg(p.id order by p.nom) as perimetre_ids,
               array_agg(p.nom order by p.nom) as perimetre_noms
        from perimetre p
                 JOIN perimetres_visibles pv ON pv.perimetre_id = p.id
                 left join ministere m on p.ministere_id = m.id
        group by m.nom, p.ministere_id, m.icone, m.acronyme
        order by CASE WHEN p.ministere_id = '1009' THEN 0 ELSE 1 END, m.nom, p.ministere_id;
    `;
    return queryResults.map((queryResult) => this.parseMinistère(queryResult));
  }
}
