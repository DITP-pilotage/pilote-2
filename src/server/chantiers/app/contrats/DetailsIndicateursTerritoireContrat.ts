import { CodeInsee } from "@/server/domain/territoire/Territoire.interface";
import {
  DetailsIndicateur,
  DetailsIndicateurTerritoire,
} from "@/server/chantiers/domain/DetailsIndicateurs";

export type DetailsIndicateursTerritoireContrat = Record<
  CodeInsee,
  DetailsIndicateur
>;

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
        proposition: detailsTerritoire.proposition
          ? {
              ...detailsTerritoire.proposition,
              dateValeurAvancement:
                detailsTerritoire.proposition.dateValeurAvancement,
            }
          : null,
        propositionStatutTerritoire:
          detailsTerritoire.propositionStatutTerritoire,
        propositionStatutDirectionProjet:
          detailsTerritoire.propositionStatutDirectionProjet,
        unite: detailsTerritoire.unite,
        estApplicable: detailsTerritoire.estApplicable,
        dateImport: detailsTerritoire.dateImport,
        ponderation: detailsTerritoire.ponderation,
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
