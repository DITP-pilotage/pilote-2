import { ProfilUtilisateurRepository } from "@/server/profil-utilisateur/domain/ports/ProfilUtilisateurRepository";
import {
  creerProfilUtilisateur,
  ProfilUtilisateur,
} from "@/server/profil-utilisateur/domain/ProfilUtilisateur";
import { PrismaPilote } from "@/server/db/PrismaPilote";

interface Dependencies {
  prisma: PrismaPilote;
}

export class PrismaProfilUtilisateurRepository
  implements ProfilUtilisateurRepository
{
  constructor(private readonly deps: Dependencies) {}

  get prisma() {
    return this.deps.prisma.getInstance();
  }

  async recupererParId(
    utilisateurId: string,
  ): Promise<ProfilUtilisateur | null> {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
      select: {
        id: true,
        nom: true,
        prenom: true,
        fonction: true,
        email: true,
      },
    });

    if (!utilisateur) {
      return null;
    }

    return {
      id: utilisateur.id,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      email: utilisateur.email,
      fonction: utilisateur.fonction,
    };
  }

  async modifierProfil(
    utilisateurId: string,
    data: { nom: string; prenom: string; fonction: string | null },
  ): Promise<void> {
    await this.prisma.utilisateur.update({
      where: { id: utilisateurId },
      data: {
        nom: data.nom,
        prenom: data.prenom,
        fonction: data.fonction,
        date_modification: new Date(),
      },
    });
  }
}
