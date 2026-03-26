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
    unite,
  } = detailIndicateurDuTerritoire;

  const unitéAffichée =
    unite?.toLocaleLowerCase() === "pourcentage" ? " %" : "";

  return (
    <div>
      <table className="fr-p-0 fr-pb-2w w-full table overflow-hidden bg-white">
        <thead className="bg-dsfr-blue-france-925 bg-none [&_th:first-of-type]:rounded-tl-lg [&_th:last-child]:rounded-tr-lg">
          <tr>
            <th className="fr-py-1v">Territoire</th>
            <th className="fr-py-1v">{detailTerritoireSelectionne.nom}</th>
          </tr>
        </thead>
        <tbody className="[&_tr]:!bg-[unset] [&_td]:leading-5">
          <tr>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 w-36 font-bold">
              Valeur initiale
            </td>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 flex gap-1">
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
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 w-36 font-bold">
              Valeur d'avancement
            </td>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 flex gap-1 [&_span:nth-of-type(2)]:text-[10px]">
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
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 w-36 font-bold">
              {"Cible " + new Date().getFullYear().toString()}
            </td>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 flex gap-1 [&_span:nth-of-type(2)]:text-[10px]">
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
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 w-36 font-bold">
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
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 w-36 font-bold">
              Cible 2026
            </td>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 flex gap-1 [&_span:nth-of-type(2)]:text-[10px]">
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
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 w-36 font-bold">
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
    </div>
  );
};

export default IndicateurBlocIndicateurTuile;
