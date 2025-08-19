import { DetailsIndicateurs } from "@/server/chantiers/domain/DetailsIndicateurs";
import {
  DétailsIndicateurs,
  DétailsIndicateurTerritoire,
} from "@/server/domain/indicateur/DétailsIndicateur.interface";

export type DetailsIndicateursContrat = DétailsIndicateurs;

export const presenterEnDetailsIndicateursContrat = (
  detailsIndicateurs: DetailsIndicateurs,
): DetailsIndicateursContrat => {
  return Object.entries(detailsIndicateurs).reduce((acc, [id, details]) => {
    acc[id] = Object.entries(details).reduce(
      (accTerritoire, [codeInsee, detailsTerritoire]) => {
        accTerritoire[codeInsee] = {
          codeInsee: detailsTerritoire.codeInsee,
          valeurInitiale: detailsTerritoire.valeurInitiale,
          dateValeurInitiale: detailsTerritoire.dateValeurInitiale,
          historiquesValeurs: detailsTerritoire.historiquesValeurs,
          valeurAvancementMandat: detailsTerritoire.valeurAvancementMandat,
          valeurAvancement: detailsTerritoire.valeurAvancement,
          dateValeurAvancement: detailsTerritoire.dateValeurAvancement,
          dateValeurAvancementMandat:
            detailsTerritoire.dateValeurAvancementMandat,
          valeurCible: detailsTerritoire.valeurCible,
          dateValeurCible: detailsTerritoire.dateValeurCible,
          valeurCibleAnnuelle: detailsTerritoire.valeurCibleAnnuelle,
          dateValeurCibleAnnuelle: detailsTerritoire.dateValeurCibleAnnuelle,
          avancement: detailsTerritoire.avancement,
          proposition: detailsTerritoire.proposition,
          propositionStatutTerritoire:
            detailsTerritoire.propositionStatutTerritoire,
          propositionStatutDirectionProjet:
            detailsTerritoire.propositionStatutDirectionProjet,
          unité: detailsTerritoire.unite,
          est_applicable: detailsTerritoire.estApplicable,
          dateImport: detailsTerritoire.dateImport,
          pondération: detailsTerritoire.ponderation,
          prochaineDateValeurAvancement:
            detailsTerritoire.prochaineDateValeurAvancement,
          prochaineDateMaj: detailsTerritoire.prochaineDateMaj,
          prochaineDateMajJours: detailsTerritoire.prochaineDateMajJours,
          estAJour: detailsTerritoire.estAJour,
          tendance: detailsTerritoire.tendance,
          listeValeursCiblesAnnuelles:
            detailsTerritoire.listeValeursCiblesAnnuelles,
        };
        return accTerritoire;
      },
      {} as DétailsIndicateurTerritoire,
    );
    return acc;
  }, {} as DetailsIndicateursContrat);
};
