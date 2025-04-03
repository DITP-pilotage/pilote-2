import {
  indicateur_identite as PrismaIndicateurIdentite,
  indicateur_territoire as PrismaIndicateurTerritoire,
  indicateur_territoire_jalon as PrismaIndicateurTerritoireJalon,
  PrismaClient,
} from '@prisma/client';
import { DonneeIndicateur } from '@/server/chantiers/domain/DonneeIndicateur';
import { IndicateurRepository } from '@/server/chantiers/domain/ports/IndicateurRepository';
import { verifyValeurIsNotNullOrUndefined } from '@/server/utils/VerifyValeurIsNotNullOrUndefined';
import { Météo } from '@/server/chantiers/domain/Meteo';
import { IndicateurPourExport } from '@/server/chantiers/domain/IndicateurPourExport';
import { HistoriqueIndicateurPourExport } from '@/server/chantiers/domain/HistoriqueIndicateurPourExport';
import { PrismaPilote } from '@/server/db/PrismaPilote';
import { TypeIndicateur } from '@/server/chantiers/domain/Indicateur';
import { DétailsIndicateurs } from '@/server/chantiers/domain/DétailsIndicateur';

const convertirEnDonneeIndicateur = (prismaIndicateurIdentite: PrismaIndicateurIdentite & {
  indicateur_territoire: (PrismaIndicateurTerritoire & { indicateur_territoire_jalon: PrismaIndicateurTerritoireJalon[] })[]
}): DonneeIndicateur[] => {
  return prismaIndicateurIdentite.indicateur_territoire.map(prismaIndicateurTerritoire => {
    const indicateurTerritoireJalon = prismaIndicateurTerritoire.indicateur_territoire_jalon[0];
    return DonneeIndicateur.creerDonneeIndicateur({
      indicId: prismaIndicateurIdentite.id,
      zoneId: prismaIndicateurTerritoire.zone_id,
      maille: prismaIndicateurTerritoire.maille,
      codeInsee: prismaIndicateurTerritoire.code_insee,
      territoireCode: prismaIndicateurTerritoire.territoire_code,
      valeurInitiale: prismaIndicateurTerritoire.valeur_initiale,
      dateValeurInitiale: prismaIndicateurTerritoire.date_valeur_initiale,
      valeurActuelle: verifyValeurIsNotNullOrUndefined(indicateurTerritoireJalon?.valeur_actuelle),
      dateValeurActuelle: indicateurTerritoireJalon?.date_valeur_actuelle || null,
      valeurCibleAnnuelle: verifyValeurIsNotNullOrUndefined(indicateurTerritoireJalon?.valeur_cible),
      dateValeurCibleAnnuelle: indicateurTerritoireJalon?.date_valeur_cible || null,
      tauxAvancementAnnuel: verifyValeurIsNotNullOrUndefined(indicateurTerritoireJalon?.taux_avancement),
      valeurCibleGlobale: prismaIndicateurTerritoire.valeur_cible_mandat,
      dateValeurCibleGlobale: prismaIndicateurTerritoire.date_valeur_cible_mandat,
      tauxAvancementGlobale: prismaIndicateurTerritoire.taux_avancement_mandat,
      estBarometre: prismaIndicateurIdentite.est_barometre || false,
    });
  });
};

interface Dependencies {
  prisma: PrismaPilote;
}
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

export class PrismaIndicateurRepository implements IndicateurRepository {
  private prisma: PrismaClient;

  constructor({ prisma }: Dependencies) {
    this.prisma = prisma.getInstance();
  }

  async listerParIndicId({ indicId, jalon }: { indicId: string, jalon: number }): Promise<DonneeIndicateur[]> {
    const indicateurIdentite = await this.prisma.indicateur_identite.findUnique({
      where: { id: indicId },
      include: {
        indicateur_territoire: {
          include: {
            indicateur_territoire_jalon: {
              where: {
                jalon,
              },
            },
          },
        },
      },
    });

    return indicateurIdentite ? convertirEnDonneeIndicateur(indicateurIdentite) : [];
  }

