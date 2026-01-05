import { Fragment } from "react";
import {
  ETAPES,
  getInformationsAffichageCellule,
  useTableauPilotage,
} from "@/components/PagePilotage/useTableauPilotage";
import { useObjectifsCount } from "@/components/PagePilotage/useObjectifsCount";
import { TableauPilotageHeader } from "@/components/PagePilotage/TableauPilotageHeader";
import { EnteteGroupeRattachement } from "@/components/PagePilotage/EnteteGroupeRattachement";
import { EvaluationsBlock } from "@/components/PagePilotage/EvaluationsBlock";
import { clsxm } from "@/utils/clsxm";

export const TableauPilotage = () => {
  const { table, fichesSelectionneesIds, criteres } = useTableauPilotage();
  const maxObjectifs = useObjectifsCount();

  const gridTemplateColumns = [
    "400px",
    "170px",
    ...Array(criteres.length + 1) // Ajout d'une colonne pour les moyennes
      .fill(0)
      .map(() => "170px"),
    ...Array(maxObjectifs + 1) // Ajout d'une colonne pour les moyennes
      .fill(0)
      .map(() => "170px"),
    "170px",
  ];

  return (
    <div className="space-y-4">
      <div className="text-xs">
        <div
          className="w-full grid gap-x-4"
          style={{
            gridTemplateColumns: gridTemplateColumns.join(" "),
          }}
        >
          <TableauPilotageHeader
            columnsCount={gridTemplateColumns.length}
            fichesSelectionneesIds={fichesSelectionneesIds}
            table={table}
          />

          {table.getRowModel().rows.map((rowGroup) => (
            <Fragment key={rowGroup.id}>
              <EnteteGroupeRattachement
                columnCount={gridTemplateColumns.length}
                rowGroup={rowGroup}
              />

              <div
                className="grid grid-cols-subgrid border-t border-l border-r !border-black"
                style={{ gridColumn: "span 1" }}
              >
                {rowGroup.subRows.map((row) => {
                  const noteObjectifsCollectifs =
                    row.original.noteObjectifsCollectifs;
                  return (
                    <div
                      className={clsxm(
                        "border-b !border-black flex items-center justify-center font-bold",
                        {
                          "bg-dsfr-contrast-grey":
                            noteObjectifsCollectifs == null,
                        },
                      )}
                      key={row.id}
                    >
                      {noteObjectifsCollectifs ?? "–"}
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
                getMoyenne={({ row, etape }) => {
                  return row.original.moyennesCriteres[etape];
                }}
                items={criteres}
                rowGroup={rowGroup}
              />

              <EvaluationsBlock
                getEvaluation={({ row, item, etape }) => {
                  const objectif = row.original.objectifs[item.index];
                  return objectif?.evaluations[etape];
                }}
                getNomObjectif={({ row, item }) => {
                  const objectif = row.original.objectifs[item.index];
                  return objectif?.libelle ?? "ND";
                }}
                isObjectif
                getMoyenne={({ row, etape }) => {
                  return row.original.moyennesCriteres[etape];
                }}
                items={Array.from({ length: maxObjectifs }).map((_, index) => ({
                  id: index,
                  index,
                }))}
                rowGroup={rowGroup}
              />

              <div
                className="grid gap-0 grid-cols-subgrid border-l border-t !border-black"
                style={{ gridColumn: "span 1" }}
              >
                {rowGroup.subRows.map((row) => {
                  const fiche = row.original;
                  return (
                    <div
                      className="grid grid-cols-3 border-b !border-black border-r"
                      key={`${fiche.id}-${fiche.rattachementCode}`}
                    >
                      {ETAPES.map((etape) => {
                        const moyennePonderee = fiche.synthese[etape.key];
                        const {
                          isAfterPhase,
                          shouldShowBlueText,
                          shouldShowDash,
                        } = getInformationsAffichageCellule(
                          fiche,
                          moyennePonderee,
                          etape,
                        );
                        return (
                          <div
                            className={clsxm(
                              "flex items-center justify-center text-center font-bold whitespace-nowrap",
                              {
                                "bg-dsfr-contrast-grey": isAfterPhase,
                                "text-dsfr-info-main-525": shouldShowBlueText,
                              },
                            )}
                            key={etape.key}
                          >
                            {shouldShowDash ? "–" : moyennePonderee}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
