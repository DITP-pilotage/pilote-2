import { PrismaClient } from '@prisma/client';
import HabilitationRepository from '@/server/domain/identité/HabilitationRepository';
import { Habilitation } from '@/server/domain/identité/Habilitation';
import { SANS_HABILITATIONS } from '@/server/domain/identité/Profil';

export default class HabilitationSQLRepository implements HabilitationRepository {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  async récupèreHabilitationsPourUtilisateur(email: string): Promise<Habilitation> {
    type Row = { chantier_id: string, codes: string[] };
    const rows = await this.prisma.$queryRaw<Row[]>`
        with chantier_from_list as (select uc.chantier_id, hs.code
                                    from utilisateur_chantier uc
                                             join utilisateur u on u.id = uc.utilisateur_id
                                             join profil_habilitation ph on ph.profil_id = u.profil_id
                                             join habilitation_scope hs on hs.id = ph.habilitation_scope_id
                                    where u.email = ${email}),
             chantier_for_premier_ministre as (select c.id as chantier_id, hs.code
                                               from chantier c,
                                                    (select hs.code
                                                     from utilisateur u
                                                              join profil p on p.id = u.profil_id
                                                              join profil_habilitation ph on ph.profil_id = u.profil_id
                                                              join habilitation_scope hs on hs.id = ph.habilitation_scope_id
                                                     where u.email = ${email}
                                                       and p.a_acces_tous_chantiers) as hs)
        select chantier_id, array_agg(code order by code) as codes
        from (select distinct chantier_id, code
              from (select *
                    from chantier_from_list
                    union
                    select *
                    from chantier_for_premier_ministre) as chantier_scopes) as chantier_scope_distinct
        group by chantier_id;
    `;

    const chantiers: Record<string, string[]> = {};
    for (const row of rows) {
      chantiers[row.chantier_id] = row.codes;
    }

    return { chantiers };
  }

  async supprimeHabilitationsPourUtilisateur(email: string): Promise<void> {
    await this.prisma.$executeRaw`
        update utilisateur
        set profil_id = p.id from utilisateur u, profil p
        where u.email = ${email}
          and p.code = ${SANS_HABILITATIONS}
    `;
    await this.prisma.$executeRaw`
        delete
        from utilisateur_chantier uc using utilisateur u
        where u.id = uc.utilisateur_id
          and u.email = ${email} `;
  }

  async récupèreAssociationsAvecChantier(email: string): Promise<string[]> {
    type Row = { chantier_id: string };
    const resultSet = await this.prisma.$queryRaw<Row[]>`
        select uc.chantier_id
        from utilisateur_chantier uc
                 join utilisateur u on u.id = uc.utilisateur_id
        where u.email = ${email}
    `;
    return resultSet.map(it => it.chantier_id);
  }
}
