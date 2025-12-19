import { Fragment, PropsWithChildren, ReactNode } from "react";
import { $Enums } from "@prisma/client";
import { Row } from "@tanstack/react-table";
import {
  ETAPES,
  FicheEvaluationRow,
  useTableauPilotage,
} from "@/components/PagePilotage/useTableauPilotage";
import { clsxm } from "@/utils/clsxm";
import { LegendeTableauPilotage } from "@/components/PagePilotage/LegendeTableauPilotage";
import { MenuActionTableauPilotage } from "@/components/PagePilotage/MenuActionTableauPilotage";
import { BadgeFicheEtape } from "@/components/_commons/BadgeFicheEtape/BadgeFicheEtape";
import { Icone } from "@/components/_commons/Icone";
import { LockIcon } from "@/components/_commons/Icones/LockIcon";
import { LockUnlockIcon } from "@/components/_commons/Icones/LockUnlockIcon";
import { BadgeType } from "@/components/Evaluation/BadgeType";
import { BadgeEtape } from "@/components/Evaluation/BadgeEtape";

function HeaderGroup<T>({
  label,
  items,
  children,
}: {
  label: string;
  items: T[];
  children: (item: T) => ReactNode;
}) {
  return (
    <div
      className="grid gap-0 grid-cols-subgrid border !border-black"
      style={{ gridColumn: `span ${items.length}` }}
    >
      <div className="col-span-full text-center font-bold p-2 border-b !border-black">
        {label}
      </div>
      {items.map(children)}
    </div>
  );
}

const HeaderCell = ({ children }: PropsWithChildren) => (
  <div className="border-r !border-black last:!border-0">
    <div className="p-2 font-medium flex flex-col items-center border-b !border-black ">
      <div className="line-clamp-1">{children}</div>
    </div>

    <div className="grid grid-cols-3">
      {ETAPES.map((etape) => (
        <div className="whitespace-nowrap text-center p-2" key={etape.key}>
          {etape.label}
        </div>
      ))}
    </div>
  </div>
);

