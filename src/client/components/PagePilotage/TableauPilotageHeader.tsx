import { ComponentType, PropsWithChildren, ReactNode } from "react";
import { Table } from "@tanstack/react-table";
import { $Enums } from "@prisma/client";
import {
  ETAPES,
  FicheEvaluationRow,
} from "@/components/PagePilotage/useTableauPilotage";
import { pagePilotage } from "@/components/PagePilotage/PagePilotageServerSideContext";
import { useObjectifsCount } from "@/components/PagePilotage/useObjectifsCount";
import { MenuActionTableauPilotage } from "@/components/PagePilotage/MenuActionTableauPilotage";
import { clsxm } from "@/utils/clsxm";

const HeaderCell = ({
  children,
  boldEtape,
  className
}: PropsWithChildren<{ boldEtape?: boolean, className?: string }>) => (
  <div className="border-r !border-black last:!border-0">
    <div className={clsxm(
        "p-2 font-medium flex flex-col items-center border-b !border-black",
        className,
      )}
    >
      <div className="line-clamp-1">{children}</div>
    </div>

    <div className="grid grid-cols-3">
      {ETAPES.map((etape) => (
        <div
          className={clsxm("whitespace-nowrap text-center p-2", {
            "font-bold": boldEtape,
          })}
          key={etape.key}
        >
          {etape.label}
        </div>
      ))}
    </div>
  </div>
);
import { Icone } from "@/components/_commons/Icone";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { ModaleFicheCadrage } from "@/components/Evaluation/ModaleFicheCadrage";
import { Chat2Icon } from "@/components/_commons/Icones/Chat2Icon";
import { LightbulbIcon } from "@/components/_commons/Icones/LightbulbIcon";
import { SurveyIcon } from "@/components/_commons/Icones/SurveyIcon";
import { SparklingIcon } from "@/components/_commons/Icones/SparklingIcon";
import { clsxm } from "@/utils/clsxm";

const CRITERE_TYPE_TO_ICON: Record<
  $Enums.type_critere,
  ComponentType<{ className: string; fill: string }>
> = {
  COMMUNICATION: Chat2Icon,
  SERVICES_PUBLICS: SparklingIcon,
  SIMPLIFICATION: LightbulbIcon,
  FEUILLE_DE_ROUTE: SurveyIcon,
};

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
      style={{ gridColumn: `span ${items.length + 1}` }}
    >
      <div className="col-span-full text-center font-bold p-2 border-b !border-black">
        {label}
      </div>
      {items.map(children)}
      <HeaderCell boldEtape>
        <span className="font-bold">Moyenne</span>
      </HeaderCell>
    </div>
  );
}

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
          gridColumn: `span ${4 + criteres.length + maxObjectifs}`,
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
          {(critere) => {
            const IconComponent = CRITERE_TYPE_TO_ICON[critere.type];
            return (
              <HeaderCell className="!p-1" key={`critere-header-${critere.id}`}>
                <ModaleFicheCadrage critere={critere}>
                  <Bouton
                    className="!flex items-center text-left !px-2 !py-1"
                    iconLeft={
                      <Icone
                        className="shrink-0 w-4 h-4"
                        icone={IconComponent}
                      />
                    }
                    label={
                      <span className="line-clamp-1">{critere.libelle}</span>
                    }
                  />
                </ModaleFicheCadrage>
              </HeaderCell>
            );
          }}
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
        <HeaderGroup items={[]} label="Synthèse">
          {() => {
            return undefined;
          }}
        </HeaderGroup>
      </div>
    </>
  );
};
