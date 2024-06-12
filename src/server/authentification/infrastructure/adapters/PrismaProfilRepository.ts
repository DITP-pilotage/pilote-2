import { PrismaClient } from '@prisma/client';
import { ProfilRepository } from '@/server/authentification/domain/ports/ProfilRepository';
import { ProfilAPI } from '@/server/authentification/domain/ProfilAPI';

export class PrismaProfilRepository implements ProfilRepository {
  constructor(private prismaClient: PrismaClient) {}

  async estAutoriseAAccederAuxChantiersBrouillons({ profilCode }: { profilCode: ProfilAPI }): Promise<boolean> {
    const prismaProfil = await this.prismaClient.profil.findUnique({
      where: {
        code: profilCode,
      },
    });

    return prismaProfil!.a_access_aux_chantiers_brouillons;
  }
}
