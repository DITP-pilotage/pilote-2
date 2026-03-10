import {
  VARIABLE_CONTENU_DISPONIBLE_ENV,
  VariableContenuDisponibleEnv,
} from "@/server/gestion-contenu/domain/VariableContenuDisponible";
import { RecupererVariableContenuUseCase } from "@/server/gestion-contenu/usecases/RecupererVariableContenuUseCase";

export class RecupererToutesLesVariablesContenuUseCase {
  run(): VariableContenuDisponibleEnv {
    const recupererVariableContenuUseCase =
      new RecupererVariableContenuUseCase();
    return Object.fromEntries(
      VARIABLE_CONTENU_DISPONIBLE_ENV.map((nomVariable) => [
        nomVariable,
        recupererVariableContenuUseCase.run({
          nomVariableContenu: nomVariable,
        }),
      ]),
    ) as VariableContenuDisponibleEnv;
  }
}
