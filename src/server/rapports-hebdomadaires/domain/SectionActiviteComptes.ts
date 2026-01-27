import { CompteActivite } from "./CompteActivite";

export type SectionActiviteComptes = {
  readonly comptesCrees: readonly CompteActivite[];
  readonly comptesDesactives: readonly CompteActivite[];
};
