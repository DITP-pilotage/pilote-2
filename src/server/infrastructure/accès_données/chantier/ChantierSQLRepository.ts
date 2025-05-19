import {
  chantier_identite as PrismaChantierIdentite,
  chantier_territoire as PrismaChantierTerritoire,
  chantier_territoire_jalon as PrismaChantierTerritoireJalon,
  Prisma,
  type_statut,
} from '@prisma/client';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import Chantier, { ChantierSynthétisé } from '@/server/domain/chantier/Chantier.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import { Météo } from '@/server/domain/météo/Météo.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { AvancementsStatistiques } from '@/components/_commons/Avancements/Avancements.interface';
import { ProfilCode, profilsTerritoriaux } from '@/server/domain/utilisateur/Utilisateur.interface';
import { FiltreQueryParams } from '@/server/chantiers/app/contrats/FiltreQueryParams';
import { removeAccents } from '@/server/utils/remove-accents';
import { calculerMoyenne, calculerMédiane } from '@/client/utils/statistiques/statistiques';
import { PrismaChantier } from '@/server/infrastructure/accès_données/chantier/PrismaChantier';
import { RepartitionMeteoChantiers } from '@/server/chantiers/domain/RepartitionMeteoChantiers';
import { verifyValeurIsNotNullOrUndefined } from '@/server/utils/VerifyValeurIsNotNullOrUndefined';
import { prisma } from '@/server/db/prisma';

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

  async récupérerLesEntréesDUnChantier(id: string, habilitations: Habilitations, profil: ProfilCode, jalon: number): Promise<(PrismaChantierIdentite & {
    chantier_territoire: (PrismaChantierTerritoire & { chantier_territoire_jalon: PrismaChantierTerritoireJalon[] })[]
  })> {
    const habilitation = new Habilitation(habilitations);
    const listeChantiersIdsAccessiblesEnLecture = habilitation.récupérerListeChantiersIdsAccessiblesEnLecture();

    let listeTerritoireAccessibleEnLecture = habilitation.récupérerListeTerritoireCodesAccessiblesEnLecture();

    const peutAccéderAuChantier = listeChantiersIdsAccessiblesEnLecture.includes(id);

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
              in: profilsTerritoriaux.includes(profil) ? undefined : [...listeTerritoireAccessibleEnLecture, 'NAT-FR'],
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

  async récupérerLesEntréesDeTousLesChantiersHabilitésNew(chantiersLectureIds: string[], territoiresLectureIds: string[], profil: ProfilCode, filtres: FiltreQueryParams, territoireCode: string, jalon: number): Promise<PrismaChantier[]> {
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
        if (filtres.territorialisation[0] === 'nationale') {
          whereOptions.mailles_applicables = {
            equals: ['NAT'],
          };
        } else if (filtres.territorialisation[0] === 'regionale') {
          whereOptions.NOT = {
            mailles_applicables: {
              has: 'DEPT',
            },
          };
          whereOptions.est_territorialise = true;
        } else if (filtres.territorialisation[0] === 'departementale') {
          whereOptions.mailles_applicables = {
            has: 'DEPT',
          };
          whereOptions.est_territorialise = true;
        }
      } else if (filtres.territorialisation?.length === 2) {
        if (filtres.territorialisation.includes('nationale') && filtres.territorialisation.includes('regionale')) {
          whereOptions.OR = [
            {
              est_territorialise: null,
            },
            {
              est_territorialise: true,
              NOT: {
                mailles_applicables: {
                  has: 'DEPT',
                },
              },
            },
          ];
        } else if (filtres.territorialisation.includes('regionale') && filtres.territorialisation.includes('departementale')) {
          whereOptions.est_territorialise = true;
        } else if (filtres.territorialisation.includes('nationale') && filtres.territorialisation.includes('departementale')) {
          whereOptions.OR = [
            {
              est_territorialise: null,
            },
            {
              est_territorialise: true,
              mailles_applicables: {
                has: 'DEPT',
              },
            },
          ];
        }
      }
    }

    if (filtres.valeurDeLaRecherche?.length > 0) {
      const testLower = removeAccents(filtres.valeurDeLaRecherche.toLowerCase());

      chantierIds = await prisma.$queryRawUnsafe<{ id: string }[]>('SELECT distinct(id) FROM chantier_identite where (LOWER(unaccent(nom)) ILIKE $1 OR LOWER(unaccent(id)) ILIKE $1)', `%${testLower}%`)
        .then(chantiersMatched => chantiersMatched.map(chantierMatched => chantierMatched.id).filter(chantierId => chantiersLectureIds.includes(chantierId)));
    }

    if (filtres.meteos?.length > 0) {
      chantierIds = await prisma.chantier_territoire.findMany({
        where: {
          id: { in: chantierIds },
          meteo: {
            in: filtres.meteos as Météo[],
          },
          territoire_code: territoireCode,
        },
      })
        .then(chantiersMatched => chantiersMatched.map(chantierMatched => chantierMatched.id).filter(chantierId => chantierIds.includes(chantierId)));
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
        id: 'asc',
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
            nombre_propositions_valeur_actuelle: true,
            nombre_propositions_valeur_actuelle_ponderee: true,
            date_taux_avancement_mandat_valeur_precedente: true,
            chantier_territoire_jalon: {
              select: {
                taux_avancement: true,
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
        NOT: {
          taux_avancement_mandat: {
            equals: null,
          },
        },
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
        minimum: verifyValeurIsNotNullOrUndefined(listeMoyenneParTerritoire.at(0)?._avg.taux_avancement_mandat),
        maximum: verifyValeurIsNotNullOrUndefined(listeMoyenneParTerritoire.at(-1)?._avg.taux_avancement_mandat),
      },
      annuel: {
        moyenne: null,
      },
    };
  }

  async recupererLaRepartitionMeteo(chantiersLectureIds: string[], territoireCode: string, filtres: FiltreQueryParams): Promise<RepartitionMeteoChantiers> {
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
        if (filtres.territorialisation[0] === 'nationale') {
          whereOptions.mailles_applicables = {
            equals: ['NAT'],
          };
        } else if (filtres.territorialisation[0] === 'regionale') {
          whereOptions.NOT = {
            mailles_applicables: {
              has: 'DEPT',
            },
          };
          whereOptions.est_territorialise = true;
        } else if (filtres.territorialisation[0] === 'departementale') {
          whereOptions.mailles_applicables = {
            has: 'DEPT',
          };
          whereOptions.est_territorialise = true;
        }
      } else if (filtres.territorialisation?.length === 2) {
        if (filtres.territorialisation.includes('nationale') && filtres.territorialisation.includes('regionale')) {
          whereOptions.OR = [
            {
              est_territorialise: null,
            },
            {
              est_territorialise: true,
              NOT: {
                mailles_applicables: {
                  has: 'DEPT',
                },
              },
            },
          ];
        } else if (filtres.territorialisation.includes('regionale') && filtres.territorialisation.includes('departementale')) {
          whereOptions.est_territorialise = true;
        } else if (filtres.territorialisation.includes('nationale') && filtres.territorialisation.includes('departementale')) {
          whereOptions.OR = [
            {
              est_territorialise: null,
            },
            {
              est_territorialise: true,
              mailles_applicables: {
                has: 'DEPT',
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
      const testLower = removeAccents(filtres.valeurDeLaRecherche.toLowerCase());

      chantierIds = await prisma.$queryRawUnsafe<{ id: string }[]>('SELECT distinct(id) FROM chantier_identite where (LOWER(unaccent(nom)) ILIKE $1 OR LOWER(unaccent(id)) ILIKE $1)', `%${testLower}%`)
        .then(chantiersMatched => chantiersMatched.map(chantierMatched => chantierMatched.id).filter(chantierId => chantiersLectureIds.includes(chantierId)));
    }
    const meteosGroupee = await prisma.chantier_territoire.groupBy({
      by: ['meteo'],
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
      nombreCouvert: meteosGroupee.find(meteo => meteo.meteo === 'COUVERT')?._count ?? 0,
      nombreNuage: meteosGroupee.find(meteo => meteo.meteo === 'NUAGE')?._count ?? 0,
      nombreOrage: meteosGroupee.find(meteo => meteo.meteo === 'ORAGE')?._count ?? 0,
      nombreSoleil: meteosGroupee.find(meteo => meteo.meteo === 'SOLEIL')?._count ?? 0,
    });
  }
}
