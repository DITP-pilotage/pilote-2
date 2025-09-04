import IndicateurBlocIndicateurTuileStyled from "@/components/_commons/IndicateursChantier/Bloc/IndicateurBlocIndicateurTuile.styled";
import BarreDeProgression from "@/components/_commons/BarreDeProgression/BarreDeProgression";
import { formaterDate } from "@/client/utils/date/date";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";
import { useTerritoireSelectionne } from "@/components/PageChantier/PageChantierServerSideContext";

const IndicateurBlocIndicateurTuile = () => {
  const { detailIndicateurDuTerritoire } = useBlocIndicateurContext();
  const detailTerritoireSelectionne = useTerritoireSelectionne();

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
    unité,
  } = detailIndicateurDuTerritoire;

  const unitéAffichée =
    unité?.toLocaleLowerCase() === "pourcentage" ? " %" : "";

  return (
    <IndicateurBlocIndicateurTuileStyled>
      <table className="fr-p-0 fr-pb-2w w-full">
        <thead>
          <tr>
            <th className="fr-py-1v">Territoire</th>
            <th className="fr-py-1v">{detailTerritoireSelectionne.nom}</th>
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
              {dateValeurInitiale !== null ? (
                <span className="texte-gris">
                  ({formaterDate(dateValeurInitiale, "MM/YYYY")})
                </span>
              ) : null}
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
              {dateValeurAvancement !== null ? (
                <span className="texte-gris">
                  ({formaterDate(dateValeurAvancement, "MM/YYYY")})
                </span>
              ) : null}
            </td>
          </tr>
          <tr>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 libellés">
              {"Cible " + new Date().getFullYear().toString()}
            </td>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 indicateur-bloc--avec-date">
              <span>
                {valeurCibleAnnuelle !== null &&
                valeurCibleAnnuelle !== undefined
                  ? valeurCibleAnnuelle?.toLocaleString() + unitéAffichée
                  : ""}
              </span>
              {dateValeurCible !== null ? (
                <span className="texte-gris">
                  ({formaterDate(dateValeurCibleAnnuelle, "MM/YYYY")})
                </span>
              ) : null}
            </td>
          </tr>
          <tr>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 libellés">
              {"Avancement " + new Date().getFullYear().toString()}
            </td>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0">
              <BarreDeProgression
                afficherTexte
                fond="gris-clair"
                positionTexte="côté"
                taille="md"
                valeur={avancement.annuel}
                variante="secondaire"
              />
            </td>
          </tr>
          <tr>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 libellés">Cible 2026</td>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 indicateur-bloc--avec-date">
              <span>
                {Boolean(valeurCible)
                  ? valeurCible?.toLocaleString() + unitéAffichée
                  : ""}
              </span>
              {dateValeurCible !== null ? (
                <span className="texte-gris">
                  ({formaterDate(dateValeurCible, "MM/YYYY")})
                </span>
              ) : null}
            </td>
          </tr>
          <tr>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 libellés">
              Avancement 2026
            </td>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0">
              <BarreDeProgression
                afficherTexte
                fond="gris-clair"
                positionTexte="côté"
                taille="md"
                valeur={avancement.global}
                variante="primaire"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </IndicateurBlocIndicateurTuileStyled>
  );
};

export default IndicateurBlocIndicateurTuile;
