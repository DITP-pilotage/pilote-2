import type { Inject } from "@/server/gestion-utilisateur/module";

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
  }
}
