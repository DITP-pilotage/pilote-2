import { Prisma, type_objectif, type_statut } from '@prisma/client';
import { ChantierRepository } from '@/server/chantiers/domain/ports/ChantierRepository';
import { DonneeChantier } from '@/server/chantiers/domain/DonneeChantier';
import { prisma } from '@/server/db/prisma';
import { Météo } from '@/server/domain/météo/Météo.interface';
import { OptionsExport } from '@/server/usecase/chantier/OptionsExport';
import { verifyValeurIsNotNullOrUndefined } from '@/server/utils/VerifyValeurIsNotNullOrUndefined';
import { ChantierPourExport } from '@/server/chantiers/domain/ChantierPourExport';

export class PrismaChantierRepository implements ChantierRepository {
  async récupérerDonneesChantier(chantierId: string, territoireCodesLecture: string[]): Promise<DonneeChantier[]> {
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
      distinct: ['id'],
    });

    const listePrismaChantierIdentite = await prisma.chantier_identite.findMany({
      where: {
        id: { in: chantierIds.map(chantier => chantier.id) },
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
      orderBy: { id: 'asc' },
    });

    const resultChantierIds = listePrismaChantierIdentite.map(chantier => chantier.id);

    const listeTypesCommentaires = [
      'actions_a_venir',
      'actions_a_valoriser',
      'freins_a_lever',
      'commentaires_sur_les_donnees',
      'autres_resultats_obtenus',
      'autres_resultats_obtenus_non_correles_aux_indicateurs',
    ];
    const listeTypesDecisionsStrategiques = [
      'suivi_des_decisions',
    ] as const;

    const listeTypesObjectifs = [
      'notre_ambition',
      'deja_fait',
      'a_faire',
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
      ...listeTypesCommentaires.map((typeCommentaire) => prisma.chantier_territoire.findMany({
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
              date: 'desc',
            },
            take: 1,
          },
        },
      }).then(resultMap => new Map<string, string | null>(
        resultMap.map(chantierCommentaire => [`${chantierCommentaire.id}-${chantierCommentaire.territoire_code}`, chantierCommentaire.commentaires[0]?.contenu || null]),
      ),
      )),
      prisma.chantier_territoire.findMany({
        where: {
          id: { in: resultChantierIds },
          territoire: { code: { in: territoireCodesLecture } },
        },
        include: {
          syntheses_des_resultats: {
            orderBy: {
              date_commentaire: 'desc',
            },
            take: 1,
          },
        },
      }).then(resultMap => new Map<string, string | null>(
        resultMap.map(chantierCommentaire => [`${chantierCommentaire.id}-${chantierCommentaire.territoire_code}`, chantierCommentaire.syntheses_des_resultats[0]?.commentaire || null]),
      )),
      prisma.chantier_territoire.findMany({
        where: {
          id: { in: resultChantierIds },
          territoire: { code: { in: territoireCodesLecture } },
        },
        include: {
          syntheses_des_resultats: {
            orderBy: {
              date_commentaire: 'desc',
            },
            take: 1,
          },
        },
      }).then(resultMap => new Map<string, string | null>(
        resultMap.map(chantierCommentaire => [`${chantierCommentaire.id}-${chantierCommentaire.territoire_code}`, chantierCommentaire.syntheses_des_resultats[0]?.meteo || null]),
      )),
      ...listeTypesDecisionsStrategiques.map((typeDecisionStrategique) => prisma.chantier_identite.findMany({
        where: {
          id: { in: resultChantierIds },
        },
        include: {
          decisions_strategiques: {
            where: {
              type: typeDecisionStrategique,
            },
            orderBy: {
              date: 'desc',
            },
            take: 1,
          },
        },
      }).then(resultMap => new Map<string, string | null>(
        resultMap.map(chantierCommentaire => [chantierCommentaire.id, chantierCommentaire.decisions_strategiques[0]?.contenu || null]),
      ))),
      ...listeTypesObjectifs.map((typeObjectif) => prisma.chantier_identite.findMany({
        where: {
          id: { in: resultChantierIds },
        },
        include: {
          objectifs: {
            where: {
              type: typeObjectif,
            },
            orderBy: {
              date: 'desc',
            },
            take: 1,
          },
        },
      }).then(resultMap => new Map<string, string | null>(
        resultMap.map(chantierCommentaire => [chantierCommentaire.id, chantierCommentaire.objectifs[0]?.contenu || null]),
      ))),
    ]);


    return listePrismaChantierIdentite.flatMap(prismaChantierIdentite => {
      return prismaChantierIdentite.chantier_territoire
        .filter(chantierTerritoire => territoireCodesLecture.includes(chantierTerritoire.territoire_code))
        .map(prismaChantierTerritoire => {
          let prismaChantierTerritoireReg = prismaChantierTerritoire;
          let prismaChantierTerritoireNat = prismaChantierTerritoire;

          if (prismaChantierTerritoire.maille === 'DEPT') {
            prismaChantierTerritoireReg = prismaChantierIdentite.chantier_territoire.find(chantierTerritoire => chantierTerritoire.territoire_code === prismaChantierTerritoire.territoire.code_parent)!;
            prismaChantierTerritoireNat = prismaChantierIdentite.chantier_territoire.find(chantierTerritoire => chantierTerritoire.territoire_code === 'NAT-FR')!;
          } else if (prismaChantierTerritoire.maille === 'REG') {
            prismaChantierTerritoireNat = prismaChantierIdentite.chantier_territoire.find(chantierTerritoire => chantierTerritoire.territoire_code === 'NAT-FR')!;
          }


          return {
            nom: prismaChantierIdentite.nom,
            id: prismaChantierIdentite.id,
            maille: prismaChantierTerritoire.maille,
            ministèreNom: prismaChantierIdentite.ministeres_acronymes ? prismaChantierIdentite.ministeres_acronymes[0] : null,
            axe: prismaChantierIdentite.axe,
            territoireCode: prismaChantierTerritoire.territoire_code,
            tauxDAvancementAnnuel: prismaChantierTerritoire.chantier_territoire_jalon.at(0)?.taux_avancement || null,
            tauxDAvancementNational: prismaChantierTerritoireNat.taux_avancement_mandat,
            tauxDAvancementRégional: prismaChantierTerritoire.maille === 'REG' || prismaChantierTerritoire.maille === 'DEPT' ? prismaChantierTerritoireReg.taux_avancement_mandat : null,
            tauxDAvancementDépartemental: prismaChantierTerritoire.maille === 'DEPT' ? prismaChantierTerritoire.taux_avancement_mandat : null,
            météo: (mapMeteo.get(`${prismaChantierTerritoire.id}-${prismaChantierTerritoire.territoire_code}`) || null) as Météo || null,
            directeursProjet: prismaChantierIdentite.directeurs_projet,
            directeursProjetMails: prismaChantierIdentite.directeurs_projet_mails,
            responsablesLocaux: prismaChantierTerritoire.responsables_locaux,
            responsablesLocauxMails: prismaChantierTerritoire.responsables_locaux_mails,
            statut: prismaChantierIdentite.statut,
            estBaromètre: !!prismaChantierIdentite.est_barometre,
            estTerritorialisé: !!prismaChantierIdentite.est_territorialise,
            commActionsÀVenir: mapActionsAVenir.get(`${prismaChantierTerritoire.id}-${prismaChantierTerritoire.territoire_code}`) || null,
            commActionsÀValoriser: mapActionsAValoriser.get(`${prismaChantierTerritoire.id}-${prismaChantierTerritoire.territoire_code}`) || null,
            commFreinsÀLever: mapFreinsALever.get(`${prismaChantierTerritoire.id}-${prismaChantierTerritoire.territoire_code}`) || null,
            commCommentairesSurLesDonnées: mapCommentairesSurLesDonnees.get(`${prismaChantierTerritoire.id}-${prismaChantierTerritoire.territoire_code}`) || null,
            commAutresRésultats: mapAutresResultatsObtenus.get(`${prismaChantierTerritoire.id}-${prismaChantierTerritoire.territoire_code}`) || null,
            commAutresRésultatsNonCorrélésAuxIndicateurs: mapAutresResultatsObtenusNonCorrelesAuxIndicateurs.get(`${prismaChantierTerritoire.id}-${prismaChantierTerritoire.territoire_code}`) || null,
            decStratSuiviDesDécisions: prismaChantierTerritoire.maille === 'NAT' ? mapDecisionsStrategiques.get(prismaChantierIdentite.id) || null : null,
            objNotreAmbition: prismaChantierTerritoire.maille === 'NAT' ? mapNotreAmbition.get(prismaChantierIdentite.id) || null : null,
            objDéjàFait: prismaChantierTerritoire.maille === 'NAT' ? mapDejaFait.get(prismaChantierIdentite.id) || null : null,
            objÀFaire: prismaChantierTerritoire.maille === 'NAT' ? mapAFaire.get(prismaChantierIdentite.id) || null : null,
            synthèseDesRésultats: mapSynthesesDesResultats.get(`${prismaChantierTerritoire.id}-${prismaChantierTerritoire.territoire_code}`) || null,
          } satisfies DonneeChantier;
        })
        .sort((chantierA, chantierB) => {
          const orderMaille = { 'NAT': 1, 'REG': 2, 'DEPT': 3 };

          // Comparer par nom
          if (chantierB.nom !== chantierA.nom) {
            return chantierB.nom.localeCompare(chantierA.nom);
          }

          // Comparer par maille
          if (chantierA.maille !== chantierB.maille) {
            return orderMaille[chantierA.maille] - orderMaille[chantierB.maille];
          }

          // Comparer par code insee
          if (chantierB.territoireCode !== chantierA.territoireCode) {
            return chantierB.territoireCode.localeCompare(chantierA.territoireCode);
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

  async récupérerPourExports(chantierIdsLecture: string, territoireCodesLecture: string[], optionsExport: OptionsExport, jalon: number): Promise<ChantierPourExport[] | null> {
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
      'actions_a_venir',
      'actions_a_valoriser',
      'freins_a_lever',
      'commentaires_sur_les_donnees',
      'autres_resultats_obtenus',
      'autres_resultats_obtenus_non_correles_aux_indicateurs',
    ];
    const listeTypesDecisionsStrategiques = [
      'suivi_des_decisions',
    ] as const;

    const listeTypesObjectifs = [
      'notre_ambition',
      'deja_fait',
      'a_faire',
    ] as type_objectif[];

    const [
      mapActionsAVenir,
      mapActionsAValoriser,
      mapFreinsALever,
      mapCommentairesSurLesDonnees,
      mapAutresResultatsObtenus,
      mapAutresResultatsObtenusNonCorrelesAuxIndicateurs,
      mapSynthesesDesResultats,
      mapDecisionsStrategiques,
      mapNotreAmbition,
      mapDejaFait,
      mapAFaire,
    ] = await Promise.all([
      ...listeTypesCommentaires.map((typeCommentaire) => prisma.chantier_territoire.findMany({
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
              date: 'desc',
            },
            take: 1,
          },
        },
      }).then(resultMap => new Map<string, string | null>(
        resultMap.map(chantierCommentaire => [`${chantierCommentaire.id}-${chantierCommentaire.territoire_code}`, chantierCommentaire.commentaires[0]?.contenu || null]),
      ),
      )),
      prisma.chantier_territoire.findMany({
        where: {
          id: chantierIdsLecture,
          territoire: { code: { in: territoireCodesLecture } },
        },
        include: {
          syntheses_des_resultats: {
            orderBy: {
              date_commentaire: 'desc',
            },
            take: 1,
          },
        },
      }).then(resultMap => new Map<string, string | null>(
        resultMap.map(chantierCommentaire => [`${chantierCommentaire.id}-${chantierCommentaire.territoire_code}`, chantierCommentaire.syntheses_des_resultats[0]?.commentaire || null]),
      )),
      ...listeTypesDecisionsStrategiques.map((typeDecisionStrategique) => prisma.chantier_identite.findMany({
        where: {
          id: chantierIdsLecture,
        },
        include: {
          decisions_strategiques: {
            where: {
              type: typeDecisionStrategique,
            },
            orderBy: {
              date: 'desc',
            },
            take: 1,
          },
        },
      }).then(resultMap => new Map<string, string | null>(
        resultMap.map(chantierCommentaire => [chantierCommentaire.id, chantierCommentaire.decisions_strategiques[0]?.contenu || null]),
      ))),
      ...listeTypesObjectifs.map((typeObjectif) => prisma.chantier_identite.findMany({
        where: {
          id: chantierIdsLecture,
        },
        include: {
          objectifs: {
            where: {
              type: typeObjectif,
            },
            orderBy: {
              date: 'desc',
            },
            take: 1,
          },
        },
      }).then(resultMap => new Map<string, string | null>(
        resultMap.map(chantierCommentaire => [chantierCommentaire.id, chantierCommentaire.objectifs[0]?.contenu || null]),
      ))),
    ]);

    return prismaChantierIdentite.chantier_territoire
      .reduce((acc, prismaChantierTerritoire) => {
        if (territoireCodesLecture.includes(prismaChantierTerritoire.territoire_code)
            && (optionsExport.listeMeteos.length > 0 ? optionsExport.listeMeteos.includes(prismaChantierTerritoire.meteo || '') : true)) {
          let prismaChantierTerritoireReg = prismaChantierTerritoire;
          let prismaChantierTerritoireNat = prismaChantierTerritoire;

          if (prismaChantierTerritoire.maille === 'DEPT') {
            prismaChantierTerritoireReg = prismaChantierIdentite.chantier_territoire.find(chantierTerritoire => chantierTerritoire.territoire_code === prismaChantierTerritoire.territoire.code_parent)!;
            prismaChantierTerritoireNat = prismaChantierIdentite.chantier_territoire.find(chantierTerritoire => chantierTerritoire.territoire_code === 'NAT-FR')!;
          } else if (prismaChantierTerritoire.maille === 'REG') {
            prismaChantierTerritoireNat = prismaChantierIdentite.chantier_territoire.find(chantierTerritoire => chantierTerritoire.territoire_code === 'NAT-FR')!;
          }

          return [...acc, {
            nom: prismaChantierIdentite.nom,
            id: prismaChantierIdentite.id,
            maille: prismaChantierTerritoire.maille,
            régionNom: prismaChantierTerritoire.maille === 'REG' || prismaChantierTerritoire.maille === 'DEPT' ? prismaChantierTerritoireReg.territoire.nom : null,
            départementNom: prismaChantierTerritoire.maille === 'DEPT' ? prismaChantierTerritoire.territoire.nom : null,
            codeInsee: prismaChantierTerritoire.code_insee,
            ministèreNom: prismaChantierIdentite.ministeres_acronymes ? prismaChantierIdentite.ministeres_acronymes[0] : null,
            axe: prismaChantierIdentite.axe,
            tauxDAvancementAnnuel: verifyValeurIsNotNullOrUndefined(prismaChantierTerritoire.chantier_territoire_jalon.at(0)?.taux_avancement),
            tauxDAvancementNational: verifyValeurIsNotNullOrUndefined(prismaChantierTerritoireNat.taux_avancement_mandat),
            tauxDAvancementRégional: prismaChantierTerritoire.maille === 'REG' || prismaChantierTerritoire.maille === 'DEPT' ? verifyValeurIsNotNullOrUndefined(prismaChantierTerritoireReg.taux_avancement_mandat) : null,
            tauxDAvancementDépartemental: prismaChantierTerritoire.maille === 'DEPT' ? verifyValeurIsNotNullOrUndefined(prismaChantierTerritoire.taux_avancement_mandat) : null,
            périmètreIds: prismaChantierIdentite.perimetre_ids,
            météo: prismaChantierTerritoire.meteo as Météo || null,
            directeursProjet: prismaChantierIdentite.directeurs_projet,
            directeursProjetMails: prismaChantierIdentite.directeurs_projet_mails,
            responsablesLocaux: prismaChantierTerritoire.responsables_locaux,
            responsablesLocauxMails: prismaChantierTerritoire.responsables_locaux_mails,
            statut: prismaChantierIdentite.statut,
            estBaromètre: prismaChantierIdentite.est_barometre,
            estTerritorialisé: prismaChantierIdentite.est_territorialise,
            commActionsÀVenir: mapActionsAVenir.get(`${prismaChantierTerritoire.id}-${prismaChantierTerritoire.territoire_code}`) || null,
            commActionsÀValoriser: mapActionsAValoriser.get(`${prismaChantierTerritoire.id}-${prismaChantierTerritoire.territoire_code}`) || null,
            commFreinsÀLever: mapFreinsALever.get(`${prismaChantierTerritoire.id}-${prismaChantierTerritoire.territoire_code}`) || null,
            commCommentairesSurLesDonnées: mapCommentairesSurLesDonnees.get(`${prismaChantierTerritoire.id}-${prismaChantierTerritoire.territoire_code}`) || null,
            commAutresRésultats: mapAutresResultatsObtenus.get(`${prismaChantierTerritoire.id}-${prismaChantierTerritoire.territoire_code}`) || null,
            commAutresRésultatsNonCorrélésAuxIndicateurs: mapAutresResultatsObtenusNonCorrelesAuxIndicateurs.get(`${prismaChantierTerritoire.id}-${prismaChantierTerritoire.territoire_code}`) || null,
            decStratSuiviDesDécisions: prismaChantierTerritoire.maille === 'NAT' ? mapDecisionsStrategiques.get(prismaChantierIdentite.id) || null : null,
            objNotreAmbition: prismaChantierTerritoire.maille === 'NAT' ? mapNotreAmbition.get(prismaChantierIdentite.id) || null : null,
            objDéjàFait: prismaChantierTerritoire.maille === 'NAT' ? mapDejaFait.get(prismaChantierIdentite.id) || null : null,
            objÀFaire: prismaChantierTerritoire.maille === 'NAT' ? mapAFaire.get(prismaChantierIdentite.id) || null : null,
            synthèseDesRésultats: mapSynthesesDesResultats.get(`${prismaChantierTerritoire.id}-${prismaChantierTerritoire.territoire_code}`) || null,
          }];
        }
        return acc;
      }, [] as ChantierPourExport[])
      .sort((chantierA, chantierB) => {
        const orderMaille = { 'NAT': 1, 'REG': 2, 'DEPT': 3 };

        // Comparer par nom
        if (chantierB.nom && chantierA.nom && chantierB.nom !== chantierA.nom) {
          return chantierB.nom.localeCompare(chantierA.nom);
        }

        // Comparer par maille
        if (chantierA.maille && chantierB.maille && chantierA.maille !== chantierB.maille) {
          return orderMaille[chantierA.maille as keyof typeof orderMaille] - orderMaille[chantierB.maille as keyof typeof orderMaille];
        }

        // Comparer par nom_region
        const nomRegionCA = chantierB.maille === 'DEPT' ? chantierB.régionNom || null : chantierB.maille === 'REG' ? chantierB.départementNom : null;
        const nomRegionB = chantierA.maille === 'DEPT' ? chantierA.régionNom || null : chantierA.maille === 'REG' ? chantierA.départementNom : null;

        if (nomRegionCA && nomRegionB && nomRegionCA !== nomRegionB) {
          return nomRegionCA.localeCompare(nomRegionB);
        }

        // Comparer par code insee
        if (chantierB.codeInsee && chantierA.codeInsee && chantierB.codeInsee !== chantierA.codeInsee) {
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

  async récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions(chantierIds: string[], optionsExport: OptionsExport): Promise<string[]> {
    const listeChantierId = optionsExport.listeChantierId.length > 0 ? chantierIds.filter(value => optionsExport.listeChantierId.includes(value)) : chantierIds;
    const whereOptions: Prisma.chantier_identiteWhereInput = {};

    if (optionsExport.estBarometre && optionsExport.estTerritorialise) {
      whereOptions.OR = [{
        est_barometre: true,
      }, {
        est_territorialise: true,
      }];
    } else if (optionsExport.estBarometre) {
      whereOptions.est_barometre = true;
    } else if (optionsExport.estTerritorialise) {
      whereOptions.est_territorialise = true;
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

    const chantiers = await prisma.chantier_identite.findMany({
      distinct: ['id'],
      where: {
        id: { in: listeChantierId },
        ...whereOptions,
      },
      orderBy: [{ nom: 'asc' }],
      select: {
        id: true,
      },
    });

    return chantiers.map(chantier => chantier.id);
  }
}
