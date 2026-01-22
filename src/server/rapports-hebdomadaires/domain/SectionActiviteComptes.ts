import { CompteActivite } from "./CompteActivite";

export type SectionActiviteComptes = {
  readonly comptesCreés: readonly CompteActivite[];
  readonly comptesDésactivés: readonly CompteActivite[];
};
