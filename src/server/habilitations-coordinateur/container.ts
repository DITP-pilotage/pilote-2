import { asClass, AwilixContainer } from "awilix";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { AjouterLesChantierAuxHabilitationsHandler } from "@/server/habilitations-coordinateur/handlers/AjouterLesChantierAuxHabilitationsHandler";
import { RecupererLesChantiersTerritorialisesQuery } from "@/server/habilitations-coordinateur/queries/RecupererLesChantiersTerritorialisesQuery";

export type HabilitationsCoordinateurDependencies = {
  recupererLesChantiersTerritorialisesQuery: RecupererLesChantiersTerritorialisesQuery;
  ajouterLesChantierAuxHabilitationsHandler: AjouterLesChantierAuxHabilitationsHandler;
};

export const getHabilitationsCoordinateurContainer = (
  initialContainer: AwilixContainer<{ prisma: PrismaPilote }>,
): AwilixContainer<HabilitationsCoordinateurDependencies> => {
  return initialContainer
    .createScope<HabilitationsCoordinateurDependencies>()
    .register({
      recupererLesChantiersTerritorialisesQuery: asClass(
        RecupererLesChantiersTerritorialisesQuery,
      ),
      ajouterLesChantierAuxHabilitationsHandler: asClass(
        AjouterLesChantierAuxHabilitationsHandler,
      ),
    });
};
