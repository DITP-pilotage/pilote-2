import {
  chantier_identite as PrismaChantierIdentite,
  chantier_territoire as PrismaChantierTerritoire,
  chantier_territoire_jalon as PrismaChantierTerritoireJalon,
  Prisma,
  type_statut,
} from "@prisma/client";
import ChantierRepository from "@/server/domain/chantier/ChantierRepository.interface";
import Chantier from "@/server/domain/chantier/Chantier.interface";
import { Maille } from "@/server/domain/maille/Maille.interface";
import {
  CODES_MAILLES,
  NOMS_MAILLES,
} from "@/server/infrastructure/accès_données/maille/mailleSQLParser";
import { ChantierPourAgregation } from "@/client/utils/chantier/agrégateurListeChantiers/agregateur";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { AvancementsStatistiques } from "@/components/_commons/Avancements/Avancements.interface";
import {
  ProfilCode,
  profilsTerritoriaux,
} from "@/server/domain/utilisateur/Utilisateur.interface";
import { FiltreQueryParams } from "@/server/chantiers/app/contrats/FiltreQueryParams";
import { removeAccents } from "@/server/utils/remove-accents";
import { calculerMediane } from "@/client/utils/statistiques/statistiques";
import { RepartitionMeteoChantiers } from "@/server/chantiers/domain/RepartitionMeteoChantiers";
import { verifyValeurIsNotNullOrUndefined } from "@/server/utils/VerifyValeurIsNotNullOrUndefined";
import { prisma } from "@/server/db/prisma";

class ErreurChantierNonTrouvé extends Error {
  constructor(idChantier: string) {
    super(`Erreur: chantier '${idChantier}' non trouvé.`);
  }
}

export class ErreurChantierPermission extends Error {
  constructor(idChantier: string) {
    super(
      `Erreur de Permission: l'utilisateur n'a pas le droit de lecture pour le chantier '${idChantier}'.`,
    );
  }
}

export default class ChantierSQLRepository implements ChantierRepository {
  async récupérerLesEntréesDUnChantier(
    id: string,
    habilitations: Habilitations,
    profil: ProfilCode,
    jalon: number,
  ): Promise<
    PrismaChantierIdentite & {
      chantier_territoire: (PrismaChantierTerritoire & {
        chantier_territoire_jalon: PrismaChantierTerritoireJalon[];
      })[];
    }
  > {
    const habilitation = new Habilitation(habilitations);
    const listeChantiersIdsAccessiblesEnLecture =
      habilitation.récupérerListeChantiersIdsAccessiblesEnLecture();

    let listeTerritoireAccessibleEnLecture =
      habilitation.récupérerListeTerritoireCodesAccessiblesEnLecture();

    const peutAccéderAuChantier =
      listeChantiersIdsAccessiblesEnLecture.includes(id);

    if (!peutAccéderAuChantier) {
      throw new ErreurChantierPermission(id);
    }

    const chantier = await prisma.chantier_identite.findUnique({
      where: {
        id,
      },
      include: {
        chantier_territoire: {
          where: {
            territoire_code: {
              in: profilsTerritoriaux.includes(profil)
                ? undefined
                : [...listeTerritoireAccessibleEnLecture, "NAT-FR"],
            },
          },
          include: {
            chantier_territoire_jalon: {
              where: {
                jalon,
              },
            },
          },
        },
      },
    });

    if (!chantier) {
      throw new ErreurChantierNonTrouvé(id);
    }

    return chantier;
  }

