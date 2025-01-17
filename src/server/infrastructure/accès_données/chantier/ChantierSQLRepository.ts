import { chantier_identite as PrismaChantierIdentite, chantier_territoire as PrismaChantierTerritoire, type_objectif, Prisma, type_statut } from '@prisma/client';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import Chantier, { ChantierSynthétisé } from '@/server/domain/chantier/Chantier.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import { Météo } from '@/server/domain/météo/Météo.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { AvancementsStatistiques } from '@/components/_commons/Avancements/Avancements.interface';
import { ChantierPourExport } from '@/server/usecase/chantier/ExportCsvDesChantiersSansFiltreUseCase.interface';
import { territoireCodeVersMailleCodeInsee } from '@/server/utils/territoires';
import { ProfilCode, profilsTerritoriaux } from '@/server/domain/utilisateur/Utilisateur.interface';
import { OptionsExport } from '@/server/usecase/chantier/OptionsExport';
import { FiltreQueryParams, SortingParams } from '@/server/chantiers/app/contrats/FiltreQueryParams';
import { removeAccents } from '@/server/utils/remove-accents';
import { prisma } from '@/server/db/prisma';
import { calculerMoyenne, calculerMédiane } from '@/client/utils/statistiques/statistiques';

class ErreurChantierNonTrouvé extends Error {
  constructor(idChantier: string) {
    super(`Erreur: chantier '${idChantier}' non trouvé.`);
  }
}

export class ErreurChantierPermission extends Error {
  constructor(idChantier: string) {
    super(`Erreur de Permission: l'utilisateur n'a pas le droit de lecture pour le chantier '${idChantier}'.`);
  }
}

const appliquerSortingChantier = (sorting: SortingParams): Prisma.Enumerable<Prisma.chantierOrderByWithRelationInput> => {
  const sortingDirection = sorting.desc ? 'desc' : 'asc';
  const orderBy: Prisma.SortOrderInput = {
    sort: sortingDirection,
    nulls: 'last',
  };

  switch (sorting.id) {
    case 'avancement': {
      return [{
        taux_avancement: orderBy,
      }, {
        id: 'asc',
      }];
    }
    case 'météo': {
      return [{
        meteo_int_index: orderBy,
      }, {
        id: 'asc',
      }];
    }
    case 'dateDeMàjDonnéesQuantitatives': {
      return [{
        taux_avancement_date: orderBy,
      }, {
        id: 'asc',
      }];
    }
    case 'dateDeMàjDonnéesQualitatives': {
      return [{
        derniere_maj_date_qualitative: orderBy,
      }, {
        id: 'asc',
      }];
    }
    case 'tendance': {
      return [{
        tendance_int_index: orderBy,
      }, {
        id: 'asc',
      }];
    }
    case 'écart': {
      return [{
        ecart: orderBy,
      }, {
        id: 'asc',
      }];
    }
    default: {
      return {};
    }
  }
};

export default class ChantierSQLRepository implements ChantierRepository {
  async récupérerChantiersSynthétisés(): Promise<ChantierSynthétisé[]> {
    const listeChantiersIdentites = await prisma.chantier_identite.findMany({
      include: {
        chantier_territoire: {
          where: {
            est_applicable: true,
          },
          select: {
            territoire_code: true,
          },
        },
      },
    });

    return listeChantiersIdentites.map(chantier => ({
      id: chantier.id,
      nom: chantier.nom,
      estTerritorialisé: Boolean(chantier.est_territorialise),
      périmètreIds: chantier.perimetre_ids,
      ate: chantier.ate,
      statut: chantier.statut,
      territoiresApplicables: chantier.chantier_territoire.map(chantierTerritoire => chantierTerritoire.territoire_code),
    }));
  }

