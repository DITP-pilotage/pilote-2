import { DetailsIndicateurs } from "@/server/chantiers/domain/DetailsIndicateurs";
import { DétailsIndicateurs } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import { presenterEnDetailsIndicateursTerritoireContrat } from "@/server/chantiers/app/contrats/DetailsIndicateursTerritoireContrat";

export type DetailsIndicateursContrat = DétailsIndicateurs;

export const presenterEnDetailsIndicateursContrat = (
  detailsIndicateurs: DetailsIndicateurs,
  datesDerniersImports: Map<string, Date | null>,
): DetailsIndicateursContrat => {
  return Object.entries(detailsIndicateurs).reduce((acc, [id, details]) => {
    acc[id] = presenterEnDetailsIndicateursTerritoireContrat(
      details,
      datesDerniersImports.get(id) ?? null,
    );
    return acc;
  }, {} as DetailsIndicateursContrat);
};
