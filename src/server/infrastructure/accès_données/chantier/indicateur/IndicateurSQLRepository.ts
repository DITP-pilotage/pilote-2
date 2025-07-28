import {
  indicateur_identite as PrismaIndicateurIdentite,
  indicateur_territoire as PrismaIndicateurTerritoire,
  indicateur_territoire_jalon as PrismaIndicateurTerritoireJalon,
} from '@prisma/client';
import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import Indicateur, { TypeIndicateur } from '@/server/domain/indicateur/Indicateur.interface';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import {
  DétailsIndicateurMailles,
  DétailsIndicateurs,
  DétailsIndicateurTerritoire,
} from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { groupByAndTransform } from '@/client/utils/arrays';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import {
  créerDonnéesTerritoires,
  parseDétailsIndicateur,
} from '@/server/infrastructure/accès_données/chantier/indicateur/IndicateurSQLParser';
import { ProfilCode, profilsTerritoriaux } from '@/server/domain/utilisateur/Utilisateur.interface';
import { comparerDates } from '@/client/utils/date/date';
import { verifyValeurIsNotNullOrUndefined } from '@/server/utils/VerifyValeurIsNotNullOrUndefined';
import { prisma } from '@/server/db/prisma';

export interface historique_valeurs {
  date: string
  valeur: number
}

class ErreurIndicateurNonTrouvé extends Error {
  constructor(idIndicateur: string) {
    super(`Erreur: indicateur '${idIndicateur}' non trouvé.`);
  }
}

function formatDate(date: Date | null): string | null {
  return date !== null ? date.toISOString() : null;
}

export default class IndicateurSQLRepository implements IndicateurRepository {
  private _mapToDomain(prismaIndicateurIdentite: PrismaIndicateurIdentite): Indicateur {
    return ({
      id: prismaIndicateurIdentite.id,
      nom: prismaIndicateurIdentite.nom,
      type: prismaIndicateurIdentite.type_id as TypeIndicateur,
      estIndicateurDuBaromètre: prismaIndicateurIdentite.est_barometre ?? false,
      description: prismaIndicateurIdentite.description,
      source: prismaIndicateurIdentite.source,
      modeDeCalcul: prismaIndicateurIdentite.mode_de_calcul,
      unité: prismaIndicateurIdentite.unite_mesure,
      parentId: prismaIndicateurIdentite.parent_id,
      periodicite: prismaIndicateurIdentite.periodicite ?? 'Non renseignée',
      delaiDisponibilite: prismaIndicateurIdentite.delai_disponibilite?.toString() ?? 'Non renseignée',
      responsablesDonneesMails: prismaIndicateurIdentite.responsables_donnees_mails,
      mailleNatAgregee: prismaIndicateurIdentite.maille_nat_agregee,
      mailleRegAgregee: prismaIndicateurIdentite.maille_reg_agregee,
    });
  }

