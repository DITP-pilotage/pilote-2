import type { GetChantierIndicateursResult } from "@/server/chantiers/query/GetChantierIndicateursQuery";
import ValeurEtDate from "@/client/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/ValeurEtDate";
import BarreDeProgression from "@/client/components/_commons/BarreDeProgression/BarreDeProgression";
import { Table } from "@/components/shared/Table";

export const ChantierIndicateursTable = ({
  indicateurs,
}: {
  indicateurs: GetChantierIndicateursResult["indicateurs"];
}) => {
  return (
    <Table.Root
      caption="Indicateurs du chantier"
      captionHidden
      containerClassName="p-0 m-0"
    >
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Nom</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Valeur initiale</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Valeur actuelle</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Valeur cible</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>
            Taux d&apos;avancement
          </Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {indicateurs.map((indicateur) => (
          <Table.Row key={indicateur.indicateur_id}>
            <Table.Cell>{indicateur.nom}</Table.Cell>
            <Table.Cell>
              <ValeurEtDate
                valeur={indicateur.valeur_initiale}
                date={indicateur.date_valeur_initiale}
                unité={indicateur.unite_mesure}
              />
            </Table.Cell>
            <Table.Cell>
              <ValeurEtDate
                valeur={indicateur.valeur_actuelle}
                date={indicateur.date_valeur_actuelle}
                unité={indicateur.unite_mesure}
              />
            </Table.Cell>
            <Table.Cell>
              <ValeurEtDate
                valeur={indicateur.valeur_cible}
                date={indicateur.date_valeur_cible}
                unité={indicateur.unite_mesure}
              />
            </Table.Cell>
            <Table.Cell>
              <BarreDeProgression
                taille="sm"
                variante="primaire"
                fond="blanc"
                bordure={null}
                valeur={indicateur.taux_avancement}
              />
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
};