  async getChantierStatistiques(
    habilitations: Habilitations,
    listeChantier: Chantier["id"][],
    maille: Maille,
    jalon: number,
  ): Promise<AvancementsStatistiques> {
    const habilitation = new Habilitation(habilitations);
    const chantiersAutorisés =
      habilitation.récupérerListeChantiersIdsAccessiblesEnLecture();
    const chantiersLecture = listeChantier.filter((x) =>
      chantiersAutorisés.includes(x),
    );

    const listeMoyenneParTerritoire =
      await prisma.chantier_territoire_jalon.groupBy({
        by: ["territoire_code"],
        _avg: {
          taux_avancement: true,
        },
        where: {
          id: {
            in: chantiersLecture || [],
          },
          jalon: jalon,
          maille: CODES_MAILLES[maille],
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

  async recupererLaRepartitionMeteo(
    chantiersLectureIds: string[],
    territoireCode: string,
    filtres: FiltreQueryParams,
  ): Promise<RepartitionMeteoChantiers> {
    const whereOptions: Prisma.chantier_identiteWhereInput = {};

    if (filtres.perimetres?.length > 0) {
      whereOptions.perimetre_ids = {
        hasSome: filtres.perimetres,
      };
    }

    if (filtres.statut?.length > 0) {
      whereOptions.statut = {
        in: filtres.statut as type_statut[],
      };
    }

    if (filtres.axes?.length > 0) {
      whereOptions.axe = {
        in: filtres.axes,
      };
    }

    if (filtres.territorialisation?.length > 0) {
      // Mise en place du bon where en fonction de la territorialisation choisie
      if (filtres.territorialisation?.length === 1) {
        if (filtres.territorialisation[0] === "nationale") {
          whereOptions.mailles_applicables = {
            equals: ["NAT"],
          };
        } else if (filtres.territorialisation[0] === "regionale") {
          whereOptions.NOT = {
            mailles_applicables: {
              has: "DEPT",
            },
          };
          whereOptions.est_territorialise = true;
        } else if (filtres.territorialisation[0] === "departementale") {
          whereOptions.mailles_applicables = {
            has: "DEPT",
          };
          whereOptions.est_territorialise = true;
        }
      } else if (filtres.territorialisation?.length === 2) {
        if (
          filtres.territorialisation.includes("nationale") &&
          filtres.territorialisation.includes("regionale")
        ) {
          whereOptions.OR = [
            {
              est_territorialise: null,
            },
            {
              est_territorialise: true,
              NOT: {
                mailles_applicables: {
                  has: "DEPT",
                },
              },
            },
          ];
        } else if (
          filtres.territorialisation.includes("regionale") &&
          filtres.territorialisation.includes("departementale")
        ) {
          whereOptions.est_territorialise = true;
        } else if (
          filtres.territorialisation.includes("nationale") &&
          filtres.territorialisation.includes("departementale")
        ) {
          whereOptions.OR = [
            {
              est_territorialise: null,
            },
            {
              est_territorialise: true,
              mailles_applicables: {
                has: "DEPT",
              },
            },
          ];
        }
      }
    }

    if (filtres.estBarometre) {
      whereOptions.est_barometre = true;
    }

    let chantierIds = chantiersLectureIds;

    if (filtres.valeurDeLaRecherche?.length > 0) {
      const testLower = removeAccents(
        filtres.valeurDeLaRecherche.toLowerCase(),
      );

      chantierIds = await prisma
        .$queryRawUnsafe<
          { id: string }[]
        >("SELECT distinct(id) FROM chantier_identite where (LOWER(unaccent(nom)) ILIKE $1 OR LOWER(unaccent(id)) ILIKE $1)", `%${testLower}%`)
        .then((chantiersMatched) =>
          chantiersMatched
            .map((chantierMatched) => chantierMatched.id)
            .filter((chantierId) => chantiersLectureIds.includes(chantierId)),
        );
    }
    const meteosGroupee = await prisma.chantier_territoire.groupBy({
      by: ["meteo"],
      _count: true,
      where: {
        territoire_code: territoireCode,
        est_applicable: true,
        chantier_identite: {
          NOT: { ministeres: { isEmpty: true } },
          ...whereOptions,
        },
        id: { in: chantierIds },
      },
    });

    return RepartitionMeteoChantiers.creerRepartitionMeteoChantiers({
      nombreCouvert:
        meteosGroupee.find((meteo) => meteo.meteo === "COUVERT")?._count ?? 0,
      nombreNuage:
        meteosGroupee.find((meteo) => meteo.meteo === "NUAGE")?._count ?? 0,
      nombreOrage:
        meteosGroupee.find((meteo) => meteo.meteo === "ORAGE")?._count ?? 0,
      nombreSoleil:
        meteosGroupee.find((meteo) => meteo.meteo === "SOLEIL")?._count ?? 0,
    });
  }

  async recupererDonneesAvancementChantiers(
    chantierIds: string[],
    jalon: number,
  ): Promise<ChantierPourAgregation[]> {
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
              select: { taux_avancement: true },
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
        };
      }
      return { mailles };
    });
  }
}
