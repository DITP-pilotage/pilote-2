import { PrismaClient } from '@prisma/client';
import HabilitationRepository from '@/server/domain/identité/HabilitationRepository';
import { Habilitation } from '@/server/domain/identité/Habilitation';
import logger from '@/server/infrastructure/logger';

export default class HabilitationSQLRepository implements HabilitationRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async récupèreHabilitationsPourUtilisateur(utilisateurEmail: string): Promise<Habilitation> {
    const rows = await this.prisma.$queryRaw`
with chantier_from_list as (
  select uc.chantier_id, hs.nom
    from utilisateur_chantier uc
    join utilisateur u on u.id = uc.utilisateur_id
    join profil_habilitation ph on ph.profil_id = u.profil_id
    join habilitation_scope hs on hs.id = ph.habilitation_scope_id
   where u.email = ${utilisateurEmail})

  select chantier_id, array_agg(nom order by nom) as noms from chantier_from_list group by chantier_id;
`;

    const chantiers = {};
    for (const row of rows) {
      chantiers[row.chantier_id] = row.noms;
    }

    return { chantiers };
  }
}
