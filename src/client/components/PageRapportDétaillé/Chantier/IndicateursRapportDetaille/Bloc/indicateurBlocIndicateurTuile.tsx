import { FunctionComponent } from "react";
import IndicateurBlocIndicateurTuileStyled from "@/components/PageRapportDétaillé/Chantier/IndicateursRapportDetaille/Bloc/IndicateurBlocIndicateurTuile.styled";
import BarreDeProgression from "@/components/_commons/BarreDeProgression/BarreDeProgression";
import { formaterDate } from "@/client/utils/date/date";
import { IndicateurDétailsParTerritoire } from "@/components/PageRapportDétaillé/Chantier/IndicateursRapportDetaille/Bloc/IndicateurBloc.interface";

interface IndicateurDétailsParTerritoireProps {
  indicateurDétailsParTerritoire: IndicateurDétailsParTerritoire;
  typeDeRéforme: "chantier";
  unité?: string | null;
}

const IndicateurBlocIndicateurTuile: FunctionComponent<
  IndicateurDétailsParTerritoireProps
> = ({ indicateurDétailsParTerritoire, typeDeRéforme, unité }) => {
  const {
    dateValeurInitiale,
    valeurInitiale,
    valeurAvancement,
    valeurCible,
    dateValeurCible,
    dateValeurAvancement,
    avancement,
    dateValeurCibleAnnuelle,
    valeurCibleAnnuelle,
  } = indicateurDétailsParTerritoire.données;
  const unitéAffichée =
    unité?.toLocaleLowerCase() === "pourcentage" ? " %" : "";

  return (
    <IndicateurBlocIndicateurTuileStyled>
      <table className="fr-p-0 fr-pb-2w">
        <thead>
          <tr>
            <th className="fr-py-1v">Territoire</th>
            <th className="fr-py-1v">
              {indicateurDétailsParTerritoire.territoireNom}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 libellés">
              Valeur initiale
            </td>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 indicateur-bloc--avec-date">
              <span>
                {valeurInitiale !== null && valeurInitiale !== undefined
                  ? valeurInitiale?.toLocaleString() + unitéAffichée
                  : ""}
              </span>
              {dateValeurInitiale !== null && (
                <span className="!text-dsfr-mention-grey">
                  ({formaterDate(dateValeurInitiale, "MM/YYYY")})
                </span>
              )}
            </td>
          </tr>
          <tr>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 libellés">
              Valeur d'avancement
            </td>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 indicateur-bloc--avec-date">
              <span>
                {valeurAvancement !== null && valeurAvancement !== undefined
                  ? valeurAvancement?.toLocaleString() + unitéAffichée
                  : ""}
              </span>
              {dateValeurAvancement !== null && (
                <span className="!text-dsfr-mention-grey">
                  ({formaterDate(dateValeurAvancement, "MM/YYYY")})
                </span>
              )}
            </td>
          </tr>
          <tr>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 libellés">
              {typeDeRéforme === "chantier"
                ? "Cible " + new Date().getFullYear().toString()
                : "Cible"}
            </td>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 indicateur-bloc--avec-date">
              <span>
                {valeurCibleAnnuelle !== null &&
                valeurCibleAnnuelle !== undefined
                  ? valeurCibleAnnuelle?.toLocaleString() + unitéAffichée
                  : ""}
              </span>
              {dateValeurCible !== null && (
                <span className="!text-dsfr-mention-grey">
                  ({formaterDate(dateValeurCibleAnnuelle, "MM/YYYY")})
                </span>
              )}
            </td>
          </tr>
          <tr>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 libellés">
              {typeDeRéforme === "chantier"
                ? "Avancement " + new Date().getFullYear().toString()
                : "Avancement"}
            </td>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0">
              <BarreDeProgression
                afficherTexte
                fond="gris-clair"
                positionTexte="côté"
                taille="md"
                valeur={avancement.annuel}
                variante={typeDeRéforme === "chantier" ? "secondaire" : "rose"}
              />
            </td>
          </tr>
          <tr>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 libellés">
              {typeDeRéforme === "chantier" ? "Cible 2026" : "Cible"}
            </td>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 indicateur-bloc--avec-date">
              <span>
                {Boolean(valeurCible)
                  ? valeurCible?.toLocaleString() + unitéAffichée
                  : ""}
              </span>
              {dateValeurCible !== null && (
                <span className="!text-dsfr-mention-grey">
                  ({formaterDate(dateValeurCible, "MM/YYYY")})
                </span>
              )}
            </td>
          </tr>
          <tr>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 libellés">
              {typeDeRéforme === "chantier" ? "Avancement 2026" : "Avancement"}
            </td>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0">
              <BarreDeProgression
                afficherTexte
                fond="gris-clair"
                positionTexte="côté"
                taille="md"
                valeur={avancement.global}
                variante={typeDeRéforme === "chantier" ? "primaire" : "rose"}
              />
            </td>
          </tr>
        </tbody>
      </table>
    </IndicateurBlocIndicateurTuileStyled>
  );
};

export default IndicateurBlocIndicateurTuile;
