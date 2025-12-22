import { Row } from "@tanstack/react-table";
import { FicheEvaluationRow } from "@/components/PagePilotage/useTableauPilotage";
import { Icone } from "@/components/_commons/Icone";
import { LockIcon } from "@/components/_commons/Icones/LockIcon";
import { LockUnlockIcon } from "@/components/_commons/Icones/LockUnlockIcon";
import { BadgeEtape } from "@/components/Evaluation/BadgeEtape";

const afficherRattachementCode = (code: string) => {
  if (code.startsWith("REG-")) return code;
  return code.replace("DEPT-", "");
};

export const EnteteGroupeRattachement = ({
  rowGroup,
  columnCount,
}: {
  rowGroup: Row<FicheEvaluationRow>;
  columnCount: number;
}) => {
  const ficheGroup = rowGroup.original;
  const allSelected = rowGroup.subRows.every((row) => row.getIsSelected());
  const someSelected = rowGroup.subRows.some((row) => row.getIsSelected());
  const groupIndeterminate = someSelected && !allSelected;

  const handleGroupToggle = () => {
    rowGroup.subRows.forEach((row) => {
      row.toggleSelected(!allSelected);
    });
  };

  return (
    <>
      <div className="flex mt-4 sticky left-0">
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
          {ficheGroup.rattachementLibelle}
        </div>
      </div>

      <div
        style={{
          gridColumn: `span ${columnCount - 1}`,
        }}
      />

      <div className="grid grid-cols-subgrid border !border-black sticky left-0 bg-white">
        {rowGroup.subRows.map((row) => {
          const fiche = row.original;
          return (
            <div
              className="flex items-center gap-2 border-b !border-black last:!border-none p-2"
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
                  <BadgeEtape etapeCourante={fiche.etapeCourante} short />
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
    </>
  );
};