  private _mapDétailsToDomain(indicateurs: (PrismaIndicateurTerritoire & {
    indicateur_identite: PrismaIndicateurIdentite
    indicateur_territoire_jalon: PrismaIndicateurTerritoireJalon[]
  })[]): DétailsIndicateurs {
    const détailsIndicateurs: DétailsIndicateurs = {};

    for (const indicateurRow of indicateurs) {
      if (!détailsIndicateurs[indicateurRow.id]) {
        détailsIndicateurs[indicateurRow.id] = {};
      }

      const indicateurTerritoireJalon = indicateurRow.indicateur_territoire_jalon.at(0);

      détailsIndicateurs[indicateurRow.id][indicateurRow.territoire_code] = {
        dateValeurAvancementMandat: formatDate(indicateurRow.date_valeur_actuelle_mandat),
        valeurAvancementMandat: indicateurRow.valeur_actuelle_mandat,
        codeInsee: indicateurRow.code_insee,
        valeurInitiale: indicateurRow.valeur_initiale,
        dateValeurInitiale: formatDate(indicateurRow.date_valeur_initiale),
        // TODO(Tristan-10/10/2024) : Trouver une moyen de se débarasser du as unknown
        historiquesValeurs: (indicateurRow.evolution_valeur_actuelle as unknown as historique_valeurs[]).sort((a, b) => comparerDates(a.date, b.date)),
        valeurAvancement: verifyValeurIsNotNullOrUndefined(indicateurTerritoireJalon?.valeur_actuelle),
        dateValeurAvancement: formatDate(indicateurTerritoireJalon?.date_valeur_actuelle || null),
        valeurCible: indicateurRow.valeur_cible_mandat,
        dateValeurCible: formatDate(indicateurRow.date_valeur_cible_mandat),
        valeurCibleAnnuelle: verifyValeurIsNotNullOrUndefined(indicateurTerritoireJalon?.valeur_cible),
        dateValeurCibleAnnuelle: formatDate(indicateurTerritoireJalon?.date_valeur_cible || null),
        avancement: {
          global: indicateurRow.taux_avancement_mandat,
          annuel: verifyValeurIsNotNullOrUndefined(indicateurTerritoireJalon?.taux_avancement),
        },
        proposition: indicateurRow.valeur_actuelle_proposition !== null && indicateurRow.valeur_actuelle_proposition !== undefined ? { // Pour autoriser une valeur actuelle proposé à 0
          valeurAvancement: indicateurRow.valeur_actuelle_proposition,
          tauxAvancement: indicateurRow.taux_avancement_mandat_proposition,
          tauxAvancementIntermediaire: verifyValeurIsNotNullOrUndefined(indicateurTerritoireJalon?.taux_avancement_proposition),
          auteur: indicateurRow.auteur_proposition,
          motif: indicateurRow.motif_proposition,
          sourceDonneeEtMethodeCalcul: indicateurRow.source_donnee_methode_calcul_proposition,
          dateProposition: formatDate(indicateurRow.date_proposition),
        } : null,
        unité: indicateurRow.indicateur_identite.unite_mesure,
        est_applicable: indicateurRow.est_applicable,
        dateImport: formatDate(indicateurRow.indicateur_identite.dernier_import_date_indic),
        pondération: indicateurRow.ponderation_zone_reel,
        prochaineDateValeurAvancement: formatDate(indicateurRow.prochaine_date_valeur_actuelle),
        prochaineDateMaj: formatDate(indicateurRow.prochaine_date_maj),
        prochaineDateMajJours: indicateurRow.prochaine_date_maj_jours,
        estAJour: indicateurRow.est_a_jour,
        tendance: indicateurRow.tendance,
      };
    }

    return détailsIndicateurs;
  }
  
  async récupérerChantierIdAssocié(id: string): Promise<string> {
    const indicateur = await prisma.indicateur_identite.findFirst({
      where: {
        id,
      },
    });

    return indicateur!.chantier_id;
  }

  async récupérerDétailsTerritoirePourUnIndicateur(indicateurId: string, habilitations: Habilitations, profil: ProfilCode, jalon: number): Promise<DétailsIndicateurTerritoire> {
    const habilitation = new Habilitation(habilitations);
    const chantiersLecture = habilitation.récupérerListeChantiersIdsAccessiblesEnLecture();
    const territoiresLecture = habilitation.récupérerListeTerritoireCodesAccessiblesEnLecture();

    const listeIndicateursModel = await prisma.indicateur_territoire.findMany({
      where: {
        id: indicateurId,
        indicateur_identite: {
          chantier_id: { in: chantiersLecture },
        },
        territoire_code: !profilsTerritoriaux.includes(profil) ? { in: territoiresLecture } : undefined,
      },
      include: {
        indicateur_identite: true,
        indicateur_territoire_jalon: {
          where: {
            jalon,
          },
        },
      },
    });

    if (listeIndicateursModel.length === 0) {
      throw new ErreurIndicateurNonTrouvé(indicateurId);
    }

    const territoires = await prisma.territoire.findMany({
      select: {
        code: true,
        code_insee: true,
      },
    });

    return créerDonnéesTerritoires(territoires, listeIndicateursModel);
  }