  async récupérerLesEntréesDUnChantier(id: string, habilitations: Habilitations, profil: ProfilCode): Promise<(PrismaChantierIdentite & {
    chantier_territoire: PrismaChantierTerritoire[]
  })[]> {
    const habilitation = new Habilitation(habilitations);
    const listeChantiersIdsAccessiblesEnLecture = habilitation.récupérerListeChantiersIdsAccessiblesEnLecture();

    let whereParam = {};

    if (!profilsTerritoriaux.includes(profil)) {
      let listeTerritoireAccessibleEnLecture = habilitation.récupérerListeTerritoireCodesAccessiblesEnLecture();
      // Par defaut, la maille NAT est retournée pour afficher l'avancement du pays
      listeTerritoireAccessibleEnLecture = [...listeTerritoireAccessibleEnLecture, 'NAT-FR'];
      whereParam = {
        territoire_code: {
          in: listeTerritoireAccessibleEnLecture,
        },
      };
    }

    const peutAccéderAuChantier = listeChantiersIdsAccessiblesEnLecture.includes(id);

    if (!peutAccéderAuChantier) {
      throw new ErreurChantierPermission(id);
    }

    const chantiers = await prisma.chantier_identite.findMany({
      where: {
        id,
      },
      include: {
        chantier_territoire: {
          where: whereParam,
        },
      },
    });

    if (!chantiers || chantiers.length === 0) {
      throw new ErreurChantierNonTrouvé(id);
    }

    return chantiers;
  }

  async récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions(habilitation: Habilitation, optionsExport: OptionsExport): Promise<Chantier['id'][]> {
    const chantierIdsLecture = habilitation.récupérerListeChantiersIdsAccessiblesEnLecture();

    const listeChantierId = optionsExport.listeChantierId.length > 0 ? chantierIdsLecture.filter(value => optionsExport.listeChantierId.includes(value)) : chantierIdsLecture;
    const whereOptions: Prisma.chantier_identiteWhereInput = {};

    if (optionsExport.estBarometre && optionsExport.estTerritorialise) {
      whereOptions.OR = [
        {
          est_barometre: true,
        }, {
          est_territorialise: true,
        },
      ];
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
    });

