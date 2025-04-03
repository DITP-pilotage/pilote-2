import { ministere, perimetre, Prisma, PrismaClient } from '@prisma/client';
import { PerimetreMinisteriel } from '@/server/chantiers/domain/PerimetreMinisteriel';
import { MinistereRepository } from '@/server/chantiers/domain/ports/MinistereRepository';
import { Ministere } from '@/server/chantiers/domain/Ministere';
import { PrismaPilote } from '@/server/db/PrismaPilote';

type MinistèreQueryResult = { nom: string, id: string, acronyme: string, icone: string, perimetre_ids: string[], perimetre_noms: string[] };

type Dependencies = {
  prisma: PrismaPilote;
};

export class PrismaMinistereRepository implements MinistereRepository {
  private prisma: PrismaClient;

  constructor({ prisma }: Dependencies) {
    this.prisma = prisma.getInstance();
  }

  async getListe(): Promise<Ministere[]> {
    const queryResults: MinistèreQueryResult[] = await this.prisma.$queryRaw`
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
    return queryResults.map(queryResult => this.parseMinistère(queryResult));
  }

  private parseMinistère(ministèreQueryResult: MinistèreQueryResult): Ministere {
    const périmètres: PerimetreMinisteriel[] = [];
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

  async getListePourChantiers(chantierIds: string[]): Promise<Ministere[]> {
    const queryResults: MinistèreQueryResult[] = await this.prisma.$queryRaw`
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
