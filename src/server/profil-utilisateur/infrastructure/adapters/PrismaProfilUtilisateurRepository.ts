import { ProfilUtilisateurRepository } from "@/server/profil-utilisateur/domain/ports/ProfilUtilisateurRepository";
import { ProfilUtilisateur } from "@/server/profil-utilisateur/domain/ProfilUtilisateur";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { NotFoundError } from "@/server/app/error-boundary/not-found-error";

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

  async recupererParId(utilisateurId: string): Promise<ProfilUtilisateur> {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
      select: {
        id: true,
        nom: true,
        prenom: true,
        fonction: true,
        email: true,
        ministere: true,
        service: true,
        service_autre: true,
      },
    });

    if (!utilisateur) {
      throw new NotFoundError("Utilisateur non trouvé");
    }

    return {
      id: utilisateur.id,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      email: utilisateur.email,
      fonction: utilisateur.fonction,
      ministere: utilisateur.ministere,
      service: utilisateur.service,
      serviceAutre: utilisateur.service_autre,
    };
  }

  async sauvegarder(profil: ProfilUtilisateur): Promise<void> {
    await this.prisma.utilisateur.upsert({
      where: { id: profil.id },
      update: {
        nom: profil.nom,
        prenom: profil.prenom,
        fonction: profil.fonction,
        ministere: profil.ministere,
        service: profil.service,
        service_autre: profil.serviceAutre,
        date_modification: new Date(),
      },
      create: {
        id: profil.id,
        nom: profil.nom,
        prenom: profil.prenom,
        email: profil.email,
        fonction: profil.fonction,
        ministere: profil.ministere,
        service: profil.service,
        service_autre: profil.serviceAutre,
        date_creation: new Date(),
        date_modification: new Date(),
        profilCode: "DITP_ADMIN",
      },
    });
  }
}
