import {
  indicateur_identite as PrismaIndicateurIdentite,
  indicateur_territoire as PrismaIndicateurTerritoire,
  indicateur_territoire_jalon as PrismaIndicateurTerritoireJalon, PrismaClient,
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
  IndicateurPourExport,
} from '@/server/usecase/chantier/indicateur/ExportCsvDesIndicateursSansFiltreUseCase.interface';
import {
  créerDonnéesTerritoires,
  parseDétailsIndicateur,
} from '@/server/infrastructure/accès_données/chantier/indicateur/IndicateurSQLParser';
import { ProfilCode, profilsTerritoriaux } from '@/server/domain/utilisateur/Utilisateur.interface';
import { comparerDates } from '@/client/utils/date/date';
import { configuration } from '@/config';
import {
  getAnneeAffichageDateDeBascule,
} from '@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getDateBasculeAffichageValeursAnneePrecedente';
import { Météo } from '@/server/domain/météo/Météo.interface';

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
  constructor(private prismaClient: PrismaClient) {}

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
    });
  }

  private _mapDétailsToDomain(indicateurs: (PrismaIndicateurTerritoire & {
    indicateur_identite: PrismaIndicateurIdentite
    indicateur_territoire_jalon: PrismaIndicateurTerritoireJalon[]
  })[]): DétailsIndicateurs {
    const détailsIndicateurs: DétailsIndicateurs = {};

    const dateBascule = configuration.dateBasculeAffichageValeursAnneePrecedente;

    let estDateDuJourCorrespondantALanneeValeurCible: boolean;
    for (const indicateurRow of indicateurs) {
      estDateDuJourCorrespondantALanneeValeurCible = indicateurRow?.indicateur_territoire_jalon.at(0)?.date_valeur_cible ? getAnneeAffichageDateDeBascule(new Date(), dateBascule) === indicateurRow?.indicateur_territoire_jalon.at(0)?.date_valeur_cible?.getFullYear() : false;

      if (!détailsIndicateurs[indicateurRow.id]) {
        détailsIndicateurs[indicateurRow.id] = {};
      }

      détailsIndicateurs[indicateurRow.id][indicateurRow.territoire_code] = {
        codeInsee: indicateurRow.code_insee,
        valeurInitiale: indicateurRow.valeur_initiale,
        dateValeurInitiale: formatDate(indicateurRow.date_valeur_initiale),
        // TODO(Tristan-10/10/2024) : Trouver une moyen de se débarasser du as unknown
        historiquesValeurs: (indicateurRow.evolution_valeur_actuelle as unknown as historique_valeurs[]).sort((a, b) => comparerDates(a.date, b.date)),
        valeurActuelle: indicateurRow.valeur_actuelle,
        dateValeurActuelle: formatDate(indicateurRow.date_valeur_actuelle),
        valeurCible: indicateurRow.valeur_cible_mandat,
        dateValeurCible: formatDate(indicateurRow.date_valeur_cible_mandat),
        valeurCibleAnnuelle: estDateDuJourCorrespondantALanneeValeurCible && indicateurRow.indicateur_territoire_jalon.at(0)?.valeur_cible !== null && !Number.isNaN(indicateurRow?.indicateur_territoire_jalon.at(0)?.valeur_cible) ? indicateurRow.indicateur_territoire_jalon.at(0)?.valeur_cible! : null,
        dateValeurCibleAnnuelle: estDateDuJourCorrespondantALanneeValeurCible ? formatDate(indicateurRow.indicateur_territoire_jalon.at(0)?.date_valeur_cible || null) : null,
        avancement: {
          global: indicateurRow.taux_avancement_mandat,
          annuel: estDateDuJourCorrespondantALanneeValeurCible && indicateurRow.indicateur_territoire_jalon.at(0)?.taux_avancement !== null && !Number.isNaN(indicateurRow?.indicateur_territoire_jalon.at(0)?.taux_avancement) ? indicateurRow.indicateur_territoire_jalon.at(0)?.taux_avancement! : null,
        },
        proposition: indicateurRow.valeur_actuelle_proposition !== null && indicateurRow.valeur_actuelle_proposition !== undefined ? { // Pour autoriser une valeur actuelle proposé à 0
          valeurActuelle: indicateurRow.valeur_actuelle_proposition,
          tauxAvancement: indicateurRow.taux_avancement_mandat_proposition,
          tauxAvancementIntermediaire: estDateDuJourCorrespondantALanneeValeurCible && indicateurRow.indicateur_territoire_jalon.at(0)?.taux_avancement_proposition !== null && !Number.isNaN(indicateurRow?.indicateur_territoire_jalon.at(0)?.taux_avancement_proposition) ? indicateurRow.indicateur_territoire_jalon.at(0)?.taux_avancement_proposition! : null,
          auteur: indicateurRow.auteur_proposition,
          motif: indicateurRow.motif_proposition,
          sourceDonneeEtMethodeCalcul: indicateurRow.source_donnee_methode_calcul_proposition,
          dateProposition: formatDate(indicateurRow.date_proposition),
        } : null,
        unité: indicateurRow.indicateur_identite.unite_mesure,
        est_applicable: indicateurRow.est_applicable,
        dateImport: formatDate(indicateurRow.indicateur_identite.dernier_import_date_indic),
        pondération: indicateurRow.ponderation_zone_reel,
        prochaineDateValeurActuelle: formatDate(indicateurRow.prochaine_date_valeur_actuelle),
        prochaineDateMaj: formatDate(indicateurRow.prochaine_date_maj),
        prochaineDateMajJours: indicateurRow.prochaine_date_maj_jours,
        estAJour: indicateurRow.est_a_jour,
        tendance: indicateurRow.tendance,
      };
    }

    return détailsIndicateurs;
  }
  
  async récupérerChantierIdAssocié(id: string): Promise<string> {
    const indicateur = await this.prismaClient.indicateur_identite.findFirst({
      where: {
        id,
      },
    });

    return indicateur!.chantier_id;
  }

  async récupérerDétailsTerritoirePourUnIndicateur(indicateurId: string, habilitations: Habilitations, profil: ProfilCode): Promise<DétailsIndicateurTerritoire> {
    const habilitation = new Habilitation(habilitations);
    const chantiersLecture = habilitation.récupérerListeChantiersIdsAccessiblesEnLecture();
    const territoiresLecture = habilitation.récupérerListeTerritoireCodesAccessiblesEnLecture();

    const listeIndicateursModel = await this.prismaClient.indicateur_territoire.findMany({
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
            jalon: getAnneeAffichageDateDeBascule(new Date(), configuration.dateBasculeAffichageValeursAnneePrecedente),
          },
        },
      },
    });

    if (listeIndicateursModel.length === 0) {
      throw new ErreurIndicateurNonTrouvé(indicateurId);
    }

    const territoires = await this.prismaClient.territoire.findMany({
      select: {
        code: true,
        code_insee: true,
      },
    });

    return créerDonnéesTerritoires(territoires, listeIndicateursModel);
  }

  async récupérerDétailsParMailles(id: string, habilitations: Habilitations, profil: ProfilCode): Promise<DétailsIndicateurMailles> {
    const h = new Habilitation(habilitations);
    const chantiersLecture = h.récupérerListeChantiersIdsAccessiblesEnLecture();
    const territoiresLecture = h.récupérerListeTerritoireCodesAccessiblesEnLecture();

    const indicateur = await this.prismaClient.indicateur_territoire.findMany({
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
            jalon: getAnneeAffichageDateDeBascule(new Date(), configuration.dateBasculeAffichageValeursAnneePrecedente),
          },
        },
      },
    });

    if (!indicateur) {
      throw new ErreurIndicateurNonTrouvé(id);
    }

    const territoires = await this.prismaClient.territoire.findMany();

    return parseDétailsIndicateur(indicateur, territoires);
  }

  async récupérerGroupésParChantier(chantiersIds: Chantier['id'][]): Promise<Record<string, Indicateur[]>> {
    const listePrismaIndicateurIdentite = await this.prismaClient.indicateur_identite.findMany({
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

  async récupérerDétailsGroupésParChantierEtParIndicateur(chantiersIds: Chantier['id'][], maille: Maille, codeInsee: CodeInsee): Promise<Record<Chantier['id'], DétailsIndicateurs>> {
    const indicateurs = await this.prismaClient.indicateur_territoire.findMany({
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
            jalon: getAnneeAffichageDateDeBascule(new Date(), configuration.dateBasculeAffichageValeursAnneePrecedente),
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
    const listePrismaIndicateurIdentite = await this.prismaClient.indicateur_identite.findMany({
      where: {
        chantier_id: chantierId,
        NOT: {
          type_id : null,
        },
      },
    });
    
    return listePrismaIndicateurIdentite.map((indicateur) => this._mapToDomain(indicateur));
  }

  async récupérerDétailsParIndicIdEtMaille(indicateurId: string, maille: Maille): Promise<DétailsIndicateurs> {
    const indicateurs = await this.prismaClient.indicateur_territoire.findMany({
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
            jalon: getAnneeAffichageDateDeBascule(new Date(), configuration.dateBasculeAffichageValeursAnneePrecedente),
          },
        },
      },
    });

    return this._mapDétailsToDomain(indicateurs);
  }

  async récupererDétailsParChantierIdEtTerritoire(chantierId: string, territoireCodes: string[]): Promise<DétailsIndicateurs> {
    const indicateurs = await this.prismaClient.indicateur_territoire.findMany({
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
            jalon: getAnneeAffichageDateDeBascule(new Date(), configuration.dateBasculeAffichageValeursAnneePrecedente),
          },
        },
      },
    });
    return this._mapDétailsToDomain(indicateurs);
  }

  async récupérerPourExports(chantierIdsLecture: string[], territoireCodesLecture: string[]): Promise<IndicateurPourExport[]> {
    const result = await this.prismaClient.indicateur_territoire.findMany({
      where: {
        territoire_code: {
          in: territoireCodesLecture,
        },
        indicateur_identite: {
          chantier_id: { in: chantierIdsLecture },
          chantier_identite: {
            NOT: [
              {
                ministeres: { isEmpty: true },
              },
            ],
          },
        },
        est_applicable: true,
      },
      select: {
        maille: true,
        code_insee: true,
        valeur_initiale: true,
        date_valeur_initiale: true,
        valeur_actuelle: true,
        date_valeur_actuelle: true,
        valeur_cible_mandat: true,
        date_valeur_cible_mandat: true,
        taux_avancement_mandat: true,
        indicateur_territoire_jalon: {
          where: {
            jalon: getAnneeAffichageDateDeBascule(new Date(), configuration.dateBasculeAffichageValeursAnneePrecedente),
          },
          select: {
            valeur_cible: true,
            date_valeur_cible: true,
            taux_avancement: true,
          },
        },
        indicateur_identite: {
          select: {
            nom: true,
            chantier_id: true,
            chantier_identite: {
              select: {
                ministeres_acronymes: true,
                ministeres: true,
                est_barometre: true,
                est_territorialise: true,
                statut: true,
                nom: true,
                axe: true,
                perimetre_ids: true,
              },
            },
          },
        },
        territoire: {
          select: {
            nom: true,
            territoire_parent: {
              select: {
                nom: true,
              },
            },
          },
        },
        chantier_territoire: {
          select: {
            meteo: true,
            taux_avancement_mandat: true,
          },
        },
      },
    });

    return result.map(it => ({
      maille: it.maille,
      régionNom: it.maille === 'DEPT' ? it.territoire.territoire_parent?.nom || null : it.territoire.nom,
      départementNom: it.maille === 'DEPT' ? it.territoire.nom : null,
      codeInsee: it.code_insee,
      chantierMinistèreNom: it.indicateur_identite.chantier_identite.ministeres_acronymes ? it.indicateur_identite.chantier_identite.ministeres_acronymes[0] : null,
      axe: it.indicateur_identite.chantier_identite.axe,
      chantierNom: it.indicateur_identite.chantier_identite.nom,
      chantierId: it.indicateur_identite.chantier_id,
      chantierStatut: it.indicateur_identite.chantier_identite.statut,
      chantierEstBaromètre: it.indicateur_identite.chantier_identite.est_barometre,
      chantierEstTerritorialise: it.indicateur_identite.chantier_identite.est_territorialise,
      chantierAvancementGlobal: it.chantier_territoire.taux_avancement_mandat,
      périmètreIds: it.indicateur_identite.chantier_identite.perimetre_ids,
      météo: it.chantier_territoire.meteo as Météo | null,
      nom: it.indicateur_identite.nom,
      valeurInitiale: it.valeur_initiale,
      dateValeurInitiale: it.date_valeur_initiale?.toISOString() || null,
      valeurActuelle: it.valeur_actuelle,
      dateValeurActuelle: it.date_valeur_actuelle?.toISOString() || null,
      valeurCibleAnnuelle: it.indicateur_territoire_jalon.at(0)?.valeur_cible !== null && it.indicateur_territoire_jalon.at(0)?.valeur_cible !== undefined ? it.indicateur_territoire_jalon.at(0)?.valeur_cible! : null,
      dateValeurCibleAnnuelle: it.indicateur_territoire_jalon.at(0)?.date_valeur_cible?.toISOString() || null,
      avancementAnnuel: it.indicateur_territoire_jalon.at(0)?.taux_avancement !== null && it.indicateur_territoire_jalon.at(0)?.taux_avancement !== undefined ? it.indicateur_territoire_jalon.at(0)?.taux_avancement! : null,
      valeurCible: it.valeur_cible_mandat,
      dateValeurCible: it.date_valeur_cible_mandat?.toISOString() || null,
      avancementGlobal: it.taux_avancement_mandat,
    })).sort((indicA, indicB) => {
      const orderMaille = { 'NAT': 1, 'REG': 2, 'DEPT': 3 };

      // Comparer par nom
      if (indicB.chantierNom !== indicA.chantierNom) {
        return indicB.chantierNom.localeCompare(indicA.chantierNom);
      }

      // Comparer par nom_indicateur
      if (indicB.nom !== indicA.nom) {
        return indicB.nom.localeCompare(indicA.nom);
      }

      // Comparer par maille
      if (indicA.maille !== indicB.maille) {
        return orderMaille[indicA.maille] - orderMaille[indicB.maille];
      }

      // Comparer par nom_region
      const nomRegionA = indicB.maille === 'DEPT' ? indicB.régionNom || null : indicB.maille === 'REG' ? indicB.départementNom : null;
      const nomRegionB = indicA.maille === 'DEPT' ? indicA.régionNom || null : indicA.maille === 'REG' ? indicA.départementNom : null;
      if (nomRegionA && nomRegionB && nomRegionA !== nomRegionB) {
        return nomRegionA.localeCompare(nomRegionB);
      }// Comparer par code insee
      if (indicB.codeInsee !== indicA.codeInsee) {
        return indicB.codeInsee.localeCompare(indicA.codeInsee);
      }

      // Comparer par ministere
      if (indicB.chantierMinistèreNom === null) {
        return 1;
      }
      if (indicA.chantierMinistèreNom === null) {
        return -1;
      }
      return indicB.chantierMinistèreNom.localeCompare(indicA.chantierMinistèreNom);
    });
  }
}
