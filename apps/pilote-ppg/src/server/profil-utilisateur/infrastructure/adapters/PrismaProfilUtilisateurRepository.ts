import { ProfilUtilisateurRepository } from "@/server/profil-utilisateur/domain/ports/ProfilUtilisateurRepository";
import { ProfilUtilisateur } from "@/server/profil-utilisateur/domain/ProfilUtilisateur";
import { NotFoundError } from "@/server/app/error-boundary/not-found-error";
import type { Inject } from "@/server/profil-utilisateur/module";

export class PrismaProfilUtilisateurRepository implements ProfilUtilisateurRepository {
  constructor(private readonly deps: Inject<"prisma">) {}

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

  async sauvegarder(params: {
    profil: ProfilUtilisateur;
    auteurId: string;
  }): Promise<void> {
    const { profil, auteurId } = params;
    await this.prisma.utilisateur.upsert({
      where: { id: params.profil.id },
      update: {
        nom: profil.nom,
        prenom: profil.prenom,
        fonction: profil.fonction,
        service: profil.service,
        service_autre: profil.serviceAutre,
        perimetre_ministeriel: profil.perimetreMinisteriel,
        date_modification: new Date(),
        auteur_id_modification: auteurId,
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
        auteur_id_creation: auteurId,
        auteur_id_modification: auteurId,
      },
    });
  }
}
