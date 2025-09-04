import {
  createColumnHelper,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  GroupingState,
  useReactTable,
} from "@tanstack/react-table";
import { ChangeEvent, useCallback, useState } from "react";
import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  useQueryState,
  useQueryStates,
} from "nuqs";
import TableauRéformesAvancement from "@/components/PageAccueil/TableauRéformes/Avancement/TableauRéformesAvancement";
import TableauRéformesMétéo from "@/components/PageAccueil/TableauRéformes/Météo/TableauRéformesMétéo";
import { calculerMoyenne } from "@/client/utils/statistiques/statistiques";
import { estLargeurDÉcranActuelleMoinsLargeQue } from "@/stores/useLargeurDÉcranStore/useLargeurDÉcranStore";
import TypologiesPictos from "@/components/PageAccueil/PageChantiers/TableauChantiers/TypologiesPictos/TypologiesPictos";
import IcônesMultiplesEtTexte from "@/components/_commons/IcônesMultiplesEtTexte/IcônesMultiplesEtTexte";
import TableauChantiersTendance from "@/components/PageAccueil/PageChantiers/TableauChantiers/Tendance/TableauChantiersTendance";
import TableauChantiersEcart from "@/components/PageAccueil/PageChantiers/TableauChantiers/Écart/TableauChantiersÉcart";
import Ministère from "@/server/domain/ministère/Ministère.interface";
import Infobulle from "@/components/_commons/Infobulle/Infobulle";
import infobulles from "@/client/constants/infobulles";
import TableauChantiersProps, {
  DonnéesTableauChantiers,
} from "./TableauChantiers.interface";
import TableauChantiersTuileChantier from "./Tuile/Chantier/TableauChantiersTuileChantier";
import TableauChantiersTuileMinistère from "./Tuile/Ministère/TableauChantiersTuileMinistère";
import TableauChantiersTuileMinistèreProps from "./Tuile/Ministère/TableauChantiersTuileMinistère.interface";