function EvaluationsBlock<T>({
  items,
  rowGroup,
  getEvaluation,
}: {
  items: T[];
  rowGroup: Row<FicheEvaluationRow>;
  getEvaluation(options: {
    item: T;
    row: Row<FicheEvaluationRow>;
    etape: $Enums.etape_evaluation_enum;
  }): number | null;
}) {
  return (
    <div
      className="grid gap-0 grid-cols-subgrid border-l border-t !border-black"
      style={{ gridColumn: `span ${items.length}` }}
    >
      {items.map((item) => {
        return (
          <>
            {rowGroup.subRows.map((row) => {
              const fiche = row.original;
              return (
                <div
                  className="grid grid-cols-3 border-b !border-black border-r"
                  key={fiche.id}
                >
                  {ETAPES.map((etape) => {
                    const evaluation = getEvaluation({
                      item,
                      row,
                      etape: etape.key,
                    });

                    return (
                      <div
                        className={clsxm(
                          "flex items-center justify-center text-center whitespace-nowrap",
                          { "bg-dsfr-grey-925": evaluation == null },
                        )}
                        key={etape.key}
                      >
                        {evaluation ?? " "}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </>
        );
      })}
    </div>
  );
}

function afficherRattachementCode(code: string) {
  if (code.startsWith("REG-")) return code;
  return code.replace("DEPT-", "");
}

export const TableauPilotage = () => {
  const { table, fichesSelectionneesIds, criteres, maxObjectifs } =
    useTableauPilotage();

  const selectedCount = fichesSelectionneesIds.length;

  const gridTemplateColumns = [
    "350px",
    ...Array(criteres.length)
      .fill(0)
      .map(() => "170px"),
    ...Array(maxObjectifs)
      .fill(0)
      .map(() => "170px"),
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <LegendeTableauPilotage />
        <MenuActionTableauPilotage
          fichesSelectionneesIds={fichesSelectionneesIds}
        />
      </div>

      <div className="overflow-auto border border-gray-200 rounded-lg max-h-[75vh] text-xs">
        <div className="sticky top-0 left-0 z-40 bg-white px-4 py-3 flex items-center gap-2 border-b border-gray-200">
          <input
            checked={table.getIsAllRowsSelected()}
            className="cursor-pointer"
            onChange={table.getToggleAllRowsSelectedHandler()}
            ref={(el) => {
              if (el) {
                el.indeterminate = table.getIsSomeRowsSelected();
              }
            }}
            type="checkbox"
          />
          <span className="text-gray-700">
            {selectedCount} ligne(s) sélectionnée(s)
          </span>
        </div>

        <div
          className="w-full grid gap-x-4"
          style={{
            gridTemplateColumns: gridTemplateColumns.join(" "),
          }}
        >
          <div />

          <HeaderGroup items={criteres} label="Manière de servir">
            {(critere) => (
              <HeaderCell key={`critere-header-${critere.id}`}>
                {critere.libelle}
              </HeaderCell>
            )}
          </HeaderGroup>

          <HeaderGroup
            items={Array.from({ length: maxObjectifs }).map((_, index) => ({
              index,
            }))}
            label="Objectifs individuels"
          >
            {(objectif) => (
              <HeaderCell key={`objectif-header-${objectif.index}`}>
                Objectif {objectif.index + 1}
              </HeaderCell>
            )}
          </HeaderGroup>

          {/* Data Rows */}
          {table.getRowModel().rows.map((rowGroup) => {
            const ficheGroup = rowGroup.original;
            const allSelected = rowGroup.subRows.every((row) =>
              row.getIsSelected(),
            );
            const someSelected = rowGroup.subRows.some((row) =>
              row.getIsSelected(),
            );
            const groupIndeterminate = someSelected && !allSelected;

            const handleGroupToggle = () => {
              rowGroup.subRows.forEach((row) => {
                row.toggleSelected(!allSelected);
              });
            };

            return (
              <Fragment key={rowGroup.id}>
                <div className="flex mt-4 ">
                  <div className="p-2 border-t border-l !border-black">
                    <input
                      checked={allSelected}
                      className="cursor-pointer"
                      onChange={handleGroupToggle}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate = groupIndeterminate;
                        }
                      }}
                      type="checkbox"
                    />
                  </div>

                  <div className="grow bg-black text-white text-center p-2 font-bold">
                    {ficheGroup.rattachementGroupe}
                  </div>
                </div>

                <div
                  style={{
                    gridColumn: `span ${gridTemplateColumns.length - 1}`,
                  }}
                />

                <div className="grid grid-cols-subgrid border !border-black">
                  {rowGroup.subRows.map((row) => {
                    const fiche = row.original;
                    return (
                      <div
                        className="flex items-center gap-2  border-b !border-black last:!border-none p-2"
                        key={fiche.id}
                      >
                        <input
                          checked={row.getIsSelected()}
                          className="cursor-pointer"
                          onChange={row.getToggleSelectedHandler()}
                          type="checkbox"
                        />

                        <div className="p-1">
                          <Icone
                            className="h-4 w-4"
                            icone={fiche.readOnly ? LockIcon : LockUnlockIcon}
                          />
                        </div>

                        <div className="grid grid-cols-3 items-center grow">
                          <div>
                            <BadgeEtape
                              etapeCourante={fiche.etapeCourante}
                              short
                            />
                          </div>

                          <span className="font-semibold text-center">
                            {afficherRattachementCode(fiche.rattachementCode)}
                          </span>

                          <span className="font-semibold">
                            {fiche.rattachementLibelle}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <EvaluationsBlock
                  getEvaluation={({ row, item, etape }) => {
                    return row.original.evaluationsParCritereEtEtape[item.id]?.[
                      etape
                    ];
                  }}
                  items={criteres}
                  rowGroup={rowGroup}
                />

                <EvaluationsBlock
                  getEvaluation={({ row, item, etape }) => {
                    const objectif = row.original.objectifs[item.index];
                    return objectif?.evaluations[etape];
                  }}
                  items={Array.from({ length: maxObjectifs }).map(
                    (_, index) => ({ index }),
                  )}
                  rowGroup={rowGroup}
                />
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
