import { asClass } from "awilix";
import { PrismaIndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/infrastructure/PrismaIndicateurTerritoireValeurEvenementRepository";
import { PrismaMesureIndicateurRepository } from "@/server/indicateur-territoire-valeur-evenement/infrastructure/PrismaMesureIndicateurRepository";
import { MesureIndicateurRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/MesureIndicateurRepository";
import { defineModule } from "@/server/module-system";
import { IndicateurTerritoireValeurEvenementRepository } from "./domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { CreerPropositionValeurAvancementUseCase } from "./usecases/CreerPropositionValeurAvancementUseCase";
import { AccepterPropositionValeurAvancementUseCase } from "./usecases/AccepterPropositionValeurAvancementUseCase";
import { RefuserPropositionValeurAvancementUseCase } from "./usecases/RefuserPropositionValeurAvancementUseCase";
import { ModifierPropositionValeurAvancementUseCase } from "./usecases/ModifierPropositionValeurAvancementUseCase";
import { SupprimerPropositionValeurAvancementUseCase } from "./usecases/SupprimerPropositionValeurAvancementUseCase";
import { AccuserReceptionPropositionValeurUseCase } from "./usecases/AccuserReceptionPropositionValeurUseCase";
import { AccepterAvecModificationPropositionValeurAvancementUseCase } from "./usecases/AccepterAvecModificationPropositionValeurAvancementUseCase";
import { RecupererHistoriqueIndicateurTerritoireValeurEvenementUseCase } from "./usecases/RecupererHistoriqueIndicateurTerritoireValeurEvenementUseCase";
import { IndicateurRepository } from "./domain/ports/IndicateurRepository";
import { PrismaIndicateurRepository } from "./infrastructure/PrismaIndicateurRepository";
import { EnvoieEmailService } from "./domain/ports/EnvoieEmailService";
import { BrevoEnvoieEmailService } from "./infrastructure/BrevoEnvoieEmailService";
import { UtilisateurRepository } from "./domain/ports/UtilisateurRepository";
import { PrismaUtilisateurRepository } from "./infrastructure/PrismaUtilisateurRepository";
import { RecupererEvenementsVAParPeriodeQuery } from "./infrastructure/queries/RecupererEvenementsVAParPeriodeQuery";

type IndicateurTerritoireValeurEvenementExports = {
  indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;
  evenementsVAQuery: RecupererEvenementsVAParPeriodeQuery;
};

type IndicateurTerritoireValeurEvenementCradle =
  IndicateurTerritoireValeurEvenementExports & {
    indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;
    mesureIndicateurRepository: MesureIndicateurRepository;
    indicateurRepository: IndicateurRepository;
    utilisateurRepository: UtilisateurRepository;
    envoieEmailService: EnvoieEmailService;
    creerPropositionValeurAvancementUseCase: CreerPropositionValeurAvancementUseCase;
    accepterPropositionValeurAvancementUseCase: AccepterPropositionValeurAvancementUseCase;
    refuserPropositionValeurAvancementUseCase: RefuserPropositionValeurAvancementUseCase;
    accuserReceptionPropositionValeurUseCase: AccuserReceptionPropositionValeurUseCase;
    modifierPropositionValeurAvancementUseCase: ModifierPropositionValeurAvancementUseCase;
    supprimerPropositionValeurAvancementUseCase: SupprimerPropositionValeurAvancementUseCase;
    accepterAvecModificationPropositionValeurAvancementUseCase: AccepterAvecModificationPropositionValeurAvancementUseCase;
    recupererHistoriqueIndicateurTerritoireValeurEvenementUseCase: RecupererHistoriqueIndicateurTerritoireValeurEvenementUseCase;
  };

export const indicateurTerritoireValeurEvenementModule = defineModule<
  IndicateurTerritoireValeurEvenementExports,
  IndicateurTerritoireValeurEvenementCradle
>()({
  name: "indicateurTerritoireValeurEvenement",
  imports: ["shared"],
  exports: [
    "indicateurTerritoireValeurEvenementRepository",
    "evenementsVAQuery",
  ],
  register: (container) => {
    container.register({
      indicateurTerritoireValeurEvenementRepository: asClass(
        PrismaIndicateurTerritoireValeurEvenementRepository,
      ),
      mesureIndicateurRepository: asClass(PrismaMesureIndicateurRepository),
      indicateurRepository: asClass(PrismaIndicateurRepository),
      utilisateurRepository: asClass(PrismaUtilisateurRepository),
      envoieEmailService: asClass(BrevoEnvoieEmailService),
      creerPropositionValeurAvancementUseCase: asClass(
        CreerPropositionValeurAvancementUseCase,
      ),
      accepterPropositionValeurAvancementUseCase: asClass(
        AccepterPropositionValeurAvancementUseCase,
      ),
      refuserPropositionValeurAvancementUseCase: asClass(
        RefuserPropositionValeurAvancementUseCase,
      ),
      modifierPropositionValeurAvancementUseCase: asClass(
        ModifierPropositionValeurAvancementUseCase,
      ),
      supprimerPropositionValeurAvancementUseCase: asClass(
        SupprimerPropositionValeurAvancementUseCase,
      ),
      accuserReceptionPropositionValeurUseCase: asClass(
        AccuserReceptionPropositionValeurUseCase,
      ),
      accepterAvecModificationPropositionValeurAvancementUseCase: asClass(
        AccepterAvecModificationPropositionValeurAvancementUseCase,
      ),
      recupererHistoriqueIndicateurTerritoireValeurEvenementUseCase: asClass(
        RecupererHistoriqueIndicateurTerritoireValeurEvenementUseCase,
      ),
      evenementsVAQuery: asClass(RecupererEvenementsVAParPeriodeQuery),
    });
  },
});
