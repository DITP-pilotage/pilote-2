import { FunctionComponent } from "react";
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
    <div>
      <table className="fr-p-0 fr-pb-2w table overflow-hidden bg-white">
        <thead className="bg-dsfr-blue-france-925 bg-none">
          <tr>
            <th className="fr-py-1v rounded-tl-lg">Territoire</th>
            <th className="fr-py-1v rounded-tr-lg">
              {indicateurDétailsParTerritoire.territoireNom}
            </th>
          </tr>
        </thead>
        <tbody className="[&_tr]:!bg-[unset]">
          <tr>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 w-36 font-bold leading-5 min-h-8 align-top">
              Valeur initiale
            </td>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 flex gap-1 leading-5 min-h-8 align-top">
              <span>
                {valeurInitiale !== null && valeurInitiale !== undefined
                  ? valeurInitiale?.toLocaleString() + unitéAffichée
                  : ""}
              </span>
              {dateValeurInitiale !== null && (
                <span className="!text-dsfr-mention-grey text-[10px]">
                  ({formaterDate(dateValeurInitiale, "MM/YYYY")})
                </span>
              )}
            </td>
          </tr>
          <tr>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 w-36 font-bold leading-5 min-h-8 align-top">
              Valeur d'avancement
            </td>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 flex gap-1 leading-5 min-h-8 align-top">
              <span>
                {valeurAvancement !== null && valeurAvancement !== undefined
                  ? valeurAvancement?.toLocaleString() + unitéAffichée
                  : ""}
              </span>
              {dateValeurAvancement !== null && (
                <span className="!text-dsfr-mention-grey text-[10px]">
                  ({formaterDate(dateValeurAvancement, "MM/YYYY")})
                </span>
              )}
            </td>
          </tr>
          <tr>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 w-36 font-bold leading-5 min-h-8 align-top">
              {typeDeRéforme === "chantier"
                ? "Cible " + new Date().getFullYear().toString()
                : "Cible"}
            </td>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 flex gap-1 leading-5 min-h-8 align-top">
              <span>
                {valeurCibleAnnuelle !== null &&
                valeurCibleAnnuelle !== undefined
                  ? valeurCibleAnnuelle?.toLocaleString() + unitéAffichée
                  : ""}
              </span>
              {dateValeurCible !== null && (
                <span className="!text-dsfr-mention-grey text-[10px]">
                  ({formaterDate(dateValeurCibleAnnuelle, "MM/YYYY")})
                </span>
              )}
            </td>
          </tr>
          <tr>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 w-36 font-bold leading-5 min-h-8 align-top">
              {typeDeRéforme === "chantier"
                ? "Avancement " + new Date().getFullYear().toString()
                : "Avancement"}
            </td>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 leading-5 min-h-8 align-top">
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
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 w-36 font-bold leading-5 min-h-8 align-top">
              {typeDeRéforme === "chantier" ? "Cible 2026" : "Cible"}
            </td>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 flex gap-1 leading-5 min-h-8 align-top">
              <span>
                {Boolean(valeurCible)
                  ? valeurCible?.toLocaleString() + unitéAffichée
                  : ""}
              </span>
              {dateValeurCible !== null && (
                <span className="!text-dsfr-mention-grey text-[10px]">
                  ({formaterDate(dateValeurCible, "MM/YYYY")})
                </span>
              )}
            </td>
          </tr>
          <tr>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 w-36 font-bold leading-5 min-h-8 align-top">
              {typeDeRéforme === "chantier" ? "Avancement 2026" : "Avancement"}
            </td>
            <td className="fr-pt-1w fr-pb-0 fr-pr-0 leading-5 min-h-8 align-top">
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
    </div>
  );
};

export default IndicateurBlocIndicateurTuile;
