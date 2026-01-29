import { asClass, AwilixContainer } from "awilix";
import { InitialDependencies } from "@/server/InitialDependencies";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { EmailManager } from "@/server/infrastructure/email-manager";
import { PrismaActiviteComptesQuery } from "@/server/gestion-utilisateur/infrastructure/queries/PrismaActiviteComptesQuery";
import { PrismaUtilisateursQuery } from "@/server/gestion-utilisateur/infrastructure/queries/PrismaUtilisateursQuery";
import { RecupererIndicateursParChantiersQuery } from "@/server/chantiers/infrastructure/queries/RecupererIndicateursParChantiersQuery";
import { RecupererEvenementsVAParPeriodeQuery } from "@/server/indicateur-territoire-valeur-evenement/infrastructure/queries/RecupererEvenementsVAParPeriodeQuery";
import { RecupererTerritoiresQuery } from "@/server/indicateur-territoire-valeur-evenement/infrastructure/queries/RecupererTerritoiresQuery";

import { ActiviteComptesGateway } from "./domain/ports/ActiviteComptesGateway";
import { CoordinateurGateway } from "./domain/ports/CoordinateurGateway";
import { RapportRepository } from "./domain/ports/RapportRepository";
import { EnvoieEmailService } from "./domain/ports/EnvoieEmailService";
import { ChantierGateway } from "./domain/ports/ChantierGateway";
import { ActiviteVAGateway } from "./domain/ports/ActiviteVAGateway";

import { GestionUtilisateurActiviteComptesGateway } from "./infrastructure/adapters/GestionUtilisateurActiviteComptesGateway";
import { GestionUtilisateurCoordinateurGateway } from "./infrastructure/adapters/GestionUtilisateurCoordinateurGateway";
import { PrismaRapportRepository } from "./infrastructure/adapters/PrismaRapportRepository";
import { BrevoEnvoieEmailService } from "./infrastructure/adapters/BrevoEnvoieEmailService";
import { ChantiersChantierGateway } from "./infrastructure/adapters/ChantiersChantierGateway";
import { IndicateurActiviteVAGateway } from "./infrastructure/adapters/IndicateurActiviteVAGateway";

import { ProduireRapportsHebdomadairesUseCase } from "./usecases/ProduireRapportsHebdomadairesUseCase";
import { EnvoyerRapportsHebdomadairesUseCase } from "./usecases/EnvoyerRapportsHebdomadairesUseCase";

export type RapportsHebdomadairesDependencies = {
  activiteComptesQuery: PrismaActiviteComptesQuery;
  utilisateursQuery: PrismaUtilisateursQuery;
  recupererIndicateursQuery: RecupererIndicateursParChantiersQuery;
  evenementsVAQuery: RecupererEvenementsVAParPeriodeQuery;
  territoiresQuery: RecupererTerritoiresQuery;
  activiteComptesGateway: ActiviteComptesGateway;
  coordinateurGateway: CoordinateurGateway;
  rapportRepository: RapportRepository;
  envoieEmailService: EnvoieEmailService;
  chantierGateway: ChantierGateway;
  activiteVAGateway: ActiviteVAGateway;
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
      recupererIndicateursQuery: asClass(RecupererIndicateursParChantiersQuery),
      evenementsVAQuery: asClass(RecupererEvenementsVAParPeriodeQuery),
      territoiresQuery: asClass(RecupererTerritoiresQuery),
      activiteComptesGateway: asClass(GestionUtilisateurActiviteComptesGateway),
      coordinateurGateway: asClass(GestionUtilisateurCoordinateurGateway),
      rapportRepository: asClass(PrismaRapportRepository),
      envoieEmailService: asClass(BrevoEnvoieEmailService),
      chantierGateway: asClass(ChantiersChantierGateway),
      activiteVAGateway: asClass(IndicateurActiviteVAGateway),
      produireRapportsHebdomadairesUseCase: asClass(
        ProduireRapportsHebdomadairesUseCase,
      ),
      envoyerRapportsHebdomadairesUseCase: asClass(
        EnvoyerRapportsHebdomadairesUseCase,
      ),
    });
};
