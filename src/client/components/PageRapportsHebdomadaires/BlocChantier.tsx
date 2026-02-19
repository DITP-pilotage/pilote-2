import "@gouvfr/dsfr/dist/component/table/table.min.css";
import Bloc from "@/components/_commons/Bloc/Bloc";
import { Accordion } from "@/components/shared/Accordion";
import { clsxm } from "@/utils/clsxm";
import { PiloteDateFormatter } from "@/server/rapports-hebdomadaires/infrastructure/adapters/PiloteDateFormatter";
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
          className="fr-link fr-text--sm"
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
            <Accordion.Content className="!bg-transparent !px-0 !pb-0 !pt-0">
              <div className="fr-table fr-mb-0 fr-pt-0">
                <table className="table">
                  <thead className="bg-dsfr-blue-france-925">
                    <tr>
                      <th>Territoire</th>
                      <th>Donnée</th>
                      <th>Nouvelle valeur</th>
                      <th>Saisi le</th>
                    </tr>
                  </thead>
                  <tbody className="bg-transparent">
                    {indicateur.territoires.map((territoire) => (
                      <tr
                        key={`${territoire.code}-${territoire.typeValeur}-${territoire.dateValeur}`}
                      >
                        <td>{territoire.nom}</td>
                        <td>
                          {formatterTypeValeur(territoire.typeValeur)}
                          <br />(
                          {PiloteDateFormatter.isoDateFranceMetropolitaine(
                            territoire.dateValeur,
                          )}
                          )
                        </td>
                        <td>{territoire.valeur ?? "—"}</td>
                        <td>
                          {PiloteDateFormatter.isoDateFranceMetropolitaine(
                            territoire.dateEvenement,
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </Bloc>
  );
};
