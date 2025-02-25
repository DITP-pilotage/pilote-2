import { PrismaClient, chantier_identite as PrismaChantierIdentiteModel } from '@prisma/client';
import { ChantierRepository } from '@/server/gestion-utilisateur/domain/ports/ChantierRepository';
import { ChantierSynthétisé } from '@/server/domain/chantier/Chantier.interface';
import { InformationChantierUtilisateur } from '@/server/gestion-utilisateur/domain/InformationChantierUtilisateur';
import { PrismaPilote } from '@/server/db/PrismaPilote';

interface Dependencies {
  prisma: PrismaPilote
}

const convertirEnInformationChantierUtilisateur = (prismaChantier: Pick<PrismaChantierIdentiteModel, 'id' | 'est_territorialise' | 'perimetre_ids' | 'statut' | 'ate'>): InformationChantierUtilisateur => {
  return {
    id: prismaChantier.id,
    ate: prismaChantier.ate,
    statut: prismaChantier.statut,
    perimetreIds: prismaChantier.perimetre_ids,
    estTerritorialise: prismaChantier.est_territorialise,
  };
};

export class PrismaChantierRepository implements ChantierRepository {
  private prisma: PrismaClient;

  constructor({ prisma }: Dependencies) {
    this.prisma = prisma.getInstance();
  }

  async récupérerChantiersSynthétisés({ listeChantierIdLecture }: { listeChantierIdLecture: string[] }): Promise<ChantierSynthétisé[]> {
    const listeChantiersIdentites = await this.prisma.chantier_identite.findMany({
      where: {
        id: {
          in: listeChantierIdLecture,
        },
      },
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

  async listerInformationsChantiersUtilisateurs(): Promise<InformationChantierUtilisateur[]> {
    const listePrismaChantiers = await this.prisma.chantier_identite.findMany({
      select: {
        id: true,
        est_territorialise: true,
        perimetre_ids: true,
        statut: true,
        ate: true,
      },
    });

    return listePrismaChantiers.map(convertirEnInformationChantierUtilisateur);
  }
}
