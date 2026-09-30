import Bloc from "@/components/_commons/Bloc/Bloc";
import { Accordion } from "@/components/shared/Accordion";
import { Table } from "@/components/shared/Table";
import { clsxm } from "@/utils/clsxm";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";
import {
  type SectionChantier,
  type TypeValeurIndicateur,
} from "@/server/rapports-hebdomadaires/domain/SectionActiviteChantiers";

const formatterTypeValeur = (typeValeur: TypeValeurIndicateur): string => {
  switch (typeValeur) {
    case "VALEUR_AVANCEMENT":
      return "VA";
    case "VALEUR_INITIALE":
      return "VI";
    case "VALEUR_CIBLE":
      return "VC";
  }
};

export const BlocChantier = ({
  chantier,
  territoireCode,
}: {
  chantier: SectionChantier;
  territoireCode: string;
}) => {
  return (
    <Bloc contenuClassesSupplémentaires="!p-0">
      <div className="p-4 flex items-baseline gap-3">
        <h3 className="fr-text--lg fr-mb-0">
          {chantier.id} - {chantier.nom}
        </h3>
        <a
          className="fr-link fr-text--sm shrink-0"
          href={`/chantier/${chantier.id}/${territoireCode}`}
        >
          Voir le chantier
        </a>
      </div>
      <Accordion.Root type="multiple">
        {chantier.indicateurs.map((indicateur) => (
          <Accordion.Item
            value={indicateur.id}
            key={indicateur.id}
            className="border-b-0 group border-t border-t-gray-200"
          >
            <Accordion.Header
              className={clsxm(
                "group-odd:!bg-transparent group-even:!bg-dsfr-contrast-grey/30 border-t-0",
              )}
            >
              <Accordion.Trigger className="!bg-transparent hover:!bg-transparent !pl-8">
                {indicateur.id} - {indicateur.nom}
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="!bg-transparent" innerClassName="p-0">
              <Table.Root
                caption={`Valeurs saisies pour ${indicateur.nom}`}
                captionHidden
                containerClassName="mb-0 pt-0"
              >
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Territoire</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell className="text-right">
                      Type de donnée
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell className="text-right">
                      Date de la valeur
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell className="text-right">
                      Nouvelle valeur
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell className="text-right">
                      Saisi le
                    </Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body className="bg-transparent">
                  {indicateur.territoires.map((territoire) => (
                    <Table.Row
                      key={`${territoire.code}-${territoire.typeValeur}-${territoire.dateValeur}`}
                    >
                      <Table.Cell>{territoire.nom}</Table.Cell>
                      <Table.Cell className="text-right">
                        {formatterTypeValeur(territoire.typeValeur)}
                      </Table.Cell>
                      <Table.Cell className="text-right">
                        {PiloteDateFormatter.isoMonthFranceMetropolitaine(
                          territoire.dateValeur,
                        )}
                      </Table.Cell>
                      <Table.Cell className="text-right">
                        {territoire.valeur?.toLocaleString("fr-FR") ?? "—"}
                      </Table.Cell>
                      <Table.Cell className="text-right">
                        {PiloteDateFormatter.isoDateFranceMetropolitaine(
                          territoire.dateEvenement,
                        )}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </Bloc>
  );
};
