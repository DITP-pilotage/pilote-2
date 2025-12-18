import { Fragment } from "react";
import { useTableauPilotage } from "@/components/PagePilotage/useTableauPilotage";
import { clsxm } from "@/utils/clsxm";
import { LegendeTableauPilotage } from "@/components/PagePilotage/LegendeTableauPilotage";
import { MenuActionTableauPilotage } from "@/components/PagePilotage/MenuActionTableauPilotage";
import { BadgeFicheEtape } from "@/components/_commons/BadgeFicheEtape/BadgeFicheEtape";
import { Icone } from "@/components/_commons/Icone";
import { LockIcon } from "@/components/_commons/Icones/LockIcon";
import { LockUnlockIcon } from "@/components/_commons/Icones/LockUnlockIcon";

export const TableauPilotage = () => {
  const { table, fichesSelectionneesIds, criteres, maxObjectifs, ETAPES } =
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

      <div className="overflow-auto border border-gray-200 rounded-lg max-h-[75vh]">
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
          <span className="text-sm text-gray-700">
            {selectedCount} ligne(s) sélectionnée(s)
          </span>
        </div>

        <div
          className="w-full grid gap-4"
          style={{
            gridTemplateColumns: gridTemplateColumns.join(" "),
          }}
        >
          <div />

          {/* Critères group headers */}
          <div
            className="grid gap-0 grid-cols-subgrid border !border-2 !border-red-500"
            style={{ gridColumn: `span ${criteres.length}` }}
          >
            <div className="col-span-full">Manière de servir</div>
            {criteres.map((critere) => (
              <div
                className="px-4 py-3 text-left text-sm"
                key={`critere-header-${critere.id}`}
              >
                <div className="text-xs font-medium flex flex-col items-center">
                  <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded mb-1 inline-block">
                    Critère
                  </div>
                  <div>{critere.libelle}</div>
                </div>

                <div className="grid grid-cols-3">
                  {ETAPES.map((etape) => (
                    <div
                      className="px-4 py-3 text-left text-sm whitespace-nowrap"
                      key={etape.key}
                    >
                      {etape.label}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Objectifs group headers */}
          <div
            className="grid gap-0 grid-cols-subgrid  border !border-2 !border-blue-500"
            style={{ gridColumn: `span ${maxObjectifs}` }}
          >
            <div className="col-span-full">Objectifs individuels</div>
            {[...Array(maxObjectifs)].map((_, index) => (
              <div
                className="px-4 py-3 text-left text-sm"
                key={`objectif-header-${index}`}
              >
                <div className="text-xs font-medium flex flex-col items-center">
                  <div className="bg-green-50 text-green-700 px-2 py-1 rounded mb-1 inline-block">
                    Objectif {index + 1}
                  </div>
                </div>

                <div className="grid grid-cols-3">
                  {ETAPES.map((etape) => (
                    <div
                      className="px-4 py-3 text-left text-sm whitespace-nowrap"
                      key={etape.key}
                    >
                      {etape.label}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Data Rows */}
          {table.getRowModel().rows.map((row, rowIndex) => {
            const fiche = row.original;
            const previousRow = table.getRowModel().rows[rowIndex - 1];
            const isNewGroup =
              previousRow == null ||
              previousRow.original.rattachementGroupe !==
                fiche.rattachementGroupe;

            const spanObjectifs = maxObjectifs - fiche.objectifs.length;
            return (
              <Fragment key={row.id}>
                {isNewGroup ? (
                  <div className="col-span-full">Nom region groupe</div>
                ) : null}

                <div>en tete ligne</div>

                {criteres.map((critere) => (
                  <div key={critere.id}>crit</div>
                ))}

                {fiche.objectifs.map((objectif) => (
                  <div key={objectif.id}>obj</div>
                ))}

                {spanObjectifs > 0 && (
                  <div
                    style={{
                      gridColumn: `span ${spanObjectifs}`,
                    }}
                  />
                )}
              </Fragment>
            );

            return (
              <div className="contents group" key={row.id}>
                {/* Checkbox */}
                <div
                  className={clsxm(
                    "px-4 py-3 border-gray-200 text-sm text-gray-900 bg-white group-hover:bg-gray-50 transition-colors border-b border-gray-100",
                    {
                      "border-t": isNewGroup,
                    },
                  )}
                  style={{
                    position: "sticky",
                    left: 0,
                  }}
                >
                  <input
                    checked={row.getIsSelected()}
                    className="cursor-pointer"
                    disabled={!row.getCanSelect()}
                    onChange={row.getToggleSelectedHandler()}
                    type="checkbox"
                  />
                </div>

                {/* Lock Icon */}
                <div
                  className={clsxm(
                    "px-4 py-3 border-gray-200 text-sm text-gray-900 bg-white group-hover:bg-gray-50 transition-colors border-b border-gray-100",
                    {
                      "border-t": isNewGroup,
                    },
                  )}
                  style={{
                    position: "sticky",
                    left: 45,
                  }}
                >
                  <div className="text-center text-xl">
                    {fiche.readOnly ? (
                      <Icone className="h-4 w-4" icone={LockIcon} />
                    ) : (
                      <Icone className="h-4 w-4" icone={LockUnlockIcon} />
                    )}
                  </div>
                </div>

                {/* Etape Badge */}
                <div
                  className={clsxm(
                    "px-4 py-3 border-gray-200 text-sm text-gray-900 bg-white group-hover:bg-gray-50 transition-colors border-b border-gray-100",
                    {
                      "border-t": isNewGroup,
                    },
                  )}
                  style={{
                    position: "sticky",
                    left: 93,
                  }}
                >
                  <BadgeFicheEtape etape={fiche.etapeCourante} />
                </div>

                {/* Code */}
                <div
                  className={clsxm(
                    "px-4 py-3 border-gray-200 text-sm text-gray-900 bg-white group-hover:bg-gray-50 transition-colors border-b border-gray-100",
                    {
                      "border-t": isNewGroup,
                    },
                  )}
                  style={{
                    position: "sticky",
                    left: 164,
                  }}
                >
                  <div className="font-mono text-sm whitespace-nowrap">
                    {fiche.rattachementCode}
                  </div>
                </div>

                {/* Territoire */}
                <div
                  className={clsxm(
                    "px-4 py-3 border-gray-200 text-sm text-gray-900 bg-white group-hover:bg-gray-50 transition-colors border-b border-gray-100",
                    {
                      "border-t": isNewGroup,
                    },
                  )}
                  style={{
                    position: "sticky",
                    left: 255,
                  }}
                >
                  <div className="font-semibold whitespace-nowrap">
                    {fiche.rattachementLibelle}
                  </div>
                </div>

                {/* Critères evaluations */}
                {criteres.map((critere) =>
                  ETAPES.map((etape) => {
                    const note =
                      fiche.evaluationsParCritereEtEtape[critere.id]?.[
                        etape.key
                      ];
                    return (
                      <div
                        className={clsxm(
                          "px-4 py-3 border-gray-200 text-sm text-gray-900 bg-white group-hover:bg-gray-50 transition-colors border-b border-gray-100",
                          {
                            "border-t": isNewGroup,
                          },
                        )}
                        key={`critere-cell-${critere.id}-${etape.key}`}
                      >
                        <div className="text-center">{note ?? "-"}</div>
                      </div>
                    );
                  }),
                )}

                {/* Objectifs evaluations */}
                {[...Array(maxObjectifs)].map((_, objectifIndex) => {
                  const objectif = fiche.objectifs[objectifIndex];
                  return ETAPES.map((etape) => {
                    const note = objectif?.evaluations[etape.key];
                    return (
                      <div
                        className={clsxm(
                          "px-4 py-3 border-gray-200 text-sm text-gray-900 bg-white group-hover:bg-gray-50 transition-colors border-b border-gray-100",
                          {
                            "border-t": isNewGroup,
                          },
                        )}
                        key={`objectif-cell-${objectifIndex}-${etape.key}`}
                      >
                        <div className="text-center">{note ?? "-"}</div>
                      </div>
                    );
                  });
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
