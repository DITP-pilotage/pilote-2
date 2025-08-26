import { DétailsIndicateurTerritoire } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import { DetailsIndicateurTerritoire } from "@/server/chantiers/domain/DetailsIndicateurs";

export type DetailsIndicateursTerritoireContrat = DétailsIndicateurTerritoire;

export const presenterEnDetailsIndicateursTerritoireContrat = (
  detailsIndicateurs: DetailsIndicateurTerritoire,
): DetailsIndicateursTerritoireContrat => {
  return Object.entries(detailsIndicateurs).reduce(
    (acc, [codeInsee, detailsTerritoire]) => {
      acc[codeInsee] = {
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
      return acc;
    },
    {} as DetailsIndicateursTerritoireContrat,
  );
};
