import { Prisma, type_objectif, type_statut } from "@prisma/client";
import { ChantierRepository } from "@/server/chantiers/domain/ports/ChantierRepository";
import { DonneeChantier } from "@/server/chantiers/domain/DonneeChantier";
import { prisma } from "@/server/db/prisma";
import { Météo } from "@/server/domain/météo/Météo.interface";
import { OptionsExport } from "@/server/usecase/chantier/OptionsExport";
import { verifyValeurIsNotNullOrUndefined } from "@/server/utils/VerifyValeurIsNotNullOrUndefined";
import { ChantierPourExport } from "@/server/chantiers/domain/ChantierPourExport";
import { PropositionValeurAvancementChantierInformation } from "@/server/chantiers/domain/PropositionValeurAvancementChantierInformation";
import { NotFoundError } from "@/server/app/error-boundary/not-found-error";
import {
  ProfilCode,
  profilsTerritoriaux,
} from "@/server/domain/utilisateur/Utilisateur.interface";
import { removeAccents } from "@/server/utils/remove-accents";
import { FiltreQueryParams } from "@/server/chantiers/app/contrats/FiltreQueryParams";
import { PrismaChantier } from "@/server/chantiers/domain/PrismaChantier";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";

class ErreurChantierNonTrouvé extends Error {
  constructor(idChantier: string) {
    super(`Erreur: chantier '${idChantier}' non trouvé.`);
  }
}

class ErreurChantierPermission extends Error {
  constructor(idChantier: string) {
    super(
      `Erreur de Permission: l'utilisateur n'a pas le droit de lecture pour le chantier '${idChantier}'.`,
    );
  }
}

