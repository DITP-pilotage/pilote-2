import "@gouvfr/dsfr/dist/component/table/table.min.css";
import type { ValeursIndicateurDisplay } from "@/server/albert/Albert";
import { formaterDate } from "@/client/utils/date/date";

const ValeurEtDate = ({
  valeur,
  date,
  unite,
}: {
  valeur: number | null;
  date: string | null;
  unite?: string | null;
}) => {
  if (valeur === null) return <span>—</span>;
  return (
    <span>
      {valeur}
      {unite ? ` ${unite}` : ""}
      {date && (
        <span className="block text-xs text-gray-500">
          {formaterDate(date, "MM/YYYY")}
        </span>
      )}
    </span>
  );
};

export const ValeursIndicateurTable = ({
  indicateurs,
}: {
  indicateurs: ValeursIndicateurDisplay[];
}) => {
  return (
    <div className="fr-table">
      <table>
        <thead>
          <tr>
            <th scope="col">Nom</th>
            <th scope="col">Valeur initiale</th>
            <th scope="col">Valeur actuelle</th>
            <th scope="col">Valeur cible</th>
            <th scope="col">Taux d&apos;avancement</th>
          </tr>
        </thead>
        <tbody>
          {indicateurs.map((indicateur) => (
            <tr key={indicateur.indicateur_id}>
              <td>
                {indicateur.nom}
                {indicateur.unite_mesure && (
                  <span className="block text-xs text-gray-500">
                    ({indicateur.unite_mesure})
                  </span>
                )}
              </td>
              <td>
                <ValeurEtDate
                  valeur={indicateur.valeur_initiale}
                  date={indicateur.date_valeur_initiale}
                  unite={indicateur.unite_mesure}
                />
              </td>
              <td>
                <ValeurEtDate
                  valeur={indicateur.valeur_actuelle}
                  date={indicateur.date_valeur_actuelle}
                  unite={indicateur.unite_mesure}
                />
              </td>
              <td>
                <ValeurEtDate
                  valeur={indicateur.valeur_cible}
                  date={indicateur.date_valeur_cible}
                  unite={indicateur.unite_mesure}
                />
              </td>
              <td>
                {indicateur.taux_avancement === null ? (
                  <span>—</span>
                ) : (
                  <span>{indicateur.taux_avancement} %</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
