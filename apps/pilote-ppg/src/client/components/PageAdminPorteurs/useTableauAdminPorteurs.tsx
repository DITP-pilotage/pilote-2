import { createColumnHelper, useReactTable } from "@tanstack/react-table";
import { useMemo } from "react";
import { $Enums } from "@prisma/client";
import { BadgeStatutReferentiel } from "@/components/_commons/BadgeStatutReferentiel";
import { formaterDateCourte } from "@/client/utils/date/date";
import {
  useEtatTableauAdmin,
  type ConfigFiltreColonne,
} from "@/components/_commons/TableauAdmin/useEtatTableauAdmin";
import { FILTRE_STATUT_REFERENTIEL } from "@/components/_commons/TableauAdmin/constants";
import { statutReferentielDe } from "@/components/_commons/TableauAdmin/utils";
import type { PorteurAdminListItem } from "@/server/metadataPorteur/queries/ListerPorteursAdminQuery";

export const TYPE_BADGE: Record<
  $Enums.porteur_type,
  { label: string; className: string }
> = {
  MIN: {
    label: "Ministère",
    className: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  },
  DAC: {
    label: "DAC",
    className: "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200",
  },
  DI: {
    label: "DI",
    className: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200",
  },
  AUTRE: {
    label: "Autre",
    className: "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200",
  },
};

export const OPTIONS_TYPE_PORTEUR = Object.entries(TYPE_BADGE).map(
  ([valeur, { label }]) => ({ valeur, label }),
);

const FILTRES: ConfigFiltreColonne[] = [
  FILTRE_STATUT_REFERENTIEL,
  { parametre: "type", colonneId: "porteurType", valeursParDefaut: [] },
];

const champsRecherche = (porteur: PorteurAdminListItem) => [
  porteur.porteurId,
  porteur.porteurShort,
  porteur.porteurName,
];

const columnHelper = createColumnHelper<PorteurAdminListItem>();

const useTableColumns = () =>
  useMemo(
    () => [
      columnHelper.accessor("porteurId", {
        id: "porteurId",
        header: "ID",
      }),
      columnHelper.accessor("porteurShort", {
        id: "porteurShort",
        header: "Sigle",
      }),
      columnHelper.accessor("porteurName", {
        id: "porteurName",
        header: "Nom",
        cell: (info) => (
          <span
            className={
              info.row.original.deletedAt !== null
                ? "line-through text-gray-400"
                : ""
            }
          >
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("porteurType", {
        id: "porteurType",
        header: "Type",
        enableColumnFilter: true,
        filterFn: "arrIncludesSome",
        cell: (info) => {
          const type = info.getValue();
          const typeBadge =
            type && type in TYPE_BADGE ? TYPE_BADGE[type] : null;
          return (
            typeBadge && (
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeBadge.className}`}
              >
                {typeBadge.label}
              </span>
            )
          );
        },
      }),
      columnHelper.accessor(
        (porteur) => statutReferentielDe(porteur.deletedAt),
        {
          id: "statut",
          header: "Statut",
          enableColumnFilter: true,
          filterFn: "arrIncludesSome",
          cell: (info) => (
            <BadgeStatutReferentiel supprimé={info.getValue() === "SUPPRIME"} />
          ),
        },
      ),
      columnHelper.accessor("updatedAt", {
        id: "updatedAt",
        header: "Mise à jour",
        cell: (info) => formaterDateCourte(new Date(info.getValue())),
      }),
    ],
    [],
  );

export const useTableauAdminPorteurs = (porteurs: PorteurAdminListItem[]) => {
  const columns = useTableColumns();
  const { optionsTable, aDesFiltresActifs, reinitialiserLesFiltres } =
    useEtatTableauAdmin<PorteurAdminListItem>({
      filtres: FILTRES,
      champsRecherche,
    });

  const table = useReactTable({ data: porteurs, columns, ...optionsTable });

  return { table, aDesFiltresActifs, reinitialiserLesFiltres };
};
