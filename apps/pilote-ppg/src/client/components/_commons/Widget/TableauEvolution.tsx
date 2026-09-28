import { TerritoireLabel } from "@/components/_commons/Widget/TerritoireLabel";
import { Table } from "@/components/shared/Table";
import { clsxm } from "@/utils/clsxm";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";

export type CelluleJalon = {
  valeur: string | null;
  date: string | null;
  estApplicable: boolean | null;
};

export type LigneTerritoire = {
  territoireCode: string;
  nom: string;
  couleur: string;
  estInitial: boolean;
  cellules: Map<number, CelluleJalon>;
};

const CELLULE = "text-xs";

export const TableauEvolution = ({
  lignes,
  jalons,
  jalonActif,
  onSupprimerTerritoire,
}: {
  lignes: LigneTerritoire[];
  jalons: number[];
  jalonActif: number;
  onSupprimerTerritoire: (territoireCode: string) => void;
}) => {
  return (
    <Table.Root
      caption="Évolution des valeurs par territoire et par jalon"
      captionHidden
      className="w-full border-collapse"
      containerClassName="text-xs"
    >
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell
            className={clsxm(
              CELLULE,
              "sticky left-0 bg-dsfr-blue-france-925 z-10 min-w-[130px] p-0 md:p-0",
            )}
          >
            <span className="sr-only">Territoire</span>
          </Table.ColumnHeaderCell>
          {jalons.map((jalon) => (
            <Table.ColumnHeaderCell
              key={jalon}
              className={clsxm(
                CELLULE,
                "px-3 py-2 md:px-3 md:py-2 text-center whitespace-nowrap",
                jalon === jalonActif ? "font-bold" : "font-semibold",
              )}
            >
              {jalon}
            </Table.ColumnHeaderCell>
          ))}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {lignes.map((ligne) => (
          <Table.Row
            key={ligne.territoireCode}
            className="border-t border-dsfr-grey-925"
          >
            <Table.RowHeaderCell
              className={clsxm(
                CELLULE,
                "sticky left-0 bg-inherit z-10 min-w-[130px] py-2 pr-2 md:py-2 md:pr-2 pl-0 md:pl-0",
              )}
            >
              <TerritoireLabel
                nom={ligne.nom}
                couleur={ligne.couleur}
                onSupprimer={
                  !ligne.estInitial
                    ? () => onSupprimerTerritoire(ligne.territoireCode)
                    : undefined
                }
              />
            </Table.RowHeaderCell>
            {jalons.map((jalon) => {
              const cellule = ligne.cellules.get(jalon);
              const estActif = jalon === jalonActif;

              if (cellule?.estApplicable === false) {
                return (
                  <Table.Cell
                    key={jalon}
                    className={clsxm(
                      CELLULE,
                      "px-3 py-2 md:px-3 md:py-2 text-center text-gray-400 whitespace-nowrap",
                    )}
                  >
                    N/A
                  </Table.Cell>
                );
              }

              return (
                <Table.Cell
                  key={jalon}
                  className={clsxm(
                    CELLULE,
                    "px-3 py-2 md:px-3 md:py-2 text-center whitespace-nowrap",
                  )}
                >
                  {cellule?.valeur !== null ? (
                    <div className="flex flex-col items-center gap-0.5">
                      <span
                        className={clsxm(estActif && "font-bold")}
                        style={{ color: ligne.couleur }}
                      >
                        {cellule?.valeur}
                      </span>
                      {cellule?.date && (
                        <span className="text-[10px] text-gray-500">
                          (
                          {PiloteDateFormatter.isoMonthFranceMetropolitaine(
                            cellule.date,
                          )}
                          )
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </Table.Cell>
              );
            })}
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
};