  async récupérerDétailsParMailles(id: string, habilitations: Habilitations, profil: ProfilCode, jalon: number): Promise<DétailsIndicateurMailles> {
    const h = new Habilitation(habilitations);
    const chantiersLecture = h.récupérerListeChantiersIdsAccessiblesEnLecture();
    const territoiresLecture = h.récupérerListeTerritoireCodesAccessiblesEnLecture();

    const indicateur = await prisma.indicateur_territoire.findMany({
      where: {
        id,
        indicateur_identite: {
          chantier_id: { in: chantiersLecture },
        },
        territoire_code: !profilsTerritoriaux.includes(profil) ? { in: territoiresLecture } : undefined,
      },
      include: {
        indicateur_identite: true,
        indicateur_territoire_jalon: {
          where: {
            jalon,
          },
        },
      },
    });

    if (!indicateur) {
      throw new ErreurIndicateurNonTrouvé(id);
    }

    const territoires = await prisma.territoire.findMany();

    return parseDétailsIndicateur(indicateur, territoires);
  }

  async récupérerGroupésParChantier(chantiersIds: Chantier['id'][]): Promise<Record<string, Indicateur[]>> {
    const listePrismaIndicateurIdentite = await prisma.indicateur_identite.findMany({
      where: {
        chantier_id: { in: chantiersIds },
        NOT: {
          type_id : null,
        },
      },
    });

    return groupByAndTransform(
      listePrismaIndicateurIdentite,
      (indicateur) => indicateur.chantier_id,
      this._mapToDomain,
    );
  }

  async récupérerDétailsGroupésParChantierEtParIndicateur(chantiersIds: Chantier['id'][], maille: Maille, codeInsee: CodeInsee, jalon: number): Promise<Record<Chantier['id'], DétailsIndicateurs>> {
    const indicateurs = await prisma.indicateur_territoire.findMany({
      where: {
        maille: CODES_MAILLES[maille],
        code_insee: codeInsee,
        indicateur_identite: {
          chantier_id: { in: chantiersIds },
          NOT: {
            type_id : null,
          },
        },
      },
      include: {
        indicateur_identite: true,
        indicateur_territoire_jalon: {
          where: {
            jalon,
          },
        },
      },
    });  

    return Object.fromEntries(
      indicateurs.map(indicateur => (
        [
          indicateur.indicateur_identite.chantier_id,
          this._mapDétailsToDomain(indicateurs.filter(ind => ind.indicateur_identite.chantier_id === indicateur.indicateur_identite.chantier_id)),
        ]
      )),
    );
  }

  async récupérerParChantierId(chantierId: string): Promise<Indicateur[]> {
    const listePrismaIndicateurIdentite = await prisma.indicateur_identite.findMany({
      where: {
        chantier_id: chantierId,
        NOT: {
          type_id : null,
        },
      },
    });
    
    return listePrismaIndicateurIdentite.map((indicateur) => this._mapToDomain(indicateur));
  }

  async récupérerDétailsParIndicIdEtMaille(indicateurId: string, maille: Maille, jalon: number): Promise<DétailsIndicateurs> {
    const indicateurs = await prisma.indicateur_territoire.findMany({
      where: {
        id: indicateurId,
        maille: CODES_MAILLES[maille],
        indicateur_identite: {
          NOT: {
            type_id : null,
          },
        },
      },
      include: {
        indicateur_identite: true,
        indicateur_territoire_jalon: {
          where: {
            jalon,
          },
        },
      },
    });

    return this._mapDétailsToDomain(indicateurs);
  }

  async récupererDétailsParChantierIdEtTerritoire(chantierId: string, territoireCodes: string[], jalon: number): Promise<DétailsIndicateurs> {
    const indicateurs = await prisma.indicateur_territoire.findMany({
      where: {
        territoire_code: { in: territoireCodes },
        indicateur_identite: {
          chantier_id: chantierId,
          NOT: {
            type_id : null,
          },
        },
      },
      include: {
        indicateur_identite: true,
        indicateur_territoire_jalon: {
          where: {
            jalon,
          },
        },
      },
    });
    return this._mapDétailsToDomain(indicateurs);
  }

  async recupererListeIndicateursPrisEnCompteDansCalculAvancementSurAuMoinsUnTerritoire(chantiersIds: Chantier['id'][]): Promise<Indicateur['id'][]> {
    const listeIndicateurs = await prisma.indicateur_territoire.findMany({
      where: {
        chantier_id: {
          in: chantiersIds,
        },
        ponderation_zone_reel: {
          not: null,
          gt: 0,
        },
      },
      select: {
        id: true,
      },
      distinct: ['id'],
    });

    return listeIndicateurs.map(indicateur => indicateur.id);
  }
}
