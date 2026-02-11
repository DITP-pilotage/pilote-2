import { NotFoundError } from "@/server/app/error-boundary/not-found-error";
import { PrismaPilote } from "@/server/db/PrismaPilote";

type Dependencies = {
  prisma: PrismaPilote;
};

type ProfilUtilisateurViewModel = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  fonction: string | null;
  ministere: string | null;
  service: string | null;
  serviceAutre: string | null;
};

export class GetProfilUtilisateurQuery {
  constructor(private readonly deps: Dependencies) {}

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
      prenom: utilisateur.prenom,
      nom: utilisateur.nom,
      email: utilisateur.email,
      fonction: utilisateur.fonction,
      ministere: utilisateur.ministere,
      service: utilisateur.service,
      serviceAutre: utilisateur.service_autre,
    };
  }
}
