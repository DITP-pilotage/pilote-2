import { asClass, AwilixContainer } from "awilix";
import { InitialDependencies } from "@/server/InitialDependencies";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { EmailManager } from "@/server/infrastructure/email-manager";
import { PrismaActiviteComptesQuery } from "@/server/gestion-utilisateur/infrastructure/queries/PrismaActiviteComptesQuery";
import { PrismaUtilisateursQuery } from "@/server/gestion-utilisateur/infrastructure/queries/PrismaUtilisateursQuery";

import { ActiviteComptesGateway } from "./domain/ports/ActiviteComptesGateway";
import { CoordinateurGateway } from "./domain/ports/CoordinateurGateway";
import { RapportRepository } from "./domain/ports/RapportRepository";
import { EnvoieEmailService } from "./domain/ports/EnvoieEmailService";

import { GestionUtilisateurActiviteComptesGateway } from "./infrastructure/adapters/GestionUtilisateurActiviteComptesGateway";
import { GestionUtilisateurCoordinateurGateway } from "./infrastructure/adapters/GestionUtilisateurCoordinateurGateway";
import { PrismaRapportRepository } from "./infrastructure/adapters/PrismaRapportRepository";
import { BrevoEnvoieEmailService } from "./infrastructure/adapters/BrevoEnvoieEmailService";

import { ProduireRapportsHebdomadairesUseCase } from "./usecases/ProduireRapportsHebdomadairesUseCase";
import { EnvoyerRapportsHebdomadairesUseCase } from "./usecases/EnvoyerRapportsHebdomadairesUseCase";

export type RapportsHebdomadairesDependencies = {
  activiteComptesQuery: PrismaActiviteComptesQuery;
  utilisateursQuery: PrismaUtilisateursQuery;
  activiteComptesGateway: ActiviteComptesGateway;
  coordinateurGateway: CoordinateurGateway;
  rapportRepository: RapportRepository;
  envoieEmailService: EnvoieEmailService;
  produireRapportsHebdomadairesUseCase: ProduireRapportsHebdomadairesUseCase;
  envoyerRapportsHebdomadairesUseCase: EnvoyerRapportsHebdomadairesUseCase;
};

export const getRapportsHebdomadairesContainer = (
  initialContainer: AwilixContainer<
    InitialDependencies & { prisma: PrismaPilote; emailManager: EmailManager }
  >,
): AwilixContainer<
  RapportsHebdomadairesDependencies & {
    prisma: PrismaPilote;
    emailManager: EmailManager;
  }
> => {
  return initialContainer
    .createScope<RapportsHebdomadairesDependencies>()
    .register({
      activiteComptesQuery: asClass(PrismaActiviteComptesQuery),
      utilisateursQuery: asClass(PrismaUtilisateursQuery),
      activiteComptesGateway: asClass(GestionUtilisateurActiviteComptesGateway),
      coordinateurGateway: asClass(GestionUtilisateurCoordinateurGateway),
      rapportRepository: asClass(PrismaRapportRepository),
      envoieEmailService: asClass(BrevoEnvoieEmailService),
      produireRapportsHebdomadairesUseCase: asClass(
        ProduireRapportsHebdomadairesUseCase,
      ),
      envoyerRapportsHebdomadairesUseCase: asClass(
        EnvoyerRapportsHebdomadairesUseCase,
      ),
    });
};
