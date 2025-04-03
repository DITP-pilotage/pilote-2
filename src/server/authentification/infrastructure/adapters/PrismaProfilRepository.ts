import { PrismaClient } from '@prisma/client';
import { ProfilRepository } from '@/server/authentification/domain/ports/ProfilRepository';
import { ProfilAPI } from '@/server/authentification/domain/ProfilAPI';
import { PrismaPilote } from '@/server/db/PrismaPilote';

type Dependencies = {
  prisma: PrismaPilote;
};

export class PrismaProfilRepository implements ProfilRepository {
  private prisma: PrismaClient;

  constructor({ prisma }: Dependencies) {
    this.prisma = prisma.getInstance();
  }

  async estAutoriseAAccederAuxChantiersBrouillons({ profilCode }: { profilCode: ProfilAPI }): Promise<boolean> {
    const prismaProfil = await this.prisma.profil.findUnique({
      where: {
        code: profilCode,
      },
    });

    return prismaProfil!.a_access_aux_chantiers_brouillons;
  }
}
