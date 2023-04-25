import { chantier, Prisma, PrismaClient } from '@prisma/client';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { groupBy } from '@/client/utils/arrays';
import { parseChantier } from '@/server/infrastructure/accès_données/chantier/ChantierSQLParser';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { objectEntries } from '@/client/utils/objects/objects';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import {
  Habilitation,
  récupereListeChantierAvecScope,
  Scope,
  SCOPE_LECTURE,
} from '@/server/domain/identité/Habilitation';
import { ChantierPourExport } from '@/server/domain/chantier/ChantierPourExport';

class ErreurChantierNonTrouvé extends Error {
  constructor(idChantier: string) {
    super(`Erreur: chantier '${idChantier}' non trouvé.`);
  }
}

class ErreurChantierPermission extends Error {
  constructor(idChantier: string, scope: string) {
    super(`Erreur de Permission: l'utilisateur n'a pas le droit '${scope}' pour le chantier '${idChantier}'.`);
  }
}

export default class ChantierSQLRepository implements ChantierRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getById(id: string, habilitation: Habilitation, scope: Scope): Promise<Chantier> {


    const chantierIds = récupereListeChantierAvecScope(habilitation,  scope);
  
    if (!chantierIds.some(elt => elt == id)) {
      throw new ErreurChantierPermission(id, scope);
    }

    const chantiers: chantier[] = await this.prisma.chantier.findMany({
      where: { id },
    });

    if (!chantiers || chantiers.length === 0) {
      throw new ErreurChantierNonTrouvé(id);
    }

    return parseChantier(chantiers);
  }

  async getListe(habilitation: Habilitation, scope: Scope): Promise<Chantier[]> {
    const chantiers_lecture = récupereListeChantierAvecScope(habilitation, scope);

    const chantiers = await this.prisma.chantier.findMany({
      where: {
        NOT: { ministeres: { isEmpty: true } },
        id: { in: chantiers_lecture },
      },
    });
    const chantiersGroupésParId = groupBy<chantier>(chantiers, c => c.id);

    return objectEntries(chantiersGroupésParId).map(([_, c]) => parseChantier(c));
  }

  async récupérerMétéoParChantierIdEtTerritoire(chantierId: string, maille: Maille, codeInsee: CodeInsee): Promise<Météo | null> {
    const chantierRow: chantier | null = await this.prisma.chantier.findFirst({
      where: {
        id: chantierId,
        maille: CODES_MAILLES[maille],
        code_insee: codeInsee,
      },
    });

    if (!chantierRow) {
      throw new ErreurChantierNonTrouvé(chantierId);
    }

    // TODO: avoir une réflexion sur avoir un mapper et retourné un objet du domainz Chantier
    return chantierRow.meteo as Météo | null;
  }

  async modifierMétéo(chantierId: string, maille: Maille, codeInsee: CodeInsee, météo: Météo) {
    await this.prisma.chantier.update({
      data: {
        meteo: météo,
      },
      where: {
        id_code_insee_maille: {
          id: chantierId,
          maille: CODES_MAILLES[maille],
          code_insee: codeInsee,
        },
      },
    });
  }

  async getChantiersPourExports(habilitation: Habilitation): Promise<ChantierPourExport[]> {
    const chantiers_lecture = récupereListeChantierAvecScope(habilitation, SCOPE_LECTURE);

    const rows = await this.prisma.$queryRaw<any[]>`
        with chantier_ids as (select distinct c.id
                              from chantier c
                              where c.id in (${Prisma.join(chantiers_lecture)})
                                and ministeres <> '{}')

        select c.*,
               r.territoire_code code_regional,
               d.territoire_code code_departemental,
               n.taux_avancement taux_national,
               r.taux_avancement taux_regional,
               d.taux_avancement taux_departemental
        from chantier_ids cids
                 cross join territoire t
                 left outer join chantier c on c.id = cids.id and c.territoire_code = t.code
                 left outer join chantier n on n.id = cids.id and n.maille = 'NAT'
                 left outer join chantier r on (r.id = cids.id and r.maille = 'REG')
            and (r.territoire_code = t.code or r.territoire_code = t.code_parent)
                 left outer join chantier d on d.id = cids.id and d.maille = 'DEPT' and d.territoire_code = t.code
        order by c.id, t.code
    `;
    return rows.map(it => new ChantierPourExport(
      it.id,
      it.maille,
      it.code_insee,
      it.code_regional,
      it.code_departemental,
      it.taux_national,
      it.taux_regional,
      it.taux_departemental,
      it.meteo,
      it.est_barometre,
      it.est_territorialise,
    ));
  }
}
