import "@gouvfr/dsfr/dist/component/table/table.min.css";
import type { GetValeursIndicateurResult } from "@/server/chantiers/query/GetValeursIndicateurQuery";
import ValeurEtDate from "@/client/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/ValeurEtDate";
import BarreDeProgression from "@/client/components/_commons/BarreDeProgression/BarreDeProgression";

export const ValeursIndicateurTable = ({
  indicateurs,
}: {
  indicateurs: GetValeursIndicateurResult["indicateurs"];
}) => {
  return (
    <div className="fr-table fr-p-0 fr-m-0">
      <table className="!table">
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
              <td>{indicateur.nom}</td>
              <td>
                <ValeurEtDate
                  valeur={indicateur.valeur_initiale}
                  date={indicateur.date_valeur_initiale}
                  unité={indicateur.unite_mesure}
                />
              </td>
              <td>
                <ValeurEtDate
                  valeur={indicateur.valeur_actuelle}
                  date={indicateur.date_valeur_actuelle}
                  unité={indicateur.unite_mesure}
                />
              </td>
              <td>
                <ValeurEtDate
                  valeur={indicateur.valeur_cible}
                  date={indicateur.date_valeur_cible}
                  unité={indicateur.unite_mesure}
                />
              </td>
              <td>
                <BarreDeProgression
                  taille="sm"
                  variante="primaire"
                  fond="blanc"
                  bordure={null}
                  valeur={indicateur.taux_avancement}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
