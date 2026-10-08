import { ChantierRepository } from "@/server/chantiers/infrastructure/sql/ChantierRepository.interface";
import { Maille } from "@/shared/maille/Maille.interface";
import { NOMS_MAILLES } from "@/shared/maille/mailleSQLParser";
import { ChantierPourAgregation } from "@/server/chantiers/domain/agregateurListeChantiers/agregateur";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";

export class ChantierSQLRepository implements ChantierRepository {
  private readonly prismaPilote: PrismaPilote;

  constructor({ prisma }: { prisma: PrismaPilote }) {
    this.prismaPilote = prisma;
  }

  async recupererDonneesAvancementChantiers(
    chantierIds: string[],
    jalon: number,
  ): Promise<ChantierPourAgregation[]> {
    const prisma = this.prismaPilote.getInstance();
    const rows = await prisma.chantier_identite.findMany({
      where: { id: { in: chantierIds } },
      select: {
        id: true,
        chantier_territoire: {
          select: {
            maille: true,
            territoire_code: true,
            est_applicable: true,
            taux_avancement_mandat: true,
            chantier_territoire_jalon: {
              where: { jalon },
              select: { taux_avancement: true, date_taux_avancement: true },
            },
          },
        },
      },
    });

    return rows.map((row) => {
      const mailles: ChantierPourAgregation["mailles"] = {
        nationale: {},
        departementale: {},
        regionale: {},
      };
      for (const ct of row.chantier_territoire) {
        const maille: Maille = NOMS_MAILLES[ct.maille];
        mailles[maille][ct.territoire_code] = {
          estApplicable: ct.est_applicable,
          avancement: {
            global: ct.taux_avancement_mandat ?? null,
            annuel: ct.chantier_territoire_jalon[0]?.taux_avancement ?? null,
          },
          dateTauxAvancementAnnuel:
            ct.chantier_territoire_jalon[0]?.date_taux_avancement?.toISOString() ??
            null,
        };
      }
      return { mailles };
    });
  }
}
