import { PrismaClient, Prisma, perimetre, ministere } from '@prisma/client';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import MinistèreRepository from '@/server/domain/ministère/MinistèreRepository.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';

type MinistèreQueryResult = { nom: string, id: string, icone: string, perimetre_ids: string[], perimetre_noms: string[] };

export default class MinistèreSQLRepository implements MinistèreRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getListe(): Promise<Ministère[]> {
    const queryResults: MinistèreQueryResult[] = await this.prisma.$queryRaw`
        select p.ministere_id as id,
               m.nom,
               m.icone,
               array_agg(p.id order by p.nom) as perimetre_ids,
               array_agg(p.nom order by p.nom) as perimetre_noms
        from perimetre p
                 left join ministere m on p.ministere_id = m.id
        group by m.nom, p.ministere_id, m.icone
        order by m.nom, p.ministere_id;
    `;
    return queryResults.map(queryResult => this.parseMinistère(queryResult));
  }


  private parseMinistère(ministèreQueryResult: MinistèreQueryResult): Ministère {
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
      nom: ministèreQueryResult.nom,
      périmètresMinistériels: périmètres,
      icône: ministèreQueryResult.icone ?? null,
    };
  }

  async getListePourChantiers(chantiers: Chantier[]): Promise<Ministère[]> {
    let list_chantier = chantiers.map(x => x.id);
    const queryResults: MinistèreQueryResult[] = await this.prisma.$queryRaw`
        WITH perimetres_visibles AS (
            select DISTINCT unnest(c.perimetre_ids) as perimetre_id from chantier c where  c.id IN (${Prisma.join(list_chantier)})
        )
        select p.ministere_id as id,
               m.nom,
               m.icone,
               array_agg(p.id order by p.nom) as perimetre_ids,
               array_agg(p.nom order by p.nom) as perimetre_noms
        from perimetre p
                 JOIN perimetres_visibles pv ON pv.perimetre_id = p.id
                 left join ministere m on p.ministere_id = m.id
        group by m.nom, p.ministere_id, m.icone
        order by CASE WHEN p.ministere_id = '1009' THEN 0 ELSE 1 END, m.nom, p.ministere_id;
    `;
    return queryResults.map(queryResult => this.parseMinistère(queryResult));
  }

  async récupérerToutesLesIconesAssociéesÀLeurPérimètre(): Promise<{ perimetre_id: perimetre['id'], icone: ministere['icone'] }[]> {
    return this.prisma.$queryRaw`
      SELECT p.id AS perimetre_id, m.icone
      FROM perimetre p
      LEFT JOIN ministere m ON p.ministere_id = m.id
      WHERE m.icone IS NOT NULL
`;
  }

  async récupérerLesNomsAssociésÀLeurPérimètre(périmètresIds: perimetre['id'][]): Promise<{ perimetre_id: perimetre['id'], nom: ministere['nom'] }[]> {
    return this.prisma.$queryRaw`
      SELECT p.id AS perimetre_id, m.nom
      FROM perimetre p
      LEFT JOIN ministere m ON p.ministere_id = m.id
      WHERE p.id = ANY (${périmètresIds})
  `;
  }
}
