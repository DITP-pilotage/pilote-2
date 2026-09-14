import type { Inject } from "@/server/gestion-utilisateur/module";
import logger from "@/server/infrastructure/Logger";

export class MettreAJourLaDerniereConnexionUseCase {
  constructor(private readonly dependencies: Inject<"prisma">) {}

  async execute({
    email,
    date,
    provider,
  }: {
    email: string;
    date: Date;
    provider: string;
  }): Promise<void> {
    const prisma = this.dependencies.prisma.getInstance();

    try {
      await prisma.utilisateur.update({
        where: { email: email.trim().toLowerCase() },
        data: {
          date_derniere_connexion: date,
          dernier_provider_connexion: provider,
          // Se connecter remet le compteur d'inactivité à zéro : les relances
          // déjà envoyées et la désactivation programmée n'ont plus lieu d'être.
          date_premiere_relance_desactivation: null,
          date_deuxieme_relance_desactivation: null,
          date_desactivation_programee: null,
        },
      });
    } catch (error) {
      // Tracer la connexion est un effet de bord de l'authentification, pas une
      // condition de celle-ci : laisser remonter l'erreur depuis le callback
      // `jwt` refuserait l'accès à un utilisateur pourtant légitime.
      logger.warn(
        {
          categorie: "auth",
          source: "MettreAJourLaDerniereConnexionUseCase",
          provider,
          errorMessage: (error as Error).message,
        },
        "Impossible de tracer la dernière connexion",
      );
    }
  }
}
