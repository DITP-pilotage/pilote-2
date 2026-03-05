import {
  VARIABLE_CONTENU_DISPONIBLE_ENV,
  VariableContenuDisponibleEnv,
} from "@/server/gestion-contenu/domain/VariableContenuDisponible";
import { RécupérerVariableContenuUseCase } from "@/server/gestion-contenu/usecases/RécupérerVariableContenuUseCase";

export class RecupererToutesLesVariablesContenuUseCase {
  run(): VariableContenuDisponibleEnv {
    const récupérerVariableContenuUseCase =
      new RécupérerVariableContenuUseCase();
    return Object.fromEntries(
      VARIABLE_CONTENU_DISPONIBLE_ENV.map((nomVariable) => [
        nomVariable,
        récupérerVariableContenuUseCase.run({
          nomVariableContenu: nomVariable,
        }),
      ]),
    ) as VariableContenuDisponibleEnv;
  }
}
