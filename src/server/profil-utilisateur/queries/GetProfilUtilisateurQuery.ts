import { NotFoundError } from "@/server/app/error-boundary/not-found-error";
import type { Inject } from "@/server/profil-utilisateur/module";

type ProfilUtilisateurViewModel = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  fonction: string | null;
  service: string | null;
  serviceAutre: string | null;
  perimetreMinisteriel: string | null;
  dateModification: string;
};

export class GetProfilUtilisateurQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  get prisma() {
    return this.deps.prisma.getInstance();
  }

  async run(utilisateurId: string): Promise<ProfilUtilisateurViewModel> {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        fonction: true,
        service: true,
        service_autre: true,
        perimetre_ministeriel: true,
        date_modification: true,
      },
    });

    if (!utilisateur) {
      throw new NotFoundError("Utilisateur non trouvé");
    }

    return {
      id: utilisateur.id,
      prenom: utilisateur.prenom,
      nom: utilisateur.nom,
      email: utilisateur.email,
      fonction: utilisateur.fonction,
      service: utilisateur.service,
      serviceAutre: utilisateur.service_autre,
      perimetreMinisteriel: utilisateur.perimetre_ministeriel,
      dateModification: utilisateur.date_modification.toISOString(),
    };
  }
}
