import { Inject } from "@/server/chantiers/module";
import { calculerMediane } from "@/client/utils/statistiques/statistiques";
import { ChantierTendance } from "@/server/domain/chantier/Chantier.interface";

export type SituationChantierViewModel = {
  ecart: number | null;
  tendance: ChantierTendance | null;
  tauxAvancementPrecedent: number | null;
  dateTauxAvancementPrecedent: string | null;
  mediane: number | null;
};

export class GetSituationChantierQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async execute(params: {
    chantierId: string;
    jalon: number;
    territoireCode: string;
  }): Promise<SituationChantierViewModel> {
    const prisma = this.deps.prisma.getInstance();

    const chantierTerritoire =
      await prisma.chantier_territoire.findUniqueOrThrow({
        where: {
          id_territoire_code: {
            id: params.chantierId,
            territoire_code: params.territoireCode,
          },
        },
        select: {
          tendance: true,
          taux_avancement_mandat_valeur_precedente: true,
          date_taux_avancement_mandat_valeur_precedente: true,
          maille: true,
        },
      });

    const jalonRow = await prisma.chantier_territoire_jalon.findUnique({
      where: {
        id_territoire_code_jalon: {
          id: params.chantierId,
          territoire_code: params.territoireCode,
          jalon: params.jalon,
        },
      },
      select: { ecart: true },
    });

    const allJalonRows = await prisma.chantier_territoire_jalon.findMany({
      where: {
        id: params.chantierId,
        jalon: params.jalon,
        maille: chantierTerritoire.maille,
      },
      select: { taux_avancement: true },
    });

    const mediane = calculerMediane(
      allJalonRows.map((row) => row.taux_avancement),
    );

    return {
      ecart: jalonRow?.ecart ?? null,
      tendance: chantierTerritoire.tendance,
      tauxAvancementPrecedent:
        chantierTerritoire.taux_avancement_mandat_valeur_precedente,
      dateTauxAvancementPrecedent:
        chantierTerritoire.date_taux_avancement_mandat_valeur_precedente?.toISOString() ??
        null,
      mediane,
    };
  }
}