  async supprimerPropositionValeurActuelle({
    indicId,
    territoireCode,
    auteurModification,
  }: {
    indicId: string,
    territoireCode: string,
    auteurModification: string,
  }): Promise<void> {
    await this.prisma.indicateur_territoire.update({
      where: {
        id_territoire_code: {
          id: indicId,
          territoire_code: territoireCode,
        },
      },
      data: {
        motif_proposition: null,
        date_proposition: null,
        valeur_actuelle_proposition: null,
        taux_avancement_mandat_proposition: null,
        source_donnee_methode_calcul_proposition: null,
        auteur_proposition: auteurModification,
      },
    });

    await this.prisma.indicateur_territoire_jalon.update({
      where: {
        id_territoire_code_jalon: {
          id: indicId,
          territoire_code: territoireCode,
          jalon: 2025,
        },
      },
      data: {
        taux_avancement_proposition: null,
      },
    });
  }

  async récupérerPourExports(chantierId: string, territoireCodesLecture: string[], jalon: number): Promise<IndicateurPourExport[]> {
    const result = await this.prisma.indicateur_territoire.findMany({
      where: {
        territoire_code: {
          in: territoireCodesLecture,
        },
        indicateur_identite: {
          chantier_id: chantierId,
          chantier_identite: {
            NOT: [
              {
                ministeres: { isEmpty: true },
              },
            ],
          },
        },
        chantier_territoire: {
          est_applicable: true,
        },
      },
      select: {
        maille: true,
        code_insee: true,
        valeur_initiale: true,
        date_valeur_initiale: true,
        valeur_actuelle_mandat: true,
        date_valeur_actuelle_mandat: true,
        valeur_cible_mandat: true,
        date_valeur_cible_mandat: true,
        taux_avancement_mandat: true,
        est_applicable: true,
        indicateur_territoire_jalon: {
          where: {
            jalon,
          },
          select: {
            valeur_cible: true,
            date_valeur_cible: true,
            taux_avancement: true,
            valeur_actuelle: true,
            date_valeur_actuelle: true,
          },
        },
        indicateur_identite: {
          select: {
            nom: true,
            chantier_id: true,
            mailles_applicables: true,
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
            est_applicable: true,
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

    return result.map(indicateurPourExport => {
      const indicateurTerritoireJalon = indicateurPourExport.indicateur_territoire_jalon.at(0);
      const chantierTerritoireJalon = indicateurPourExport.chantier_territoire.chantier_territoire_jalon.at(0);
      return ({
        maille: indicateurPourExport.maille,
        régionNom: indicateurPourExport.maille === 'DEPT' ? indicateurPourExport.territoire.territoire_parent?.nom || null : indicateurPourExport.territoire.nom,
        départementNom: indicateurPourExport.maille === 'DEPT' ? indicateurPourExport.territoire.nom : null,
        codeInsee: indicateurPourExport.code_insee,
        chantierMinistèreNom: indicateurPourExport.indicateur_identite.chantier_identite.ministeres_acronymes ? indicateurPourExport.indicateur_identite.chantier_identite.ministeres_acronymes[0] : null,
        axe: indicateurPourExport.indicateur_identite.chantier_identite.axe,
        chantierNom: indicateurPourExport.indicateur_identite.chantier_identite.nom,
        chantierId: indicateurPourExport.indicateur_identite.chantier_id,
        chantierStatut: indicateurPourExport.indicateur_identite.chantier_identite.statut,
        chantierEstApplicable: indicateurPourExport.chantier_territoire.est_applicable,
        chantierEstBaromètre: indicateurPourExport.indicateur_identite.chantier_identite.est_barometre,
        chantierEstTerritorialise: indicateurPourExport.indicateur_identite.chantier_identite.est_territorialise,
        chantierAvancementGlobal: verifyValeurIsNotNullOrUndefined(indicateurPourExport.chantier_territoire.taux_avancement_mandat),
        chantierAvancementAnnuel: verifyValeurIsNotNullOrUndefined(chantierTerritoireJalon?.taux_avancement),
        périmètreIds: indicateurPourExport.indicateur_identite.chantier_identite.perimetre_ids,
        météo: indicateurPourExport.chantier_territoire.meteo as Météo | null,
        nom: indicateurPourExport.indicateur_identite.nom,
        valeurInitiale: indicateurPourExport.valeur_initiale,
        dateValeurInitiale: indicateurPourExport.date_valeur_initiale?.toISOString() || null,
        valeurActuelle: verifyValeurIsNotNullOrUndefined(indicateurTerritoireJalon?.valeur_actuelle),
        dateValeurActuelle: indicateurTerritoireJalon?.date_valeur_actuelle?.toISOString() || null,
        valeurCibleAnnuelle:verifyValeurIsNotNullOrUndefined(indicateurTerritoireJalon?.valeur_cible),
        dateValeurCibleAnnuelle: indicateurTerritoireJalon?.date_valeur_cible?.toISOString() || null,
        avancementAnnuel: verifyValeurIsNotNullOrUndefined(indicateurTerritoireJalon?.taux_avancement),
        valeurCible: indicateurPourExport.valeur_cible_mandat,
        dateValeurCible: indicateurPourExport.date_valeur_cible_mandat?.toISOString() || null,
        avancementGlobal: indicateurPourExport.taux_avancement_mandat,
        maillesApplicables: indicateurPourExport.indicateur_identite.mailles_applicables,
        estApplicable: indicateurPourExport.est_applicable,
      });
    }).sort((indicA, indicB) => {
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

  async récupérerHistoriquePourExports(chantierId: string, territoireCodesLecture: string[], jalon: number): Promise<HistoriqueIndicateurPourExport[]> {
    const result = await this.prisma.indicateur_territoire.findMany({
      where: {
        territoire_code: {
          in: territoireCodesLecture,
        },
        indicateur_identite: {
          chantier_id: chantierId,
          chantier_identite: {
            NOT: [
              {
                ministeres: { isEmpty: true },
              },
            ],
          },
        },
      },
      select: {
        maille: true,
        code_insee: true,
        valeur_initiale: true,
        date_valeur_initiale: true,
        evolution_valeur_actuelle: true,
        valeur_cible_mandat: true,
        date_valeur_cible_mandat: true,
        est_applicable: true,
        indicateur_territoire_jalon: {
          where: {
            jalon,
          },
          select: {
            valeur_cible: true,
            date_valeur_cible: true,
            taux_avancement: true,
            valeur_actuelle: true,
            date_valeur_actuelle: true,
          },
        },
        indicateur_identite: {
          select: {
            nom: true,
            chantier_id: true,
            mailles_applicables: true,
            chantier_identite: {
              select: {
                est_barometre: true,
                est_territorialise: true,
                nom: true,
                perimetre_ids: true,
                statut: true,
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
            est_applicable: true,
            meteo: true,
          },
        },
      },
    });

    return result.flatMap(indicateurPourExport => {
      const indicateurTerritoireJalon = indicateurPourExport.indicateur_territoire_jalon.at(0);

      return (indicateurPourExport.evolution_valeur_actuelle as unknown as historique_valeurs[]).map(historiqueIndicateur => ({
        maille: indicateurPourExport.maille,
        régionNom: indicateurPourExport.maille === 'DEPT' ? indicateurPourExport.territoire.territoire_parent?.nom || null : indicateurPourExport.territoire.nom,
        départementNom: indicateurPourExport.maille === 'DEPT' ? indicateurPourExport.territoire.nom : null,
        codeInsee: indicateurPourExport.code_insee,
        chantierNom: indicateurPourExport.indicateur_identite.chantier_identite.nom,
        chantierId: indicateurPourExport.indicateur_identite.chantier_id,
        nom: indicateurPourExport.indicateur_identite.nom,
        valeurInitiale: indicateurPourExport.valeur_initiale,
        dateValeurInitiale: indicateurPourExport.date_valeur_initiale?.toISOString() || null,
        valeurCibleAnnuelle:verifyValeurIsNotNullOrUndefined(indicateurTerritoireJalon?.valeur_cible),
        dateValeurCibleAnnuelle: indicateurTerritoireJalon?.date_valeur_cible?.toISOString() || null,
        valeurCible: indicateurPourExport.valeur_cible_mandat,
        dateValeurCible: indicateurPourExport.date_valeur_cible_mandat?.toISOString() || null,
        valeurActuelle: verifyValeurIsNotNullOrUndefined(historiqueIndicateur.valeur),
        dateValeurActuelle: historiqueIndicateur.date,
        périmètreIds: indicateurPourExport.indicateur_identite.chantier_identite.perimetre_ids,
        météo: indicateurPourExport.chantier_territoire.meteo as Météo | null,
        chantierEstBaromètre: indicateurPourExport.indicateur_identite.chantier_identite.est_barometre,
        chantierEstTerritorialise: indicateurPourExport.indicateur_identite.chantier_identite.est_territorialise,
        chantierStatut: indicateurPourExport.indicateur_identite.chantier_identite.statut,
        estApplicable: indicateurPourExport.est_applicable,
        maillesApplicables: indicateurPourExport.indicateur_identite.mailles_applicables,
      }));
    }).sort((indicA, indicB) => {
      const orderMaille = { 'NAT': 1, 'REG': 2, 'DEPT': 3 };

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

      return indicB.dateValeurActuelle.localeCompare(indicA.dateValeurActuelle);
    });
  }

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

    for (const indicateurRow of indicateurs) {
      if (!détailsIndicateurs[indicateurRow.id]) {
        détailsIndicateurs[indicateurRow.id] = {};
      }

      const indicateurTerritoireJalon = indicateurRow.indicateur_territoire_jalon.at(0);

      détailsIndicateurs[indicateurRow.id][indicateurRow.territoire_code] = {
        dateValeurActuelleMandat: formatDate(indicateurRow.date_valeur_actuelle_mandat),
        valeurActuelleMandat: indicateurRow.valeur_actuelle_mandat,
        codeInsee: indicateurRow.code_insee,
        valeurInitiale: indicateurRow.valeur_initiale,
        dateValeurInitiale: formatDate(indicateurRow.date_valeur_initiale),
        // TODO(Tristan-10/10/2024) : Trouver une moyen de se débarasser du as unknown
        historiquesValeurs: (indicateurRow.evolution_valeur_actuelle as unknown as historique_valeurs[]).sort((a, b) => comparerDates(a.date, b.date)),
        valeurActuelle: verifyValeurIsNotNullOrUndefined(indicateurTerritoireJalon?.valeur_actuelle),
        dateValeurActuelle: formatDate(indicateurTerritoireJalon?.date_valeur_actuelle || null),
        valeurCible: indicateurRow.valeur_cible_mandat,
        dateValeurCible: formatDate(indicateurRow.date_valeur_cible_mandat),
        valeurCibleAnnuelle: verifyValeurIsNotNullOrUndefined(indicateurTerritoireJalon?.valeur_cible),
        dateValeurCibleAnnuelle: formatDate(indicateurTerritoireJalon?.date_valeur_cible || null),
        avancement: {
          global: indicateurRow.taux_avancement_mandat,
          annuel: verifyValeurIsNotNullOrUndefined(indicateurTerritoireJalon?.taux_avancement),
        },
        proposition: indicateurRow.valeur_actuelle_proposition !== null && indicateurRow.valeur_actuelle_proposition !== undefined ? { // Pour autoriser une valeur actuelle proposé à 0
          valeurActuelle: indicateurRow.valeur_actuelle_proposition,
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
    const indicateur = await this.prisma.indicateur_identite.findFirst({
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

    const listeIndicateursModel = await this.prisma.indicateur_territoire.findMany({
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

    const territoires = await this.prisma.territoire.findMany({
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

    const indicateur = await this.prisma.indicateur_territoire.findMany({
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

    const territoires = await this.prisma.territoire.findMany();

    return parseDétailsIndicateur(indicateur, territoires);
  }

  async récupérerGroupésParChantier(chantiersIds: Chantier['id'][]): Promise<Record<string, Indicateur[]>> {
    const listePrismaIndicateurIdentite = await this.prisma.indicateur_identite.findMany({
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
    const indicateurs = await this.prisma.indicateur_territoire.findMany({
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
    const listePrismaIndicateurIdentite = await this.prisma.indicateur_identite.findMany({
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
    const indicateurs = await this.prisma.indicateur_territoire.findMany({
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
    const indicateurs = await this.prisma.indicateur_territoire.findMany({
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
    const listeIndicateurs = await this.prisma.indicateur_territoire.findMany({
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
