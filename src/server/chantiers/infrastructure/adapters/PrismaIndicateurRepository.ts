import { indicateur_identite as PrismaIndicateurIdentite, indicateur_territoire as PrismaIndicateurTerritoire, indicateur_territoire_jalon as PrismaIndicateurTerritoireJalon, PrismaClient } from '@prisma/client';
import { DonneeIndicateur } from '@/server/chantiers/domain/DonneeIndicateur';
import { IndicateurRepository } from '@/server/chantiers/domain/ports/IndicateurRepository';
import { verifyValeurIsNotNullOrUndefined } from '@/server/utils/VerifyValeurIsNotNullOrUndefined';

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
  constructor(private prismaClient: PrismaClient) {}

  async listerParIndicId({ indicId, jalon }: { indicId: string, jalon: number }): Promise<DonneeIndicateur[]> {
    const indicateurIdentite = await this.prismaClient.indicateur_identite.findUnique({
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
    await this.prismaClient.indicateur_territoire.update({
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

    await this.prismaClient.indicateur_territoire_jalon.update({
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
}
