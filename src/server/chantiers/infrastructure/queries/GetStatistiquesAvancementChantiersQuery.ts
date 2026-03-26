import { AvancementsStatistiques } from "@/components/_commons/Avancements/Avancements.interface";
import Chantier from "@/server/domain/chantier/Chantier.interface";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { Maille } from "@/server/domain/maille/Maille.interface";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { CODES_MAILLES } from "@/server/infrastructure/accès_données/maille/mailleSQLParser";
import { calculerMediane } from "@/client/utils/statistiques/statistiques";
import { verifyValeurIsNotNullOrUndefined } from "@/server/utils/VerifyValeurIsNotNullOrUndefined";
import type { Inject } from "@/server/chantiers/module";

export class GetStatistiquesAvancementChantiersQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async execute(params: {
    habilitations: Habilitations;
    listeChantier: Chantier["id"][];
    maille: Maille;
    jalon: number;
  }): Promise<AvancementsStatistiques> {
    const prisma = this.deps.prisma.getInstance();
    const habilitation = new Habilitation(params.habilitations);
    const chantiersAutorisés =
      habilitation.récupérerListeChantiersIdsAccessiblesEnLecture();
    const chantiersLecture = params.listeChantier.filter((chantier) =>
      chantiersAutorisés.includes(chantier),
    );

    const listeMoyenneParTerritoire =
      await prisma.chantier_territoire_jalon.groupBy({
        by: ["territoire_code"],
        _avg: {
          taux_avancement: true,
        },
        where: {
          id: {
            in: chantiersLecture,
          },
          jalon: params.jalon,
          maille: CODES_MAILLES[params.maille],
          NOT: {
            taux_avancement: {
              equals: null,
            },
          },
        },
        orderBy: {
          _avg: {
            taux_avancement: "asc",
          },
        },
      });

    return {
      médiane: calculerMediane(
        listeMoyenneParTerritoire.map(
          (moyenneParTerritoire) => moyenneParTerritoire._avg.taux_avancement,
        ),
      ),
      minimum: verifyValeurIsNotNullOrUndefined(
        listeMoyenneParTerritoire.at(0)?._avg.taux_avancement,
      ),
      maximum: verifyValeurIsNotNullOrUndefined(
        listeMoyenneParTerritoire.at(-1)?._avg.taux_avancement,
      ),
    };
  }
}
