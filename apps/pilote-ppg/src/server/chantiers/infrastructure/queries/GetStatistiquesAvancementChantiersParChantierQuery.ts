import { AvancementsStatistiques } from "@/components/_commons/Avancements/Avancements.interface";
import { Maille } from "@/server/domain/maille/Maille.interface";
import { CODES_MAILLES } from "@/server/infrastructure/accès_données/maille/mailleSQLParser";
import { calculerMediane } from "@/client/utils/statistiques/statistiques";
import type { Inject } from "@/server/chantiers/module";

export class GetStatistiquesAvancementChantiersParChantierQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async execute(params: {
    listeChantier: string[];
    maille: Maille;
    jalon: number;
  }): Promise<Map<string, AvancementsStatistiques>> {
    const prisma = this.deps.prisma.getInstance();
    const rows = await prisma.chantier_territoire_jalon.findMany({
      where: {
        id: { in: params.listeChantier },
        jalon: params.jalon,
        maille: CODES_MAILLES[params.maille],
        NOT: { taux_avancement: { equals: null } },
      },
      select: { id: true, taux_avancement: true },
    });

    const valeursParChantier = new Map<string, number[]>();
    for (const row of rows) {
      if (row.taux_avancement !== null) {
        const valeurs = valeursParChantier.get(row.id) ?? [];
        valeurs.push(Number(row.taux_avancement));
        valeursParChantier.set(row.id, valeurs);
      }
    }

    const result = new Map<string, AvancementsStatistiques>();
    for (const [chantierId, valeurs] of valeursParChantier) {
      const sorted = [...valeurs].sort((a, b) => a - b);
      result.set(chantierId, {
        minimum: sorted.at(0) ?? null,
        maximum: sorted.at(-1) ?? null,
        médiane: calculerMediane(sorted),
      });
    }
    return result;
  }
}
