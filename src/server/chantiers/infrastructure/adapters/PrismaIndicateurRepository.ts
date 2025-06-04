import {
  indicateur_identite as PrismaIndicateurIdentite,
  indicateur_territoire as PrismaIndicateurTerritoire,
  indicateur_territoire_jalon as PrismaIndicateurTerritoireJalon,
} from '@prisma/client';
import { DonneeIndicateur } from '@/server/chantiers/domain/DonneeIndicateur';
import { IndicateurRepository } from '@/server/chantiers/domain/ports/IndicateurRepository';
import { verifyValeurIsNotNullOrUndefined } from '@/server/utils/VerifyValeurIsNotNullOrUndefined';
import { Météo } from '@/server/domain/météo/Météo.interface';
import { IndicateurPourExport } from '@/server/chantiers/domain/IndicateurPourExport';
import { prisma } from '@/server/db/prisma';
import { historique_valeurs } from '@/server/infrastructure/accès_données/chantier/indicateur/IndicateurSQLRepository';
import { HistoriqueIndicateurPourExport } from '@/server/chantiers/domain/HistoriqueIndicateurPourExport';

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

export class PrismaIndicateurRepository implements IndicateurRepository {
  async listerParIndicId({ indicId, jalon }: { indicId: string, jalon: number }): Promise<DonneeIndicateur[]> {
    const indicateurIdentite = await prisma.indicateur_identite.findUnique({
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
    await prisma.indicateur_territoire.update({
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

    await prisma.indicateur_territoire_jalon.update({
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
    const result = await prisma.indicateur_territoire.findMany({
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
            tendance: true,
            ecart: true,
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
        chantierTendance: indicateurPourExport.chantier_territoire.tendance,
        chantierEcart: indicateurPourExport.chantier_territoire.ecart,
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
    const result = await prisma.indicateur_territoire.findMany({
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
}