export class PrismaChantierRepository implements ChantierRepository {
  async récupérerDonneesChantier(
    chantierId: string,
    territoireCodesLecture: string[],
  ): Promise<DonneeChantier[]> {
    const chantierIds = await prisma.chantier_identite.findMany({
      where: {
        id: chantierId,
        NOT: [
          {
            ministeres: { isEmpty: true },
          },
        ],
      },
      select: {
        id: true,
      },
      distinct: ["id"],
    });

    const listePrismaChantierIdentite = await prisma.chantier_identite.findMany(
      {
        where: {
          id: { in: chantierIds.map((chantier) => chantier.id) },
        },
        include: {
          chantier_territoire: {
            where: {
              est_applicable: true,
            },
            include: {
              territoire: true,
              chantier_territoire_jalon: {
                where: {
                  jalon: 2025,
                },
              },
            },
          },
        },
        orderBy: { id: "asc" },
      },
    );

    const resultChantierIds = listePrismaChantierIdentite.map(
      (chantier) => chantier.id,
    );

    const listeTypesCommentaires = [
      "actions_a_venir",
      "actions_a_valoriser",
      "freins_a_lever",
      "commentaires_sur_les_donnees",
      "autres_resultats_obtenus",
      "autres_resultats_obtenus_non_correles_aux_indicateurs",
    ];
    const listeTypesDecisionsStrategiques = ["suivi_des_decisions"] as const;

    const listeTypesObjectifs = [
      "notre_ambition",
      "deja_fait",
      "a_faire",
    ] as type_objectif[];

    const [
      mapActionsAVenir,
      mapActionsAValoriser,
      mapFreinsALever,
      mapCommentairesSurLesDonnees,
      mapAutresResultatsObtenus,
      mapAutresResultatsObtenusNonCorrelesAuxIndicateurs,
      mapSynthesesDesResultats,
      mapMeteo,
      mapDecisionsStrategiques,
      mapNotreAmbition,
      mapDejaFait,
      mapAFaire,
    ] = await Promise.all([
      ...listeTypesCommentaires.map((typeCommentaire) =>
        prisma.chantier_territoire
          .findMany({
            where: {
              id: { in: resultChantierIds },
              territoire: { code: { in: territoireCodesLecture } },
            },
            include: {
              commentaires: {
                where: {
                  type: typeCommentaire,
                },
                orderBy: {
                  date: "desc",
                },
                take: 1,
              },
            },
          })
          .then(
            (resultMap) =>
              new Map<string, string | null>(
                resultMap.map((chantierCommentaire) => [
                  `${chantierCommentaire.id}-${chantierCommentaire.territoire_code}`,
                  chantierCommentaire.commentaires[0]?.contenu || null,
                ]),
              ),
          ),
      ),
      prisma.chantier_territoire
        .findMany({
          where: {
            id: { in: resultChantierIds },
            territoire: { code: { in: territoireCodesLecture } },
          },
          include: {
            syntheses_des_resultats: {
              orderBy: {
                date_commentaire: "desc",
              },
              take: 1,
            },
          },
        })
        .then(
          (resultMap) =>
            new Map<string, string | null>(
              resultMap.map((chantierCommentaire) => [
                `${chantierCommentaire.id}-${chantierCommentaire.territoire_code}`,
                chantierCommentaire.syntheses_des_resultats[0]?.commentaire ||
                  null,
              ]),
            ),
        ),
      prisma.chantier_territoire
        .findMany({
          where: {
            id: { in: resultChantierIds },
            territoire: { code: { in: territoireCodesLecture } },
          },
          include: {
            syntheses_des_resultats: {
              orderBy: {
                date_commentaire: "desc",
              },
              take: 1,
            },
          },
        })
        .then(
          (resultMap) =>
            new Map<string, string | null>(
              resultMap.map((chantierCommentaire) => [
                `${chantierCommentaire.id}-${chantierCommentaire.territoire_code}`,
                chantierCommentaire.syntheses_des_resultats[0]?.meteo || null,
              ]),
            ),
        ),
      ...listeTypesDecisionsStrategiques.map((typeDecisionStrategique) =>
        prisma.chantier_identite
          .findMany({
            where: {
              id: { in: resultChantierIds },
            },
            include: {
              decisions_strategiques: {
                where: {
                  type: typeDecisionStrategique,
                },
                orderBy: {
                  date: "desc",
                },
                take: 1,
              },
            },
          })
          .then(
            (resultMap) =>
              new Map<string, string | null>(
                resultMap.map((chantierCommentaire) => [
                  chantierCommentaire.id,
                  chantierCommentaire.decisions_strategiques[0]?.contenu ||
                    null,
                ]),
              ),
          ),
      ),
      ...listeTypesObjectifs.map((typeObjectif) =>
        prisma.chantier_identite
          .findMany({
            where: {
              id: { in: resultChantierIds },
            },
            include: {
              objectifs: {
                where: {
                  type: typeObjectif,
                },
                orderBy: {
                  date: "desc",
                },
                take: 1,
              },
            },
          })
          .then(
            (resultMap) =>
              new Map<string, string | null>(
                resultMap.map((chantierCommentaire) => [
                  chantierCommentaire.id,
                  chantierCommentaire.objectifs[0]?.contenu || null,
                ]),
              ),
          ),
      ),
    ]);

    return listePrismaChantierIdentite.flatMap((prismaChantierIdentite) => {
      return prismaChantierIdentite.chantier_territoire
        .filter((chantierTerritoire) =>
          territoireCodesLecture.includes(chantierTerritoire.territoire_code),
        )
        .map((prismaChantierTerritoire) => {
          let prismaChantierTerritoireReg = prismaChantierTerritoire;
          let prismaChantierTerritoireNat = prismaChantierTerritoire;

          if (prismaChantierTerritoire.maille === "DEPT") {
            prismaChantierTerritoireReg =
              prismaChantierIdentite.chantier_territoire.find(
                (chantierTerritoire) =>
                  chantierTerritoire.territoire_code ===
                  prismaChantierTerritoire.territoire.code_parent,
              )!;
            prismaChantierTerritoireNat =
              prismaChantierIdentite.chantier_territoire.find(
                (chantierTerritoire) =>
                  chantierTerritoire.territoire_code === "NAT-FR",
              )!;
          } else if (prismaChantierTerritoire.maille === "REG") {
            prismaChantierTerritoireNat =
              prismaChantierIdentite.chantier_territoire.find(
                (chantierTerritoire) =>
                  chantierTerritoire.territoire_code === "NAT-FR",
              )!;
          }

          return {
            nom: prismaChantierIdentite.nom,
            id: prismaChantierIdentite.id,
            maille: prismaChantierTerritoire.maille,
            ministèreNom: prismaChantierIdentite.ministeres_acronymes
              ? prismaChantierIdentite.ministeres_acronymes[0]
              : null,
            axe: prismaChantierIdentite.axe,
            territoireCode: prismaChantierTerritoire.territoire_code,
            tauxDAvancementAnnuel:
              prismaChantierTerritoire.chantier_territoire_jalon.at(0)
                ?.taux_avancement || null,
            tauxDAvancementNational:
              prismaChantierTerritoireNat.taux_avancement_mandat,
            tauxDAvancementRégional:
              prismaChantierTerritoire.maille === "REG" ||
              prismaChantierTerritoire.maille === "DEPT"
                ? prismaChantierTerritoireReg.taux_avancement_mandat
                : null,
            tauxDAvancementDépartemental:
              prismaChantierTerritoire.maille === "DEPT"
                ? prismaChantierTerritoire.taux_avancement_mandat
                : null,
            météo:
              ((mapMeteo.get(
                `${prismaChantierTerritoire.id}-${prismaChantierTerritoire.territoire_code}`,
              ) || null) as Météo) || null,
            directeursProjet: prismaChantierIdentite.directeurs_projet,
            directeursProjetMails:
              prismaChantierIdentite.directeurs_projet_mails,
            responsablesLocaux: prismaChantierTerritoire.responsables_locaux,
            responsablesLocauxMails:
              prismaChantierTerritoire.responsables_locaux_mails,
            statut: prismaChantierIdentite.statut,
            estBaromètre: !!prismaChantierIdentite.est_barometre,
            estTerritorialisé: !!prismaChantierIdentite.est_territorialise,
            commActionsÀVenir:
              mapActionsAVenir.get(
                `${prismaChantierTerritoire.id}-${prismaChantierTerritoire.territoire_code}`,
              ) || null,
            commActionsÀValoriser:
              mapActionsAValoriser.get(
                `${prismaChantierTerritoire.id}-${prismaChantierTerritoire.territoire_code}`,
              ) || null,
            commFreinsÀLever:
              mapFreinsALever.get(
                `${prismaChantierTerritoire.id}-${prismaChantierTerritoire.territoire_code}`,
              ) || null,
            commCommentairesSurLesDonnées:
              mapCommentairesSurLesDonnees.get(
                `${prismaChantierTerritoire.id}-${prismaChantierTerritoire.territoire_code}`,
              ) || null,
            commAutresRésultats:
              mapAutresResultatsObtenus.get(
                `${prismaChantierTerritoire.id}-${prismaChantierTerritoire.territoire_code}`,
              ) || null,
            commAutresRésultatsNonCorrélésAuxIndicateurs:
              mapAutresResultatsObtenusNonCorrelesAuxIndicateurs.get(
                `${prismaChantierTerritoire.id}-${prismaChantierTerritoire.territoire_code}`,
              ) || null,
            decStratSuiviDesDécisions:
              prismaChantierTerritoire.maille === "NAT"
                ? mapDecisionsStrategiques.get(prismaChantierIdentite.id) ||
                  null
                : null,
            objNotreAmbition:
              prismaChantierTerritoire.maille === "NAT"
                ? mapNotreAmbition.get(prismaChantierIdentite.id) || null
                : null,
            objDéjàFait:
              prismaChantierTerritoire.maille === "NAT"
                ? mapDejaFait.get(prismaChantierIdentite.id) || null
                : null,
            objÀFaire:
              prismaChantierTerritoire.maille === "NAT"
                ? mapAFaire.get(prismaChantierIdentite.id) || null
                : null,
            synthèseDesRésultats:
              mapSynthesesDesResultats.get(
                `${prismaChantierTerritoire.id}-${prismaChantierTerritoire.territoire_code}`,
              ) || null,
          } satisfies DonneeChantier;
        })
        .sort((chantierA, chantierB) => {
          const orderMaille = { NAT: 1, REG: 2, DEPT: 3 };

          // Comparer par nom
          if (chantierB.nom !== chantierA.nom) {
            return chantierB.nom.localeCompare(chantierA.nom);
          }

          // Comparer par maille
          if (chantierA.maille !== chantierB.maille) {
            return (
              orderMaille[chantierA.maille] - orderMaille[chantierB.maille]
            );
          }

          // Comparer par code insee
          if (chantierB.territoireCode !== chantierA.territoireCode) {
            return chantierB.territoireCode.localeCompare(
              chantierA.territoireCode,
            );
          }
          // Comparer par ministere
          if (chantierB.ministèreNom === null) {
            return 1;
          }
          if (chantierA.ministèreNom === null) {
            return -1;
          }
          return chantierB.ministèreNom.localeCompare(chantierA.ministèreNom);
        });
    });
  }