    return chantiers.map(c => c.id);
  }

  async récupérerLesEntréesDeTousLesChantiersHabilitésNew(chantiersLectureIds: string[], territoiresLectureIds: string[], profil: ProfilCode, maille: 'DEPT' | 'REG', filtres: FiltreQueryParams, sorting: SortingParams): Promise<PrismaChantierIdentite[]> {
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

    if (filtres.estTerritorialise && filtres.estBarometre) {
      whereOptions.OR = [{
        est_barometre: true,
      }, {
        est_territorialise: true,
      }];
    } else if (filtres.estTerritorialise) {
      whereOptions.est_territorialise = true;
    } else if (filtres.estBarometre) {
      whereOptions.est_barometre = true;
    }

    let chantierIds = chantiersLectureIds;

    if (filtres.valeurDeLaRecherche?.length > 0) {
      const testLower = removeAccents(filtres.valeurDeLaRecherche.toLowerCase());

      chantierIds = await prisma.$queryRawUnsafe<{ id: string }[]>('SELECT distinct(id) FROM chantier where (LOWER(unaccent(nom)) ILIKE $1 OR LOWER(unaccent(id)) ILIKE $1)', `%${testLower}%`)
        .then(chantiersMatched => chantiersMatched.map(chantierMatched => chantierMatched.id).filter(chantierId => chantiersLectureIds.includes(chantierId)));
    }

    let paramètresRequête : Prisma.chantier_identiteFindManyArgs = {
      where: {
        NOT: { ministeres: { isEmpty: true } },
        id: { in: chantierIds },
        ...whereOptions,
      },
      orderBy: sorting ? appliquerSortingChantier(sorting) : {},
    };

    if (!profilsTerritoriaux.includes(profil)) {
      // Par defaut, la maille NAT est retournée pour afficher l'avancement du pays
      paramètresRequête.where!.territoire_code = { in: [...territoiresLectureIds, 'NAT-FR'] };
    }

    return prisma.chantier.findMany(paramètresRequête);
  }

  async modifierMétéo(chantierId: string, territoireCode: string, météo: Météo) {
    await prisma.chantier_territoire.update({
      data: {
        meteo: météo,
      },
      where: {
        id_territoire_code: {
          id: chantierId,
          territoire_code: territoireCode,
        },
      },
    });
  }

  async récupérerPourExports(chantierIdsLecture: string[], territoireCodesLecture: string[]): Promise<ChantierPourExport[]> {
    const chantierIds = await prisma.chantier_identite.findMany({
      where: {
        id: { in: chantierIdsLecture },
        NOT: [
          {
            ministeres: { equals: '{}' },
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
                jalon: '2025',
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
      return prismaChantierIdentite.chantier_territoire.filter(chantierTerritoire => territoireCodesLecture.includes(chantierTerritoire.territoire_code)).map(prismaChantierTerritoire => {
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
          régionNom: prismaChantierTerritoire.maille === 'REG' || prismaChantierTerritoire.maille === 'DEPT' ? prismaChantierTerritoireReg.territoire.nom : null,
          départementNom: prismaChantierTerritoire.maille === 'DEPT' ? prismaChantierTerritoire.territoire.nom : null,
          codeInsee: prismaChantierTerritoire.code_insee,
          ministèreNom: prismaChantierIdentite.ministeres_acronymes ? prismaChantierIdentite.ministeres_acronymes[0] : null,
          axe: prismaChantierIdentite.axe,
          tauxDAvancementAnnuel: prismaChantierTerritoire.chantier_territoire_jalon.at(0)?.taux_avancement || null,
          tauxDAvancementNational: prismaChantierTerritoireNat.taux_avancement_mandat,
          tauxDAvancementRégional: prismaChantierTerritoire.maille === 'REG' || prismaChantierTerritoire.maille === 'DEPT' ? prismaChantierTerritoireReg.taux_avancement_mandat : null,
          tauxDAvancementDépartemental: prismaChantierTerritoire.maille === 'DEPT' ? prismaChantierTerritoire.taux_avancement_mandat : null,
          périmètreIds: prismaChantierIdentite.perimetre_ids,
          météo: (mapMeteo.get(`${prismaChantierTerritoire.id}-${prismaChantierTerritoire.territoire_code}`) || null) as Météo || null,
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
        };
      });
    });
  }

  async getChantierStatistiques(habilitations: Habilitations, listeChantier: Chantier['id'][], maille: Maille): Promise<AvancementsStatistiques> {
    const habilitation = new Habilitation(habilitations);
    const chantiersAutorisés = habilitation.récupérerListeChantiersIdsAccessiblesEnLecture();
    const chantiersLecture = listeChantier.filter((x) => chantiersAutorisés.includes(x));

    const listeMoyenneParTerritoire = await prisma.chantier_territoire.groupBy({
      by: ['territoire_code'],
      _avg: {
        taux_avancement_mandat: true,
      },
      where: {
        id: {
          in: (chantiersLecture || []),
        },
        maille: CODES_MAILLES[maille],
      },
      orderBy: {
        _avg: {
          taux_avancement_mandat: 'asc',
        },
      },
    });

    return {
      global: {
        moyenne: calculerMoyenne(listeMoyenneParTerritoire.map(moyenneParTerritoire => moyenneParTerritoire._avg.taux_avancement_mandat)),
        médiane: calculerMédiane(listeMoyenneParTerritoire.map(moyenneParTerritoire => moyenneParTerritoire._avg.taux_avancement_mandat)),
        minimum: listeMoyenneParTerritoire.at(0) === null || listeMoyenneParTerritoire.at(0) === undefined ? null : listeMoyenneParTerritoire.at(0)!._avg.taux_avancement_mandat,
        maximum: listeMoyenneParTerritoire.at(-1) === null || listeMoyenneParTerritoire.at(-1) === undefined ? null : listeMoyenneParTerritoire.at(-1)!._avg.taux_avancement_mandat,
      },
      annuel: {
        moyenne: null,
      },
    };
  }
}
