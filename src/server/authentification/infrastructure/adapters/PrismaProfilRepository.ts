import { ProfilRepository } from '@/server/authentification/domain/ports/ProfilRepository';
import { ProfilAPI } from '@/server/authentification/domain/ProfilAPI';
import { prisma } from '@/server/db/prisma';

export class PrismaProfilRepository implements ProfilRepository {
  async estAutoriseAAccederAuxChantiersBrouillons({ profilCode }: { profilCode: ProfilAPI }): Promise<boolean> {
    const prismaProfil = await prisma.profil.findUnique({
      where: {
        code: profilCode,
      },
    });

    return prismaProfil!.a_access_aux_chantiers_brouillons;
  }
}
