import { asClass } from "awilix";
import { AjouterLesChantierAuxHabilitationsHandler } from "@/server/habilitations-coordinateur/handlers/AjouterLesChantierAuxHabilitationsHandler";
import { RecupererLesChantiersTerritorialisesQuery } from "@/server/habilitations-coordinateur/queries/RecupererLesChantiersTerritorialisesQuery";
import { defineModule } from "@/server/module-system";

type HabilitationsCoordinateurExports = Record<string, never>;

type HabilitationsCoordinateurCradle = HabilitationsCoordinateurExports & {
  recupererLesChantiersTerritorialisesQuery: RecupererLesChantiersTerritorialisesQuery;
  ajouterLesChantierAuxHabilitationsHandler: AjouterLesChantierAuxHabilitationsHandler;
};

export type HabilitationsCoordinateurDependencies =
  HabilitationsCoordinateurCradle;

export const habilitationsCoordinateurModule = defineModule<
  HabilitationsCoordinateurExports,
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
