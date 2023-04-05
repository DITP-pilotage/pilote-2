import { PrismaClient } from '@prisma/client';
import HabilitationRepository from '@/server/domain/identité/HabilitationRepository';
import { Habilitation } from '@/server/domain/identité/Habilitation';

export default class HabilitationSQLRepository implements HabilitationRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async récupèreHabilitationsPourUtilisateur(utilisateurEmail: string): Promise<Habilitation> {
    type Row = { chantier_id: string, codes: string[] };
    const rows = await this.prisma.$queryRaw<Row[]>`
with chantier_from_list as (
    select uc.chantier_id, hs.code
      from utilisateur_chantier uc
      join utilisateur u on u.id = uc.utilisateur_id
      join profil_habilitation ph on ph.profil_id = u.profil_id
      join habilitation_scope hs on hs.id = ph.habilitation_scope_id
     where u.email = ${utilisateurEmail}),
chantier_for_premier_ministre as (
    select c.id as chantier_id, hs.code
      from chantier c,
         (select hs.code
            from utilisateur u
            join profil p on p.id = u.profil_id
            join profil_habilitation ph on ph.profil_id = u.profil_id
            join habilitation_scope hs on hs.id = ph.habilitation_scope_id
           where u.email = ${utilisateurEmail}
             and p.a_acces_tous_chantiers
         ) as hs
)
select chantier_id, array_agg(code order by code) as codes
  from (select distinct chantier_id, code from (
    select * from chantier_from_list
    union
    select * from chantier_for_premier_ministre) as chantier_scopes) as chantier_scope_distinct
  group by chantier_id;
`;

    const chantiers: Record<string, string[]> = {};
    for (const row of rows) {
      chantiers[row.chantier_id] = row.codes;
    }

    return { chantiers };
  }
}
