import type { GestionUtilisateurExports } from "@/server/gestion-utilisateur/module";
import type { ChantierExports } from "@/server/chantiers/module";
import type { IndicateurTerritoireValeurEvenementExports } from "@/server/indicateur-territoire-valeur-evenement/module";
import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
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

type RapportsHebdomadairesImports = GestionUtilisateurExports &
  ChantierExports &
  IndicateurTerritoireValeurEvenementExports;

type RapportsHebdomadairesOwnCradle = {
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

type RapportsHebdomadairesCradle = RapportsHebdomadairesOwnCradle &
  RapportsHebdomadairesImports;

export const rapportsHebdomadairesModule = defineModule<
  NoExports,
  RapportsHebdomadairesCradle
>()({
  name: "rapportsHebdomadaires",
  imports: [
    "shared",
    "gestionUtilisateur",
    "chantiers",
    "indicateurTerritoireValeurEvenement",
  ],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      activiteComptesGateway: asModuleClass(
        GestionUtilisateurActiviteComptesGateway,
      ),
      coordinateurGateway: asModuleClass(GestionUtilisateurCoordinateurGateway),
      rapportRepository: asModuleClass(PrismaRapportRepository),
      envoieEmailService: asModuleClass(BrevoEnvoieEmailService),
      chantierGateway: asModuleClass(ChantiersChantierGateway),
      activiteIndicateurGateway: asModuleClass(IndicateurActiviteGateway),
      produireRapportsHebdomadairesUseCase: asModuleClass(
        ProduireRapportsHebdomadairesUseCase,
      ),
      envoyerRapportsHebdomadairesUseCase: asModuleClass(
        EnvoyerRapportsHebdomadairesUseCase,
      ),
      listerRapportsHebdomadairesQuery: asModuleClass(
        ListerRapportsHebdomadairesQuery,
      ),
      recupererRapportHebdomadaireQuery: asModuleClass(
        RecupererRapportHebdomadaireQuery,
      ),
    } satisfies VerifyCradle<RapportsHebdomadairesOwnCradle>);
  },
});

type Scope = ExtractScope<typeof rapportsHebdomadairesModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;
