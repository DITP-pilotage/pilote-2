import {
  Tableau,
  TableauCellule,
  TableauCelluleEnTete,
  TableauCorps,
  TableauEnTete,
  TableauLigne,
} from "@/components/shared/Tableau";
import type { GetChantierIndicateursResult } from "@/server/chantiers/query/GetChantierIndicateursQuery";
import ValeurEtDate from "@/client/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/ValeurEtDate";
import BarreDeProgression from "@/client/components/_commons/BarreDeProgression/BarreDeProgression";

export const ChantierIndicateursTable = ({
  indicateurs,
}: {
  indicateurs: GetChantierIndicateursResult["indicateurs"];
}) => {
  return (
    <div className="relative">
      <Tableau>
        <TableauEnTete>
          <tr>
            <TableauCelluleEnTete scope="col">Nom</TableauCelluleEnTete>
            <TableauCelluleEnTete scope="col">
              Valeur initiale
            </TableauCelluleEnTete>
            <TableauCelluleEnTete scope="col">
              Valeur actuelle
            </TableauCelluleEnTete>
            <TableauCelluleEnTete scope="col">
              Valeur cible
            </TableauCelluleEnTete>
            <TableauCelluleEnTete scope="col">
              Taux d&apos;avancement
            </TableauCelluleEnTete>
          </tr>
        </TableauEnTete>
        <TableauCorps>
          {indicateurs.map((indicateur) => (
            <TableauLigne key={indicateur.indicateur_id}>
              <TableauCellule>{indicateur.nom}</TableauCellule>
              <TableauCellule>
                <ValeurEtDate
                  valeur={indicateur.valeur_initiale}
                  date={indicateur.date_valeur_initiale}
                  unité={indicateur.unite_mesure}
                />
              </TableauCellule>
              <TableauCellule>
                <ValeurEtDate
                  valeur={indicateur.valeur_actuelle}
                  date={indicateur.date_valeur_actuelle}
                  unité={indicateur.unite_mesure}
                />
              </TableauCellule>
              <TableauCellule>
                <ValeurEtDate
                  valeur={indicateur.valeur_cible}
                  date={indicateur.date_valeur_cible}
                  unité={indicateur.unite_mesure}
                />
              </TableauCellule>
              <TableauCellule>
                <BarreDeProgression
                  taille="sm"
                  variante="primaire"
                  fond="blanc"
                  bordure={null}
                  valeur={indicateur.taux_avancement}
                />
              </TableauCellule>
            </TableauLigne>
          ))}
        </TableauCorps>
      </Tableau>
    </div>
  );
};
