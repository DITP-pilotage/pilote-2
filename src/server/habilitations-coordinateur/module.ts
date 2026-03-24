import { AjouterLesChantierAuxHabilitationsHandler } from "@/server/habilitations-coordinateur/handlers/AjouterLesChantierAuxHabilitationsHandler";
import { RecupererLesChantiersTerritorialisesQuery } from "@/server/habilitations-coordinateur/queries/RecupererLesChantiersTerritorialisesQuery";
import {
  defineModule,
  type ExtractScope,
  type NoExports,
} from "@/server/module-system";

type HabilitationsCoordinateurCradle = {
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
    } satisfies Record<keyof HabilitationsCoordinateurCradle, unknown>);
  },
});

type Scope = ExtractScope<typeof habilitationsCoordinateurModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;
