import { asClass } from "awilix";
import type { PrismaActiviteComptesQuery } from "@/server/gestion-utilisateur/infrastructure/queries/PrismaActiviteComptesQuery";
import type { PrismaUtilisateursQuery } from "@/server/gestion-utilisateur/infrastructure/queries/PrismaUtilisateursQuery";
import type { RecupererChantiersApplicablesParTerritoiresQuery } from "@/server/chantiers/infrastructure/queries/RecupererChantiersApplicablesParTerritoiresQuery";
import type { RecupererMesuresIndicateurParPeriodeQuery } from "@/server/chantiers/infrastructure/queries/RecupererMesuresIndicateurParPeriodeQuery";
import type { RecupererEvenementsVAParPeriodeQuery } from "@/server/indicateur-territoire-valeur-evenement/infrastructure/queries/RecupererEvenementsVAParPeriodeQuery";
import { defineModule } from "@/server/module-system";
import { ActiviteComptesGateway } from "./domain/ports/ActiviteComptesGateway";
import { CoordinateurGateway } from "./domain/ports/CoordinateurGateway";
import { RapportRepository } from "./domain/ports/RapportRepository";
import { EnvoieEmailService } from "./domain/ports/EnvoieEmailService";
import { ChantierGateway } from "./domain/ports/ChantierGateway";
import { ActiviteIndicateurGateway } from "./domain/ports/ActiviteVAGateway";
import { GestionUtilisateurActiviteComptesGateway } from "./infrastructure/adapters/GestionUtilisateurActiviteComptesGateway";
import { GestionUtilisateurCoordinateurGateway } from "./infrastructure/adapters/GestionUtilisateurCoordinateurGateway";
import { PrismaRapportRepository } from "./infrastructure/adapters/PrismaRapportRepository";
import { BrevoEnvoieEmailService } from "./infrastructure/adapters/BrevoEnvoieEmailService";
import { ChantiersChantierGateway } from "./infrastructure/adapters/ChantiersChantierGateway";
import { IndicateurActiviteGateway } from "./infrastructure/adapters/IndicateurActiviteGateway";
import { ProduireRapportsHebdomadairesUseCase } from "./usecases/ProduireRapportsHebdomadairesUseCase";
import { EnvoyerRapportsHebdomadairesUseCase } from "./usecases/EnvoyerRapportsHebdomadairesUseCase";
import { ListerRapportsHebdomadairesQuery } from "./queries/ListerRapportsHebdomadairesQuery";
import { RecupererRapportHebdomadaireQuery } from "./queries/RecupererRapportHebdomadaireQuery";

type RapportsHebdomadairesExports = Record<string, never>;

type RapportsHebdomadairesCradle = RapportsHebdomadairesExports & {
  activiteComptesQuery: PrismaActiviteComptesQuery;
  utilisateursQuery: PrismaUtilisateursQuery;
  recupererChantiersQuery: RecupererChantiersApplicablesParTerritoiresQuery;
  mesuresIndicateurQuery: RecupererMesuresIndicateurParPeriodeQuery;
  evenementsVAQuery: RecupererEvenementsVAParPeriodeQuery;
  activiteComptesGateway: ActiviteComptesGateway;
  coordinateurGateway: CoordinateurGateway;
  rapportRepository: RapportRepository;
  envoieEmailService: EnvoieEmailService;
  chantierGateway: ChantierGateway;
  activiteIndicateurGateway: ActiviteIndicateurGateway;
  produireRapportsHebdomadairesUseCase: ProduireRapportsHebdomadairesUseCase;
  envoyerRapportsHebdomadairesUseCase: EnvoyerRapportsHebdomadairesUseCase;
  listerRapportsHebdomadairesQuery: ListerRapportsHebdomadairesQuery;
  recupererRapportHebdomadaireQuery: RecupererRapportHebdomadaireQuery;
};

export type RapportsHebdomadairesDependencies = RapportsHebdomadairesCradle;

export const rapportsHebdomadairesModule = defineModule<
  "rapportsHebdomadaires",
  RapportsHebdomadairesExports,
  RapportsHebdomadairesCradle
>({
  name: "rapportsHebdomadaires",
  imports: [
    "shared",
    "gestionUtilisateur",
    "chantiers",
    "indicateurTerritoireValeurEvenement",
  ],
  exports: [],
  register: (container) => {
    container.register({
      activiteComptesGateway: asClass(GestionUtilisateurActiviteComptesGateway),
      coordinateurGateway: asClass(GestionUtilisateurCoordinateurGateway),
      rapportRepository: asClass(PrismaRapportRepository),
      envoieEmailService: asClass(BrevoEnvoieEmailService),
      chantierGateway: asClass(ChantiersChantierGateway),
      activiteIndicateurGateway: asClass(IndicateurActiviteGateway),
      produireRapportsHebdomadairesUseCase: asClass(
        ProduireRapportsHebdomadairesUseCase,
      ),
      envoyerRapportsHebdomadairesUseCase: asClass(
        EnvoyerRapportsHebdomadairesUseCase,
      ),
      listerRapportsHebdomadairesQuery: asClass(
        ListerRapportsHebdomadairesQuery,
      ),
      recupererRapportHebdomadaireQuery: asClass(
        RecupererRapportHebdomadaireQuery,
      ),
    });
  },
});
