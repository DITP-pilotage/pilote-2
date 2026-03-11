import { AjouterLesChantierAuxHabilitationsHandler } from "@/server/habilitations-coordinateur/handlers/AjouterLesChantierAuxHabilitationsHandler";
import { RecupererLesChantiersTerritorialisesQuery } from "@/server/habilitations-coordinateur/queries/RecupererLesChantiersTerritorialisesQuery";
import {
  defineModule,
  type ModuleScope,
  type NoExports,
} from "@/server/module-system";

type HabilitationsCoordinateurCradle = NoExports & {
  recupererLesChantiersTerritorialisesQuery: RecupererLesChantiersTerritorialisesQuery;
  ajouterLesChantierAuxHabilitationsHandler: AjouterLesChantierAuxHabilitationsHandler;
};

export const habilitationsCoordinateurModule = defineModule<
  NoExports,
  HabilitationsCoordinateurCradle
>()({
  name: "habilitationsCoordinateur",
  imports: ["shared"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      recupererLesChantiersTerritorialisesQuery: asModuleClass(
        RecupererLesChantiersTerritorialisesQuery,
      ),
      ajouterLesChantierAuxHabilitationsHandler: asModuleClass(
        AjouterLesChantierAuxHabilitationsHandler,
      ),
    });
  },
});

type Scope = ModuleScope<HabilitationsCoordinateurCradle>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;
