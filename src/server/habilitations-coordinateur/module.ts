import { asClass } from "awilix";
import { AjouterLesChantierAuxHabilitationsHandler } from "@/server/habilitations-coordinateur/handlers/AjouterLesChantierAuxHabilitationsHandler";
import { RecupererLesChantiersTerritorialisesQuery } from "@/server/habilitations-coordinateur/queries/RecupererLesChantiersTerritorialisesQuery";
import { defineModule, type NoExports } from "@/server/module-system";

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
  register: (container) => {
    container.register({
      recupererLesChantiersTerritorialisesQuery: asClass(
        RecupererLesChantiersTerritorialisesQuery,
      ),
      ajouterLesChantierAuxHabilitationsHandler: asClass(
        AjouterLesChantierAuxHabilitationsHandler,
      ),
    });
  },
});
