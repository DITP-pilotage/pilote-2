import { DetailsIndicateurs } from "@/server/chantiers/domain/DetailsIndicateurs";
import {
  DetailsIndicateursTerritoireContrat,
  presenterEnDetailsIndicateursTerritoireContrat,
} from "@/server/chantiers/app/contrats/DetailsIndicateursTerritoireContrat";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";

export type DetailsIndicateursContrat = Record<
  Indicateur["id"],
  DetailsIndicateursTerritoireContrat
>;

export const presenterEnDetailsIndicateursContrat = (
  detailsIndicateurs: DetailsIndicateurs,
): DetailsIndicateursContrat => {
  return Object.entries(detailsIndicateurs).reduce((acc, [id, details]) => {
    acc[id] = presenterEnDetailsIndicateursTerritoireContrat(details);
    return acc;
  }, {} as DetailsIndicateursContrat);
};