export const useTableauChantiers = (
  données: TableauChantiersProps["données"],
  ministèresDisponibles: Ministère[],
  nombreTotalChantiersAvecAlertes: number,
  chantiersSontArchives: boolean,
) => {
  const [valeurDeLaRecherche, setValeurDeLaRecherche] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({
      shallow: false,
      clearOnDefault: true,
      history: "push",
      throttleMs: 200,
    }),
  );

  const [pagination, setPagination] = useQueryStates(
    {
      pageIndex: parseAsInteger.withDefault(1),
      pageSize: parseAsInteger.withDefault(50),
    },
    {
      history: "push",
      shallow: false,
    },
  );

  const [estGroupe] = useQueryState(
    "groupeParMinistere",
    parseAsBoolean.withDefault(false),
  );

  const [regroupement, setRegroupement] = useState<GroupingState>(
    ministèresDisponibles.length > 1 && estGroupe ? ["porteur"] : [],
  );
  const estVueTuile = estLargeurDÉcranActuelleMoinsLargeQue("md");

  const reactTableColonnesHelper =
    createColumnHelper<DonnéesTableauChantiers>();

  const colonnesTableauChantiers = [
    reactTableColonnesHelper.accessor("porteur.nom", {
      header: "Porteur",
      id: "porteur",
      cell: (cellContext) => cellContext.getValue(),
      enableGrouping: true,
    }),
    reactTableColonnesHelper.accessor("nom", {
      header: "Chantiers",
      id: "nom",
      aggregatedCell: (aggregatedCellContext) => (
        <IcônesMultiplesEtTexte
          icônesId={
            aggregatedCellContext.row.original.porteur?.icône
              ? [aggregatedCellContext.row.original.porteur.icône]
              : []
          }
          texteAlternatifPourIcônes={
            aggregatedCellContext.row.original.porteur?.nom ?? undefined
          }
        >
          {aggregatedCellContext.row.original.porteur?.nom ?? ""}
        </IcônesMultiplesEtTexte>
      ),
      cell: (cellContext) =>
        cellContext.table.getColumn("porteur")?.getIsGrouped() ? (
          <IcônesMultiplesEtTexte icônesId={[]}>
            {cellContext.getValue()}
          </IcônesMultiplesEtTexte>
        ) : (
          <IcônesMultiplesEtTexte
            icônesId={
              cellContext.row.original.porteur?.icône
                ? [cellContext.row.original.porteur.icône]
                : []
            }
            texteAlternatifPourIcônes={
              cellContext.row.original.porteur?.nom ?? undefined
            }
          >
            {cellContext.getValue()}
          </IcônesMultiplesEtTexte>
        ),
      enableSorting: false,
      enableGrouping: false,
      meta: {
        width: "20rem",
      },
    }),
    reactTableColonnesHelper.accessor("typologie", {
      header: () => (
        <div className="flex align-center no-wrap">
          <span>Typologie</span>
          <Infobulle classNameBouton="infobulle-header-typologie">
            {infobulles.chantiers.listeDesChantiersHeaderTypologie}
          </Infobulle>
        </div>
      ),
      id: "typologie",
      enableSorting: false,
      cell: (cellContext) => (
        <TypologiesPictos typologies={cellContext.getValue()} />
      ),
      enableGrouping: false,
      meta: {
        width: "6.5rem",
        tabIndex: -1,
      },
    }),
    reactTableColonnesHelper.accessor("météo", {
      header: () => (
        <div className="flex align-center no-wrap">
          <span>Météo</span>
          <Infobulle classNameBouton="infobulle-header-meteo">
            {infobulles.chantiers.listeDesChantiersHeaderMeteo}
          </Infobulle>
        </div>
      ),
      id: "météo",
      cell: (cellContext) => (
        <TableauRéformesMétéo
          chantiersSontArchives={chantiersSontArchives}
          dateDeMàjDonnéesQualitatives={
            cellContext.row.original.dateDeMàjDonnéesQualitatives
          }
          météo={cellContext.getValue()}
        />
      ),
      enableGlobalFilter: false,
      enableGrouping: false,
      meta: {
        width: "8rem",
        tabIndex: -1,
      },
    }),
    reactTableColonnesHelper.accessor("dateDeMàjDonnéesQualitatives", {
      id: "dateDeMàjDonnéesQualitatives",
      cell: (cellContext) => cellContext.getValue(),
      enableGrouping: false,
    }),
    reactTableColonnesHelper.accessor("avancement", {
      header: () => (
        <div className="flex align-center no-wrap">
          <span className="whitespace-normal break-normal">
            Avancement 2026
          </span>
          <Infobulle classNameBouton="infobulle-header-taux-avancement">
            {infobulles.chantiers.listeDesChantiersHeaderTauxAvancement}
          </Infobulle>
        </div>
      ),
      id: "avancement",
      cell: (cellContext) => (
        <TableauRéformesAvancement
          avancement={cellContext.getValue()}
          dateDeMàjDonnéesQuantitatives={
            cellContext.row.original.dateDeMàjDonnéesQuantitatives
          }
          estArchive={chantiersSontArchives}
        />
      ),
      enableGlobalFilter: false,
      enableGrouping: false,
      aggregationFn: (_columnId, chantiersDuMinistèreRow) => {
        return calculerMoyenne(
          chantiersDuMinistèreRow.map(
            (chantierRow) => chantierRow.original.avancement,
          ),
        );
      },
      aggregatedCell: (avancement) => (
        <TableauRéformesAvancement
          avancement={avancement.getValue() ?? null}
          estArchive={chantiersSontArchives}
        />
      ),
      meta: {
        width: "8rem",
        tabIndex: -1,
      },
    }),
    reactTableColonnesHelper.accessor("dateDeMàjDonnéesQuantitatives", {
      id: "dateDeMàjDonnéesQuantitatives",
      cell: (cellContext) => cellContext.getValue(),
      enableGrouping: false,
    }),
    ...(process.env.NEXT_PUBLIC_FF_ALERTES === "true" &&
    process.env.NEXT_PUBLIC_FF_ALERTES_BAISSE === "true"
      ? [
          reactTableColonnesHelper.accessor("tendance", {
            header: () => (
              <div className="flex align-center no-wrap">
                <span>Tendance</span>
                <Infobulle classNameBouton="infobulle-header-tendance">
                  {infobulles.chantiers.listeDesChantiersHeaderTendance}
                </Infobulle>
              </div>
            ),
            id: "tendance",
            cell: (cellContext) => (
              <TableauChantiersTendance
                estArchive={chantiersSontArchives}
                tendance={cellContext.getValue()}
              />
            ),
            enableGrouping: false,
            meta: {
              width: "9rem",
              tabIndex: -1,
            },
          }),
          reactTableColonnesHelper.accessor("écart", {
            header: () => (
              <div className="flex align-center no-wrap">
                <span>Écart</span>
                <Infobulle classNameBouton="infobulle-header-écart">
                  {infobulles.chantiers.listeDesChantiersHeaderEcart}
                </Infobulle>
              </div>
            ),
            id: "écart",
            cell: (cellContext) => (
              <TableauChantiersEcart
                ecart={cellContext.getValue()}
                estArchive={chantiersSontArchives}
              />
            ),
            enableGrouping: false,
            aggregatedCell: () => null,
            meta: {
              width: "4.5rem",
              tabIndex: -1,
            },
          }),
        ]
      : []),
    reactTableColonnesHelper.display({
      id: "dérouler-groupe",
      aggregatedCell: (aggregatedCellContext) => (
        <button
          className={`${aggregatedCellContext.row.getIsExpanded() ? "fr-icon-arrow-up-s-line" : "fr-icon-arrow-down-s-line"} chevron-accordéon`}
          type="button"
        />
      ),
      meta: {
        width: "3.5rem",
        tabIndex: -1,
      },
    }),
    reactTableColonnesHelper.display({
      id: "chantier-tuile",
      cell: (chantierCellContext) => (
        <TableauChantiersTuileChantier
          afficherIcône={
            !chantierCellContext.table.getColumn("porteur")?.getIsGrouped()
          }
          chantier={chantierCellContext.row.original}
          chantiersSontArchives={chantiersSontArchives}
        />
      ),
      aggregatedCell: (aggregatedCellContext) => (
        <TableauChantiersTuileMinistère
          estArchive={chantiersSontArchives}
          estDéroulé={aggregatedCellContext.row.getIsExpanded()}
          ministère={
            aggregatedCellContext.getValue() as TableauChantiersTuileMinistèreProps["ministère"]
          }
        />
      ),
      aggregationFn: (_columnId, chantiersDuMinistèreRow) => {
        return {
          nom: chantiersDuMinistèreRow[0].original.porteur?.nom ?? "",
          icône: chantiersDuMinistèreRow[0].original.porteur?.icône ?? null,
          avancement: calculerMoyenne(
            chantiersDuMinistèreRow.map(
              (chantierRow) => chantierRow.original.avancement,
            ),
          ),
        } as TableauChantiersTuileMinistèreProps["ministère"];
      },
      enableSorting: false,
      enableGrouping: false,
    }),
  ];

  const tableau = useReactTable({
    data: données,
    columns: colonnesTableauChantiers,
    state: {
      pagination,
      grouping: regroupement,
      columnVisibility: estVueTuile
        ? {
            porteur: false,
            nom: false,
            météo: false,
            dateDeMàjDonnéesQualitatives: false,
            avancement: false,
            dateDeMàjDonnéesQuantitatives: false,
            typologie: false,
            tendance: false,
            écart: false,
            "dérouler-groupe": false,
          }
        : {
            porteur: false,
            "chantier-tuile": false,
            dateDeMàjDonnéesQualitatives: false,
            dateDeMàjDonnéesQuantitatives: false,
            "dérouler-groupe": estGroupe,
          },
    },
    manualPagination: true,
    onPaginationChange: setPagination,
    pageCount:
      nombreTotalChantiersAvecAlertes % 10 === 0
        ? Math.trunc(nombreTotalChantiersAvecAlertes / pagination.pageSize)
        : Math.trunc(nombreTotalChantiersAvecAlertes / pagination.pageSize) + 1,
    onGroupingChange: setRegroupement,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const changementDeLaRechercheCallback = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setPagination({
        pageIndex: 1,
      });
      setValeurDeLaRecherche(event.target.value);
    },
    [setPagination, setValeurDeLaRecherche],
  );

  return {
    tableau,
    changementDeLaRechercheCallback,
    valeurDeLaRecherche,
    estVueTuile,
  };
};
