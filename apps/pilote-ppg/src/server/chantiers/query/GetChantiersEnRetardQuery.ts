import { PrismaPilote } from "@/server/db/PrismaPilote";

type ChantierIdentiteSynthese = {
  id: string;
  nom: string;
  axe: string;
  ppg: string;
  ministeres: string[];
};

type SyntheseResultat = {
  meteo: string | null;
  commentaire: string | null;
  date_meteo: string | null;
  date_commentaire: string | null;
};

export type ChantierEnRetard = {
  chantier: ChantierIdentiteSynthese;
  ecart: number;
  taux_avancement: number | null;
  synthese: SyntheseResultat | null;
};

export type GetChantiersEnRetardResult = {
  territoire_code: string;
  territoire_nom: string;
  jalon: number;
  chantiers_en_retard: ChantierEnRetard[];
};

export class GetChantiersEnRetardQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async execute(params: {
    territoireCode: string;
    jalon: number;
  }): Promise<GetChantiersEnRetardResult> {
    const prisma = this.deps.prisma.getInstance();

    const territoire = await prisma.territoire.findUniqueOrThrow({
      where: { code: params.territoireCode },
    });

    const chantiersTerritoire = await prisma.chantier_territoire.findMany({
      where: {
        territoire_code: params.territoireCode,
        est_applicable: true,
        chantier_identite: { statut: "PUBLIE" },
        chantier_territoire_jalon: {
          some: {
            jalon: params.jalon,
            ecart: { lte: -10 },
          },
        },
      },
      include: {
        chantier_identite: true,
        chantier_territoire_jalon: {
          where: { jalon: params.jalon },
        },
        syntheses_des_resultats: {
          orderBy: { date_modification: "desc" },
          take: 1,
        },
      },
    });

    const chantiers_en_retard: ChantierEnRetard[] = chantiersTerritoire
      .map((c) => ({
        chantier: {
          id: c.chantier_identite.id,
          nom: c.chantier_identite.nom,
          axe: c.chantier_identite.axe,
          ppg: c.chantier_identite.ppg,
          ministeres: c.chantier_identite.ministeres_acronymes,
        },
        ecart: c.chantier_territoire_jalon[0].ecart!,
        taux_avancement: c.chantier_territoire_jalon[0]?.taux_avancement,
        synthese:
          c.syntheses_des_resultats.length > 0
            ? {
                meteo: c.syntheses_des_resultats[0].meteo,
                commentaire: c.syntheses_des_resultats[0].commentaire,
                date_meteo:
                  c.syntheses_des_resultats[0].date_modification?.toISOString() ??
                  null,
                date_commentaire:
                  c.syntheses_des_resultats[0].date_modification?.toISOString() ??
                  null,
              }
            : null,
      }))
      .sort((a, b) => a.ecart - b.ecart);

    return {
      territoire_code: params.territoireCode,
      territoire_nom: territoire.nom,
      jalon: params.jalon,
      chantiers_en_retard,
    };
  }
}
