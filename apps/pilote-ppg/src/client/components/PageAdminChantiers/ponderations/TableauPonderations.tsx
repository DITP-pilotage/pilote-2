import { Table } from "@/components/shared/Table";
import {
  MAILLES,
  Maille,
  LIBELLE_MAILLE,
} from "@/server/parametrage-chantier/domain/maille";
import { IndicateurPonderation } from "@/server/parametrage-chantier/queries/GetIndicateursPonderationsChantierQuery";
import { ModificationLigne } from "@/components/PageAdminChantiers/ponderations/usePonderationsIndicateursForm";
import LignePonderation, {
  CELLULE,
} from "@/components/PageAdminChantiers/ponderations/LignePonderation";
import { clsxm } from "@/utils/clsxm";

const EnTeteTableauPonderations = () => (
  <Table.Header>
    <Table.Row>
      <Table.ColumnHeaderCell
        className={clsxm(CELLULE, "w-32 text-left px-4 py-3 md:px-4 md:py-3")}
      >
        Statut
      </Table.ColumnHeaderCell>
      <Table.ColumnHeaderCell
        className={clsxm(CELLULE, "text-left px-4 py-3 md:px-4 md:py-3")}
      >
        Indicateur
      </Table.ColumnHeaderCell>
      {MAILLES.map((maille) => (
        <Table.ColumnHeaderCell
          className={clsxm(
            CELLULE,
            "w-36 text-right px-4 py-3 md:px-4 md:py-3",
          )}
          key={maille}
        >
          {LIBELLE_MAILLE[maille]} (%)
        </Table.ColumnHeaderCell>
      ))}
    </Table.Row>
  </Table.Header>
);

const PiedTableauPonderations = ({
  sommesParMaille,
  sommesEnErreur,
}: {
  sommesParMaille: Partial<Record<Maille, number>>;
  sommesEnErreur: Record<Maille, boolean>;
}) => (
  <Table.Footer>
    <Table.Row className="border-t-2 border-dsfr-grey-925 bg-dsfr-grey-1000">
      <Table.Cell className={clsxm(CELLULE, "px-4 py-3 md:px-4 md:py-3")} />
      <Table.Cell
        className={clsxm(
          CELLULE,
          "px-4 py-3 md:px-4 md:py-3 text-dsfr-grey-50",
        )}
      >
        <p className="mb-0 font-semibold">Somme des indicateurs actifs</p>
        <p className="mb-0 text-xs text-dsfr-mention-grey">
          Les indicateurs inactifs ne sont pas comptés.
        </p>
      </Table.Cell>
      {MAILLES.map((maille) => {
        const somme = sommesParMaille[maille];
        const enErreur = sommesEnErreur[maille];
        return (
          <Table.Cell
            className={clsxm(CELLULE, "px-4 py-3 md:px-4 md:py-3 text-right")}
            key={maille}
          >
            <p
              className={clsxm(
                "mb-0 font-semibold",
                enErreur ? "text-error" : "text-dsfr-grey-50",
              )}
            >
              {somme === undefined ? "–" : somme}
            </p>
            {enErreur ? (
              <p className="mb-0 text-xs text-error">doit faire 100</p>
            ) : null}
          </Table.Cell>
        );
      })}
    </Table.Row>
  </Table.Footer>
);

const TableauPonderations = ({
  indicesAffiches,
  modifications,
  ponderations,
  sommesEnErreur,
  sommesParMaille,
}: {
  indicesAffiches: number[];
  modifications: ModificationLigne[];
  ponderations: IndicateurPonderation[];
  sommesEnErreur: Record<Maille, boolean>;
  sommesParMaille: Partial<Record<Maille, number>>;
}) => (
  <div className="bg-white rounded-lg shadow-sm ring-1 ring-dsfr-grey-925 overflow-x-auto">
    <Table.Root
      caption="Pondération des indicateurs par maille"
      captionHidden
      className="w-full min-w-[56rem] table-fixed text-sm"
    >
      <EnTeteTableauPonderations />
      <Table.Body>
        {indicesAffiches.length === 0 ? (
          <Table.Row className="border-t border-dsfr-grey-925">
            <Table.Cell
              className={clsxm(
                CELLULE,
                "px-4 py-6 text-center text-dsfr-mention-grey",
              )}
              colSpan={2 + MAILLES.length}
            >
              Aucun indicateur pour ce filtre.
            </Table.Cell>
          </Table.Row>
        ) : (
          indicesAffiches.map((index) => (
            <LignePonderation
              index={index}
              key={ponderations[index].indicId}
              modification={modifications[index]}
              ponderation={ponderations[index]}
            />
          ))
        )}
      </Table.Body>
      <PiedTableauPonderations
        sommesEnErreur={sommesEnErreur}
        sommesParMaille={sommesParMaille}
      />
    </Table.Root>
  </div>
);

export default TableauPonderations;
