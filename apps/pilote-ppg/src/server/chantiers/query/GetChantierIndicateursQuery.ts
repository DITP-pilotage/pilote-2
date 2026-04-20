import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export type GetChantierIndicateursResult = {
  territoire_code: string;
  chantier_id: string;
  indicateurs: {
    indicateur_id: string;
    nom: string;
    unite_mesure: string | null;
    valeur_initiale: number | null;
    date_valeur_initiale: string | null;
    valeur_actuelle: number | null;
    date_valeur_actuelle: string | null;
    valeur_cible: number | null;
    date_valeur_cible: string | null;
    taux_avancement: number | null;
  }[];
};

export class GetChantierIndicateursQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async execute(params: {
    territoireCode: string;
    chantierId: string;
    jalon: number;
  }): Promise<GetChantierIndicateursResult> {
    const prisma = this.deps.prisma.getInstance();

    const rows = await prisma.indicateur_territoire.findMany({
      where: {
        territoire_code: params.territoireCode,
        chantier_id: params.chantierId,
        indicateur_identite: { statut: $Enums.type_statut_indicateur.PUBLIE },
      },
      include: {
        indicateur_territoire_jalon: {
          where: { jalon: params.jalon },
        },
        indicateur_identite: true,
      },
    });

    return {
      territoire_code: params.territoireCode,
      chantier_id: params.chantierId,
      indicateurs: rows.map((row) => {
        const jalon = row.indicateur_territoire_jalon[0] ?? null;
        return {
          indicateur_id: row.id,
          nom: row.indicateur_identite.nom,
          unite_mesure: row.indicateur_identite.unite_mesure ?? null,
          valeur_initiale: row.valeur_initiale ?? null,
          date_valeur_initiale: row.date_valeur_initiale?.toISOString() ?? null,
          valeur_actuelle: jalon?.valeur_actuelle ?? null,
          date_valeur_actuelle:
            jalon?.date_valeur_actuelle?.toISOString() ?? null,
          valeur_cible: jalon?.valeur_cible ?? null,
          date_valeur_cible: jalon?.date_valeur_cible?.toISOString() ?? null,
          taux_avancement: jalon?.taux_avancement ?? null,
        };
      }),
    };
  }
}
