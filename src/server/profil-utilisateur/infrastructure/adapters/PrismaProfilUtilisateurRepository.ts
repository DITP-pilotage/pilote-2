import { ProfilUtilisateurRepository } from "@/server/profil-utilisateur/domain/ports/ProfilUtilisateurRepository";
import { ProfilUtilisateur } from "@/server/profil-utilisateur/domain/ProfilUtilisateur";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { NotFoundError } from "@/server/app/error-boundary/not-found-error";

interface Dependencies {
  prisma: PrismaPilote;
}

export class PrismaProfilUtilisateurRepository implements ProfilUtilisateurRepository {
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
        service: true,
        service_autre: true,
        perimetre_ministeriel: true,
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
      service: utilisateur.service,
      serviceAutre: utilisateur.service_autre,
      perimetreMinisteriel: utilisateur.perimetre_ministeriel,
    };
  }

  async sauvegarder(profil: ProfilUtilisateur): Promise<void> {
    await this.prisma.utilisateur.upsert({
      where: { id: profil.id },
      update: {
        nom: profil.nom,
        prenom: profil.prenom,
        fonction: profil.fonction,
        service: profil.service,
        service_autre: profil.serviceAutre,
        perimetre_ministeriel: profil.perimetreMinisteriel,
        date_modification: new Date(),
      },
      create: {
        id: profil.id,
        nom: profil.nom,
        prenom: profil.prenom,
        email: profil.email,
        fonction: profil.fonction,
        service: profil.service,
        service_autre: profil.serviceAutre,
        perimetre_ministeriel: profil.perimetreMinisteriel,
        date_creation: new Date(),
        date_modification: new Date(),
        profilCode: "DITP_ADMIN",
      },
    });
  }
}
