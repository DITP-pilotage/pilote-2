import { useId } from "react";
import type { RowData } from "@tanstack/react-table";
import { Icone } from "@/components/_commons/Icone";
import { ArrowGoBackIcon } from "@/components/_commons/Icones/ArrowGoBackIcon";
import { LoupeContourIcon } from "@/components/_commons/Icones/LoupeContourIcon";
import { MultiSelectFiltre } from "@/components/_commons/MultiSelectFiltre/MultiSelectFiltre";
import type {
  AppFeatures,
  DataTable,
} from "@/components/shared/DataTable/createDataTableHook";
import type {
  DataTableColumnMeta,
  FilterDescriptor,
} from "@/components/shared/DataTable/types";
import type { featuresAnnuaire } from "./featuresAnnuaire";

export type TableAnnuaire<TData extends RowData> = DataTable<
  AppFeatures<typeof featuresAnnuaire>,
  TData
>;

const CLASSE_LIBELLE = "text-xs font-medium text-dsfr-grey-200";
const CLASSE_CHAMP =
  "h-10 w-full rounded-md border border-dsfr-grey-850 bg-white text-sm text-dsfr-grey-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dsfr-focus";

const filtreDe = (column: { columnDef: { meta?: unknown } }) =>
  (column.columnDef.meta as DataTableColumnMeta | undefined)?.filter;

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

function Recherche({
  valeur,
  placeholder,
  onChange,
}: {
  valeur: string;
  placeholder: string;
  onChange: (valeur: string) => void;
}) {
  const id = useId();
  return (
    <div className="flex w-full flex-col gap-1.5 md:w-80">
      <label className={CLASSE_LIBELLE} htmlFor={id}>
        Rechercher
      </label>
      <div className="relative">
        <Icone
          className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-dsfr-grey-625"
          icone={LoupeContourIcon}
        />
        <input
          className={`${CLASSE_CHAMP} pl-9 pr-3 placeholder:text-dsfr-grey-625`}
          id={id}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type="search"
          value={valeur}
        />
      </div>
    </div>
  );
}

function FiltreColonne({
  filtre,
  valeurs,
  onChange,
}: {
  filtre: FilterDescriptor;
  valeurs: string[];
  onChange: (valeurs: string[]) => void;
}) {
  const id = useId();
  if (filtre.type !== "multiselect") return null;
  return (
    <div
      aria-labelledby={id}
      className="flex w-full flex-col gap-1.5 md:w-64"
      role="group"
    >
      <span className={CLASSE_LIBELLE} id={id}>
        {filtre.label}
      </span>
      <MultiSelectFiltre
        classNameBouton={`${CLASSE_CHAMP} !px-3 !py-0 !font-normal !border !border-dsfr-grey-850 !border-b !border-b-dsfr-grey-850 !rounded-md !bg-white !text-left`}
        getOptionLabel={(valeur) =>
          filtre.options.find((option) => option.value === valeur)?.label ??
          valeur
        }
        getPlaceholder={(selection) =>
          selection.length === 0
            ? "Tous"
            : selection.length === 1
              ? (filtre.options.find((option) => option.value === selection[0])
                  ?.label ?? selection[0])
              : `${selection.length} sélectionnés`
        }
        onChange={onChange}
        optionGroups={
          filtre.groups?.map((groupe) => ({
            label: groupe.label,
            options: groupe.values,
          })) ?? [
            {
              label: "",
              options: filtre.options.map((option) => option.value),
            },
          ]
        }
        showGroupSelection={false}
        showSearch
        values={valeurs}
      />
    </div>
  );
}

export function FiltresAnnuaire<TData extends RowData>({
  table,
  placeholderRecherche,
  libelleResultats,
}: {
  table: TableAnnuaire<TData>;
  placeholderRecherche: string;
  libelleResultats: string;
}) {
  const colonnesFiltrables = table
    .getAllLeafColumns()
    .filter((column) => filtreDe(column) != null);
  const recherche = String(table.state.globalFilter ?? "");

  return (
    <section
      aria-label="Filtres du tableau"
      className="flex flex-col gap-4 border-b border-dsfr-grey-925 bg-dsfr-grey-1000 px-6 py-5"
    >
      <div className="flex flex-wrap items-end gap-4">
        <Recherche
          onChange={(valeur) => table.setGlobalFilter(valeur)}
          placeholder={placeholderRecherche}
          valeur={recherche}
        />
        {colonnesFiltrables.flatMap((column) => {
          const filtre = filtreDe(column);
          return filtre
            ? [
                <FiltreColonne
                  filtre={filtre}
                  key={column.id}
                  onChange={(selection) => column.setFilterValue(selection)}
                  valeurs={toStringArray(column.getFilterValue())}
                />,
              ]
            : [];
        })}
      </div>
      <div className="flex min-h-8 flex-wrap items-center gap-2">
        <span
          aria-live="polite"
          className="mr-2 text-sm font-medium text-dsfr-grey-50"
        >
          {libelleResultats}
        </span>
        <button
          className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md border border-primary bg-white px-3 text-sm font-medium text-primary hover:bg-dsfr-blue-france-950 disabled:cursor-not-allowed disabled:border-dsfr-grey-925 disabled:text-dsfr-grey-625 disabled:hover:bg-white"
          disabled={!table.hasActiveFilters()}
          onClick={() => table.resetFilters()}
          type="button"
        >
          <Icone
            className="h-3.5 w-3.5 rotate-y-180 text-current"
            icone={ArrowGoBackIcon}
          />
          Réinitialiser les filtres
        </button>
      </div>
    </section>
  );
}
