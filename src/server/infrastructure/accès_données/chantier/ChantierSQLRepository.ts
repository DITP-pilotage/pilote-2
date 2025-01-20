import {
  chantier_identite as PrismaChantierIdentite,
  chantier_territoire as PrismaChantierTerritoire,
  chantier_territoire_jalon as PrismaChantierTerritoireJalon,
  Prisma,
  type_objectif,
  type_statut,
  PrismaClient,
} from '@prisma/client';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import Chantier, { ChantierSynthétisé } from '@/server/domain/chantier/Chantier.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import { Météo } from '@/server/domain/météo/Météo.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { AvancementsStatistiques } from '@/components/_commons/Avancements/Avancements.interface';
import { ChantierPourExport } from '@/server/usecase/chantier/ExportCsvDesChantiersSansFiltreUseCase.interface';
import { ProfilCode, profilsTerritoriaux } from '@/server/domain/utilisateur/Utilisateur.interface';
import { OptionsExport } from '@/server/usecase/chantier/OptionsExport';
import { FiltreQueryParams } from '@/server/chantiers/app/contrats/FiltreQueryParams';
import { removeAccents } from '@/server/utils/remove-accents';
import { calculerMoyenne, calculerMédiane } from '@/client/utils/statistiques/statistiques';
import {
  getAnneeAffichageDateDeBascule,
} from '@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getDateBasculeAffichageValeursAnneePrecedente';
import { configuration } from '@/config';
import { PrismaChantier } from '@/server/infrastructure/accès_données/chantier/PrismaChantier';

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

export default class ChantierSQLRepository implements ChantierRepository {
  constructor(private prismaClient: PrismaClient) {}

  async récupérerChantiersSynthétisés(): Promise<ChantierSynthétisé[]> {
    const listeChantiersIdentites = await this.prismaClient.chantier_identite.findMany({
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
      orderBy: {
        id: 'asc',
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
    chantier_territoire: (PrismaChantierTerritoire & { chantier_territoire_jalon: PrismaChantierTerritoireJalon[] })[]
  })> {
    const habilitation = new Habilitation(habilitations);
    const listeChantiersIdsAccessiblesEnLecture = habilitation.récupérerListeChantiersIdsAccessiblesEnLecture();

    let listeTerritoireAccessibleEnLecture = habilitation.récupérerListeTerritoireCodesAccessiblesEnLecture();

    const peutAccéderAuChantier = listeChantiersIdsAccessiblesEnLecture.includes(id);

    if (!peutAccéderAuChantier) {
      throw new ErreurChantierPermission(id);
    }

    const chantier = await this.prismaClient.chantier_identite.findUnique({
      where: {
        id,
      },
      include: {
        chantier_territoire: {
          where: {
            territoire_code: {
              in: profilsTerritoriaux.includes(profil) ? undefined : [...listeTerritoireAccessibleEnLecture, 'NAT-FR'],
            },
          },
          include: {
            chantier_territoire_jalon: {
              where: {
                jalon: 2025,
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

    if (optionsExport.listeMeteos && optionsExport.listeMeteos.length > 0) {
      whereOptions.meteo = {
        in: optionsExport.listeMeteos as Météo[],
      };
    }

    if (optionsExport.perimetreIds && optionsExport.perimetreIds.length > 0) {
      whereOptions.perimetre_ids = {
        hasSome: optionsExport.perimetreIds,
      };
    }

    const chantiers = await this.prismaClient.chantier_identite.findMany({
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

    return chantiers.map(c => c.id);
  }
  async récupérerLesEntréesDeTousLesChantiersHabilitésNew(chantiersLectureIds: string[], territoiresLectureIds: string[], profil: ProfilCode, filtres: FiltreQueryParams): Promise<PrismaChantier[]> {
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

      chantierIds = await this.prismaClient.$queryRawUnsafe<{ id: string }[]>('SELECT distinct(id) FROM chantier_identite where (LOWER(unaccent(nom)) ILIKE $1 OR LOWER(unaccent(id)) ILIKE $1)', `%${testLower}%`)
        .then(chantiersMatched => chantiersMatched.map(chantierMatched => chantierMatched.id).filter(chantierId => chantiersLectureIds.includes(chantierId)));
    }

    return this.prismaClient.chantier_identite.findMany({
      where: {
        NOT: {
          ministeres: {
            isEmpty: true,
          },
        },
        id: { in: chantierIds },
        ...whereOptions,
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
        chantier_territoire: {
          where: {
            territoire_code: {
              in: profilsTerritoriaux.includes(profil) ? undefined : [...territoiresLectureIds, 'NAT-FR'],
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
            chantier_territoire_jalon: {
              select: {
                taux_avancement: true,
              },
              where: {
                jalon: getAnneeAffichageDateDeBascule(new Date(), configuration.dateBasculeAffichageValeursAnneePrecedente),
              },
            },
          },
        },
      },
    });
  }

  async modifierMétéo(chantierId: string, territoireCode: string, météo: Météo) {
    await this.prismaClient.chantier_territoire.update({
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
    const chantierIds = await this.prismaClient.chantier_identite.findMany({
      where: {
        id: { in: chantierIdsLecture },
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

    const listePrismaChantierIdentite = await this.prismaClient.chantier_identite.findMany({
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
      ...listeTypesCommentaires.map((typeCommentaire) => this.prismaClient.chantier_territoire.findMany({
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
      this.prismaClient.chantier_territoire.findMany({
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
      this.prismaClient.chantier_territoire.findMany({
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
      ...listeTypesDecisionsStrategiques.map((typeDecisionStrategique) => this.prismaClient.chantier_identite.findMany({
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
      ...listeTypesObjectifs.map((typeObjectif) => this.prismaClient.chantier_identite.findMany({
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

          // Comparer par nom_region
          const nomRegionCA = chantierB.maille === 'DEPT' ? chantierB.régionNom || null : chantierB.maille === 'REG' ? chantierB.départementNom : null;
          const nomRegionB = chantierA.maille === 'DEPT' ? chantierA.régionNom || null : chantierA.maille === 'REG' ? chantierA.départementNom : null;

          if (nomRegionCA && nomRegionB && nomRegionCA !== nomRegionB) {
            return nomRegionCA.localeCompare(nomRegionB);
          }

          // Comparer par code insee
          if (chantierB.codeInsee !== chantierA.codeInsee) {
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
    });
  }

  async getChantierStatistiques(habilitations: Habilitations, listeChantier: Chantier['id'][], maille: Maille): Promise<AvancementsStatistiques> {
    const habilitation = new Habilitation(habilitations);
    const chantiersAutorisés = habilitation.récupérerListeChantiersIdsAccessiblesEnLecture();
    const chantiersLecture = listeChantier.filter((x) => chantiersAutorisés.includes(x));

    const listeMoyenneParTerritoire = await this.prismaClient.chantier_territoire.groupBy({
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
