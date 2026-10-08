import { GestionContenuRepository } from "@/server/gestion-contenu/domain/ports/GestionContenuRepository";
import { PrismaGestionContenuRepository } from "@/server/gestion-contenu/infrastructure/adapters/PrismaGestionContenuRepository";
import { ModifierFeatureFlipUseCase } from "@/server/gestion-contenu/usecases/ModifierFeatureFlipUseCase";
import { ModifierMessageInformationUseCase } from "@/server/gestion-contenu/usecases/ModifierMessageInformationUseCase";
import { RecupererFeatureFlipsUseCase } from "@/server/gestion-contenu/usecases/RecupererFeatureFlipsUseCase";
import { RecupererToutesLesVariablesContenuUseCase } from "@/server/gestion-contenu/usecases/RecupererToutesLesVariablesContenuUseCase";
import { RécupérerMessageInformationUseCase } from "@/server/gestion-contenu/usecases/RécupérerMessageInformationUseCase";
import {
  defineModule,
  type ExtractScope,
  type VerifyCradle,
} from "@/server/module-system";

type GestionContenuExports = {
  recupererToutesLesVariablesContenuUseCase: RecupererToutesLesVariablesContenuUseCase;
};

type GestionContenuCradle = GestionContenuExports & {
  gestionContenuRepository: GestionContenuRepository;
  récupérerMessageInformationUseCase: RécupérerMessageInformationUseCase;
  modifierMessageInformationUseCase: ModifierMessageInformationUseCase;
  modifierFeatureFlipUseCase: ModifierFeatureFlipUseCase;
  recupererFeatureFlipsUseCase: RecupererFeatureFlipsUseCase;
};

export const gestionContenuModule = defineModule<
  GestionContenuExports,
  GestionContenuCradle
>()({
  name: "gestionContenu",
  imports: ["framework"],
  exports: ["recupererToutesLesVariablesContenuUseCase"],
  register: (container, { asModuleClass }) => {
    container.register({
      gestionContenuRepository: asModuleClass(
        PrismaGestionContenuRepository,
      ).scoped(),
      récupérerMessageInformationUseCase: asModuleClass(
        RécupérerMessageInformationUseCase,
      ).scoped(),
      modifierMessageInformationUseCase: asModuleClass(
        ModifierMessageInformationUseCase,
      ).scoped(),
      modifierFeatureFlipUseCase: asModuleClass(
        ModifierFeatureFlipUseCase,
      ).scoped(),
      recupererFeatureFlipsUseCase: asModuleClass(
        RecupererFeatureFlipsUseCase,
      ).scoped(),
      recupererToutesLesVariablesContenuUseCase: asModuleClass(
        RecupererToutesLesVariablesContenuUseCase,
      ).scoped(),
    } satisfies VerifyCradle<GestionContenuCradle>);
  },
});

export type { GestionContenuExports };

type Scope = ExtractScope<typeof gestionContenuModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;