  async recupererLesEntreesDUnChantier(
    id: string,
    habilitations: Habilitations,
    profil: ProfilCode,
    jalon: number,
  ): Promise<PrismaChantier> {
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

  async recupererPourExports(
    chantierIdsLecture: string,
    territoireCodesLecture: string[],
    optionsExport: OptionsExport,
    jalon: number,
  ): Promise<ChantierPourExport[] | null> {
    const prismaChantierIdentite = await prisma.chantier_identite.findUnique({
      where: {
        id: chantierIdsLecture,
        NOT: [
          {
            ministeres: { isEmpty: true },
          },
        ],
      },
      include: {
        chantier_territoire: {
          where: {
            est_applicable: true,
          },
          include: {
            territoire: true,
            chantier_territoire_jalon: {
              where: {
                jalon,
              },
            },
          },
        },
      },
    });

    if (!prismaChantierIdentite) {
      return null;
    }

    const listeTypesCommentaires = [
      "actions_a_venir",
      "actions_a_valoriser",
      "freins_a_lever",
      "commentaires_sur_les_donnees",
      "autres_resultats_obtenus",
      "autres_resultats_obtenus_non_correles_aux_indicateurs",
    ];
    const listeTypesDecisionsStrategiques = ["suivi_des_decisions"] as const;

    const listeTypesObjectifs = [
      "notre_ambition",
      "deja_fait",
      "a_faire",
    ] as type_objectif[];

    const [
      mapActionsAVenir,
      mapActionsAValoriser,
      mapFreinsALever,
      mapCommentairesSurLesDonnees,
      mapAutresResultatsObtenus,
      mapAutresResultatsObtenusNonCorrelesAuxIndicateurs,
    ] = optionsExport.listeOptionsExport.includes("commentaire")
      ? await Promise.all(
          listeTypesCommentaires.map((typeCommentaire) =>
            prisma.chantier_territoire
              .findMany({
                where: {
                  id: chantierIdsLecture,
                  territoire: { code: { in: territoireCodesLecture } },
                },
                include: {
                  commentaires: {
                    where: {
                      type: typeCommentaire,
                    },
                    orderBy: {
                      date: "desc",
                    },
                    take: 1,
                  },
                },
              })
              .then(
                (resultMap) =>
                  new Map<string, string | null>(
                    resultMap.map((chantierCommentaire) => [
                      `${chantierCommentaire.id}-${chantierCommentaire.territoire_code}`,
                      chantierCommentaire.commentaires[0]?.contenu || null,
                    ]),
                  ),
              ),
          ),
        )
      : [];

    const [mapSynthesesDesResultats] =
      optionsExport.listeOptionsExport.includes("synthese")
        ? await Promise.all([
            prisma.chantier_territoire
              .findMany({
                where: {
                  id: chantierIdsLecture,
                  territoire: { code: { in: territoireCodesLecture } },
                },
                include: {
                  syntheses_des_resultats: {
                    orderBy: {
                      date_commentaire: "desc",
                    },
                    take: 1,
                  },
                },
              })
              .then(
                (resultMap) =>
                  new Map<string, string | null>(
                    resultMap.map((chantierCommentaire) => [
                      `${chantierCommentaire.id}-${chantierCommentaire.territoire_code}`,
                      chantierCommentaire.syntheses_des_resultats[0]
                        ?.commentaire || null,
                    ]),
                  ),
              ),
          ])
        : [];

    const [mapDecisionsStrategiques] =
      optionsExport.listeOptionsExport.includes("decision")
        ? await Promise.all([
            ...listeTypesDecisionsStrategiques.map((typeDecisionStrategique) =>
              prisma.chantier_identite
                .findMany({
                  where: {
                    id: chantierIdsLecture,
                  },
                  include: {
                    decisions_strategiques: {
                      where: {
                        type: typeDecisionStrategique,
                      },
                      orderBy: {
                        date: "desc",
                      },
                      take: 1,
                    },
                  },
                })
                .then(
                  (resultMap) =>
                    new Map<string, string | null>(
                      resultMap.map((chantierCommentaire) => [
                        chantierCommentaire.id,
                        chantierCommentaire.decisions_strategiques[0]
                          ?.contenu || null,
                      ]),
                    ),
                ),
            ),
            ...listeTypesObjectifs.map((typeObjectif) =>
              prisma.chantier_identite
                .findMany({
                  where: {
                    id: chantierIdsLecture,
                  },
                  include: {
                    objectifs: {
                      where: {
                        type: typeObjectif,
                      },
                      orderBy: {
                        date: "desc",
                      },
                      take: 1,
                    },
                  },
                })
                .then(
                  (resultMap) =>
                    new Map<string, string | null>(
                      resultMap.map((chantierCommentaire) => [
                        chantierCommentaire.id,
                        chantierCommentaire.objectifs[0]?.contenu || null,
                      ]),
                    ),
                ),
            ),
          ])
        : [];

    const [mapNotreAmbition, mapDejaFait, mapAFaire] =
      optionsExport.listeOptionsExport.includes("objectif")
        ? await Promise.all([
            ...listeTypesDecisionsStrategiques.map((typeDecisionStrategique) =>
              prisma.chantier_identite
                .findMany({
                  where: {
                    id: chantierIdsLecture,
                  },
                  include: {
                    decisions_strategiques: {
                      where: {
                        type: typeDecisionStrategique,
                      },
                      orderBy: {
                        date: "desc",
                      },
                      take: 1,
                    },
                  },
                })
                .then(
                  (resultMap) =>
                    new Map<string, string | null>(
                      resultMap.map((chantierCommentaire) => [
                        chantierCommentaire.id,
                        chantierCommentaire.decisions_strategiques[0]
                          ?.contenu || null,
                      ]),
                    ),
                ),
            ),
            ...listeTypesObjectifs.map((typeObjectif) =>
              prisma.chantier_identite
                .findMany({
                  where: {
                    id: chantierIdsLecture,
                  },
                  include: {
                    objectifs: {
                      where: {
                        type: typeObjectif,
                      },
                      orderBy: {
                        date: "desc",
                      },
                      take: 1,
                    },
                  },
                })
                .then(
                  (resultMap) =>
                    new Map<string, string | null>(
                      resultMap.map((chantierCommentaire) => [
                        chantierCommentaire.id,
                        chantierCommentaire.objectifs[0]?.contenu || null,
                      ]),
                    ),
                ),
            ),
          ])
        : [];

    return prismaChantierIdentite.chantier_territoire
      .reduce((acc, prismaChantierTerritoire) => {
        if (
          territoireCodesLecture.includes(
            prismaChantierTerritoire.territoire_code,
          ) &&
          (optionsExport.listeMeteos.length > 0
            ? optionsExport.listeMeteos.includes(
                prismaChantierTerritoire.meteo || "",
              )
            : true)
        ) {
          let prismaChantierTerritoireReg = prismaChantierTerritoire;
          let prismaChantierTerritoireNat = prismaChantierTerritoire;

          if (prismaChantierTerritoire.maille === "DEPT") {
            prismaChantierTerritoireReg =
              prismaChantierIdentite.chantier_territoire.find(
                (chantierTerritoire) =>
                  chantierTerritoire.territoire_code ===
                  prismaChantierTerritoire.territoire.code_parent,
              )!;
            prismaChantierTerritoireNat =
              prismaChantierIdentite.chantier_territoire.find(
                (chantierTerritoire) =>
                  chantierTerritoire.territoire_code === "NAT-FR",
              )!;
          } else if (prismaChantierTerritoire.maille === "REG") {
            prismaChantierTerritoireNat =
              prismaChantierIdentite.chantier_territoire.find(
                (chantierTerritoire) =>
                  chantierTerritoire.territoire_code === "NAT-FR",
              )!;
          }

          let aUnePropositionsValeurAvancement = false;
          const maille = prismaChantierTerritoire.maille;

          const prismaNombrePropositionValeurActuelle =
            prismaChantierTerritoire.nombre_propositions_valeur_actuelle;

          if (maille === "DEPT") {
            aUnePropositionsValeurAvancement =
              prismaNombrePropositionValeurActuelle > 0;
          } else if (maille === "REG") {
            const codeRegion = prismaChantierTerritoire.territoire_code;
            aUnePropositionsValeurAvancement =
              prismaNombrePropositionValeurActuelle > 0 ||
              prismaChantierIdentite.chantier_territoire
                .filter(
                  (chantierTerritoire) =>
                    chantierTerritoire.territoire.code_parent === codeRegion,
                )
                .some(
                  (chantierTerritoire) =>
                    chantierTerritoire.nombre_propositions_valeur_actuelle > 0,
                );
          } else {
            aUnePropositionsValeurAvancement =
              prismaChantierIdentite.chantier_territoire.some(
                (chantierTerritoire) =>
                  chantierTerritoire.nombre_propositions_valeur_actuelle > 0,
              );
          }

          const chantiersTerritoiresMailleDepartementale =
            prismaChantierIdentite.chantier_territoire.filter(
              (chantierTerritoire) =>
                chantierTerritoire.maille === "DEPT" &&
                chantierTerritoire.est_applicable,
            );
          return [
            ...acc,
            {
              nom: prismaChantierIdentite.nom,
              id: prismaChantierIdentite.id,
              maille: prismaChantierTerritoire.maille,
              régionNom:
                prismaChantierTerritoire.maille === "REG" ||
                prismaChantierTerritoire.maille === "DEPT"
                  ? prismaChantierTerritoireReg.territoire.nom
                  : null,
              départementNom:
                prismaChantierTerritoire.maille === "DEPT"
                  ? prismaChantierTerritoire.territoire.nom
                  : null,
              codeInsee: prismaChantierTerritoire.code_insee,
              ministèreNom: prismaChantierIdentite.ministeres_acronymes
                ? prismaChantierIdentite.ministeres_acronymes[0]
                : null,
              axe: prismaChantierIdentite.axe,
              tauxDAvancementAnnuel: verifyValeurIsNotNullOrUndefined(
                prismaChantierTerritoire.chantier_territoire_jalon.at(0)
                  ?.taux_avancement,
              ),
              tauxDAvancementNational: verifyValeurIsNotNullOrUndefined(
                prismaChantierTerritoireNat.taux_avancement_mandat,
              ),
              tauxDAvancementRégional:
                prismaChantierTerritoire.maille === "REG" ||
                prismaChantierTerritoire.maille === "DEPT"
                  ? verifyValeurIsNotNullOrUndefined(
                      prismaChantierTerritoireReg.taux_avancement_mandat,
                    )
                  : null,
              tauxDAvancementDépartemental:
                prismaChantierTerritoire.maille === "DEPT"
                  ? verifyValeurIsNotNullOrUndefined(
                      prismaChantierTerritoire.taux_avancement_mandat,
                    )
                  : null,
              périmètreIds: prismaChantierIdentite.perimetre_ids,
              météo: (prismaChantierTerritoire.meteo as Météo) || null,
              directeursProjet: prismaChantierIdentite.directeurs_projet,
              directeursProjetMails:
                prismaChantierIdentite.directeurs_projet_mails,
              responsablesLocaux: prismaChantierTerritoire.responsables_locaux,
              responsablesLocauxMails:
                prismaChantierTerritoire.responsables_locaux_mails,
              coordinateursTerritoriaux:
                prismaChantierTerritoire.coordinateurs_territoriaux,
              coordinateursTerritoriauxMails:
                prismaChantierTerritoire.coordinateurs_territoriaux_mails,
              statut: prismaChantierIdentite.statut,
              estBaromètre: prismaChantierIdentite.est_barometre,
              estTerritorialisé: prismaChantierIdentite.est_territorialise,
              commActionsÀVenir:
                mapActionsAVenir?.get(
                  `${prismaChantierTerritoire.id}-${prismaChantierTerritoire.territoire_code}`,
                ) || null,
              commActionsÀValoriser:
                mapActionsAValoriser?.get(
                  `${prismaChantierTerritoire.id}-${prismaChantierTerritoire.territoire_code}`,
                ) || null,
              commFreinsÀLever:
                mapFreinsALever?.get(
                  `${prismaChantierTerritoire.id}-${prismaChantierTerritoire.territoire_code}`,
                ) || null,
              commCommentairesSurLesDonnées:
                mapCommentairesSurLesDonnees?.get(
                  `${prismaChantierTerritoire.id}-${prismaChantierTerritoire.territoire_code}`,
                ) || null,
              commAutresRésultats:
                mapAutresResultatsObtenus?.get(
                  `${prismaChantierTerritoire.id}-${prismaChantierTerritoire.territoire_code}`,
                ) || null,
              commAutresRésultatsNonCorrélésAuxIndicateurs:
                mapAutresResultatsObtenusNonCorrelesAuxIndicateurs?.get(
                  `${prismaChantierTerritoire.id}-${prismaChantierTerritoire.territoire_code}`,
                ) || null,
              decStratSuiviDesDécisions:
                prismaChantierTerritoire.maille === "NAT"
                  ? mapDecisionsStrategiques?.get(prismaChantierIdentite.id) ||
                    null
                  : null,
              objNotreAmbition:
                prismaChantierTerritoire.maille === "NAT"
                  ? mapNotreAmbition?.get(prismaChantierIdentite.id) || null
                  : null,
              objDéjàFait:
                prismaChantierTerritoire.maille === "NAT"
                  ? mapDejaFait?.get(prismaChantierIdentite.id) || null
                  : null,
              objÀFaire:
                prismaChantierTerritoire.maille === "NAT"
                  ? mapAFaire?.get(prismaChantierIdentite.id) || null
                  : null,
              synthèseDesRésultats:
                mapSynthesesDesResultats?.get(
                  `${prismaChantierTerritoire.id}-${prismaChantierTerritoire.territoire_code}`,
                ) || null,
              ecart: prismaChantierTerritoire.ecart,
              tendance: prismaChantierTerritoire.tendance,
              cibleAttendu: prismaChantierIdentite.cible_attendue,
              avancementTerritoire:
                prismaChantierTerritoire.taux_avancement_mandat,
              aUnePropositionsValeurAvancement:
                aUnePropositionsValeurAvancement,
              aUnTauxAvancementDepartemental:
                chantiersTerritoiresMailleDepartementale.length === 0 ||
                chantiersTerritoiresMailleDepartementale.some(
                  (chantierTerritoire) =>
                    chantierTerritoire.taux_avancement_mandat !== null,
                ),
            },
          ];
        }
        return acc;
      }, [] as ChantierPourExport[])
      .sort((chantierA, chantierB) => {
        const orderMaille = { NAT: 1, REG: 2, DEPT: 3 };

        // Comparer par nom
        if (chantierB.nom && chantierA.nom && chantierB.nom !== chantierA.nom) {
          return chantierB.nom.localeCompare(chantierA.nom);
        }

        // Comparer par maille
        if (
          chantierA.maille &&
          chantierB.maille &&
          chantierA.maille !== chantierB.maille
        ) {
          return (
            orderMaille[chantierA.maille as keyof typeof orderMaille] -
            orderMaille[chantierB.maille as keyof typeof orderMaille]
          );
        }

        // Comparer par nom_region
        const nomRegionCA =
          chantierB.maille === "DEPT"
            ? chantierB.régionNom || null
            : chantierB.maille === "REG"
              ? chantierB.départementNom
              : null;
        const nomRegionB =
          chantierA.maille === "DEPT"
            ? chantierA.régionNom || null
            : chantierA.maille === "REG"
              ? chantierA.départementNom
              : null;

        if (nomRegionCA && nomRegionB && nomRegionCA !== nomRegionB) {
          return nomRegionCA.localeCompare(nomRegionB);
        }

        // Comparer par code insee
        if (
          chantierB.codeInsee &&
          chantierA.codeInsee &&
          chantierB.codeInsee !== chantierA.codeInsee
        ) {
          return chantierB.codeInsee.localeCompare(chantierA.codeInsee);
        }
        // Comparer par ministere
        if (chantierB.ministèreNom === null) {
          return 1;
        }
        if (chantierA.ministèreNom === null) {
          return -1;
        }
        return chantierB.ministèreNom.localeCompare(chantierA.ministèreNom);
      });
  }

  async récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions(
    chantierIds: string[],
    optionsExport: OptionsExport,
  ): Promise<string[]> {
    const listeChantierId =
      optionsExport.listeChantierId.length > 0
        ? chantierIds.filter((value) =>
            optionsExport.listeChantierId.includes(value),
          )
        : chantierIds;
    const whereOptions: Prisma.chantier_identiteWhereInput = {};

    if (optionsExport.estBarometre) {
      whereOptions.est_barometre = true;
    }

    if (optionsExport.listeStatuts && optionsExport.listeStatuts.length > 0) {
      whereOptions.statut = {
        in: optionsExport.listeStatuts as type_statut[],
      };
    }

    if (optionsExport.perimetreIds && optionsExport.perimetreIds.length > 0) {
      whereOptions.perimetre_ids = {
        hasSome: optionsExport.perimetreIds,
      };
    }

    if (optionsExport.territorialisation?.length > 0) {
      // Mise en place du bon where en fonction de la territorialisation choisie
      if (optionsExport.territorialisation?.length === 1) {
        if (optionsExport.territorialisation[0] === "nationale") {
          whereOptions.mailles_applicables = {
            equals: ["NAT"],
          };
        } else if (optionsExport.territorialisation[0] === "regionale") {
          whereOptions.NOT = {
            mailles_applicables: {
              has: "DEPT",
            },
          };
          whereOptions.est_territorialise = true;
        } else if (optionsExport.territorialisation[0] === "departementale") {
          whereOptions.mailles_applicables = {
            has: "DEPT",
          };
          whereOptions.est_territorialise = true;
        }
      } else if (optionsExport.territorialisation?.length === 2) {
        if (
          optionsExport.territorialisation.includes("nationale") &&
          optionsExport.territorialisation.includes("regionale")
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
          optionsExport.territorialisation.includes("regionale") &&
          optionsExport.territorialisation.includes("departementale")
        ) {
          whereOptions.est_territorialise = true;
        } else if (
          optionsExport.territorialisation.includes("nationale") &&
          optionsExport.territorialisation.includes("departementale")
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

    const chantiers = await prisma.chantier_identite.findMany({
      distinct: ["id"],
      where: {
        id: { in: listeChantierId },
        ...whereOptions,
      },
      orderBy: [{ nom: "asc" }],
      select: {
        id: true,
      },
    });

    return chantiers.map((chantier) => chantier.id);
  }

  async recupererPropositionValeurAvancementChantierInformationParIndicId({
    indicId,
  }: {
    indicId: string;
  }): Promise<PropositionValeurAvancementChantierInformation> {
    const propositionValeurAvancementChantierInformation =
      await prisma.indicateur_identite.findUnique({
        where: {
          id: indicId,
        },
        select: {
          chantier_identite: {
            select: {
              id: true,
              nom: true,
              statut: true,
              conseiller_mail: true,
            },
          },
        },
      });

    if (!propositionValeurAvancementChantierInformation) {
      throw new NotFoundError("L'indicateur n'existe pas");
    }

    return {
      id: propositionValeurAvancementChantierInformation.chantier_identite.id,
      nom: propositionValeurAvancementChantierInformation.chantier_identite.nom,
      statut:
        propositionValeurAvancementChantierInformation.chantier_identite.statut,
      conseillerMail:
        propositionValeurAvancementChantierInformation.chantier_identite
          .conseiller_mail ?? "",
    };
  }

  async recupererListePropositionValeurAvancementChantierInformationParChantiersIds({
    listeChantiersIds,
  }: {
    listeChantiersIds: string[];
  }): Promise<PropositionValeurAvancementChantierInformation[]> {
    const listeChantiersInformations = await prisma.chantier_identite.findMany({
      where: {
        id: {
          in: listeChantiersIds,
        },
      },
      select: {
        id: true,
        nom: true,
        statut: true,
        conseiller_mail: true,
      },
    });

    return listeChantiersInformations.map((chantierInformation) => ({
      id: chantierInformation.id,
      nom: chantierInformation.nom,
      statut: chantierInformation.statut,
      conseillerMail: chantierInformation.conseiller_mail ?? "",
    }));
  }

  async récupérerLesEntréesDeTousLesChantiersHabilitésNew(
    chantiersLectureIds: string[],
    territoiresLectureIds: string[],
    profil: ProfilCode,
    filtres: FiltreQueryParams,
    territoireCode: string,
    jalon: number,
  ): Promise<PrismaChantier[]> {
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

    if (filtres.estBarometre) {
      whereOptions.est_barometre = true;
    }

    let chantierIds = chantiersLectureIds;

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

    if (filtres.meteos?.length > 0) {
      chantierIds = await prisma.chantier_territoire
        .findMany({
          where: {
            id: { in: chantierIds },
            meteo: {
              in: filtres.meteos as Météo[],
            },
            territoire_code: territoireCode,
          },
        })
        .then((chantiersMatched) =>
          chantiersMatched
            .map((chantierMatched) => chantierMatched.id)
            .filter((chantierId) => chantierIds.includes(chantierId)),
        );
    }

    return prisma.chantier_identite.findMany({
      where: {
        NOT: {
          ministeres: {
            isEmpty: true,
          },
        },
        id: { in: chantierIds },
        ...whereOptions,
      },
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
        nom: true,
        axe: true,
        ppg: true,
        perimetre_ids: true,
        ate: true,
        ministeres: true,
        statut: true,
        cible_attendue: true,
        est_barometre: true,
        est_territorialise: true,
        possede_taux_avancement_departemental: true,
        possede_taux_avancement_regional: true,
        possede_meteo_departemental: true,
        possede_meteo_regional: true,
        directeurs_administration_centrale: true,
        directions_administration_centrale: true,
        directeurs_projet: true,
        directeurs_projet_mails: true,
        mailles_applicables: true,
        chantier_territoire: {
          where: {
            territoire_code: {
              in: profilsTerritoriaux.includes(profil)
                ? undefined
                : [...territoiresLectureIds, "NAT-FR"],
            },
            est_applicable: true,
          },
          select: {
            territoire_code: true,
            id: true,
            code_insee: true,
            maille: true,
            ecart: true,
            donnees_maille_source: true,
            taux_avancement_mandat_valeur_precedente: true,
            meteo: true,
            tendance: true,
            derniere_maj_date_qualitative: true,
            date_taux_avancement_mandat: true,
            est_applicable: true,
            responsables_locaux: true,
            responsables_locaux_mails: true,
            coordinateurs_territoriaux: true,
            coordinateurs_territoriaux_mails: true,
            taux_avancement_mandat: true,
            nombre_propositions_valeur_actuelle: true,
            nombre_propositions_valeur_actuelle_ponderee: true,
            date_taux_avancement_mandat_valeur_precedente: true,
            chantier_territoire_jalon: {
              select: {
                taux_avancement: true,
                date_taux_avancement: true,
              },
              where: {
                jalon,
              },
            },
          },
        },
      },
    });
  }
}
