import { PropsWithChildren, ReactNode } from "react";
import { Table } from "@tanstack/react-table";
import {
  ETAPES,
  FicheEvaluationRow,
} from "@/components/PagePilotage/useTableauPilotage";
import { pagePilotage } from "@/components/PagePilotage/PagePilotageServerSideContext";
import { useObjectifsCount } from "@/components/PagePilotage/useObjectifsCount";
import { MenuActionTableauPilotage } from "@/components/PagePilotage/MenuActionTableauPilotage";
import { Icone } from "@/components/_commons/Icone";
import { PencilIcon } from "@/components/_commons/Icones/PencilIcon";
import { BoutonAfficherFicheCadrage } from "@/components/Evaluation/BoutonAfficherFicheCadrage";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { ModaleFicheCadrage } from "@/components/Evaluation/ModaleFicheCadrage";

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

export const TableauPilotageHeader = ({
  table,
  columnsCount,
  fichesSelectionneesIds,
}: {
  table: Table<FicheEvaluationRow>;
  columnsCount: number;
  fichesSelectionneesIds: string[];
}) => {
  const { criteres } = pagePilotage.useServerSidePropsContext().pilotage;
  const maxObjectifs = useObjectifsCount();
  const selectedCount = fichesSelectionneesIds.length;

  return (
    <>
      <div className="px-4 py-2 flex items-center gap-2 sticky left-0 top-0 bg-white z-10">
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
        <span className="font-semibold">
          {selectedCount} ligne(s) sélectionnée(s)
        </span>
      </div>

      <div
        className="sticky top-0 bg-white z-1"
        style={{ gridColumn: `span ${columnsCount - 1}` }}
      />

      <div className="sticky left-0 bg-white z-10" style={{ top: "32px" }}>
        <MenuActionTableauPilotage
          fichesSelectionneesIds={fichesSelectionneesIds}
        />
      </div>

      <div
        className="grid grid-cols-subgrid sticky bg-white z-1"
        style={{
          gridColumn: `span ${1 + criteres.length + maxObjectifs}`,
          top: "32px",
        }}
      >
        <div
          className="border !border-black grid grid-cols-subgrid"
          style={{ gridColumn: 1 }}
        >
          <div className="col-span-full text-center font-bold p-2 border-b !border-black">
            Objectifs collectifs
          </div>
          <div
            className="p-2 font-medium flex flex-col items-center"
            style={{ gridRow: "span 2" }}
          >
            <div className="line-clamp-1">Note</div>
          </div>
        </div>

        <HeaderGroup items={criteres} label="Manière de servir">
          {(critere) => (
            <HeaderCell key={`critere-header-${critere.id}`}>
              <ModaleFicheCadrage critere={critere}>
                <Bouton label={critere.libelle} />
              </ModaleFicheCadrage>
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
      </div>
    </>
  );
};
