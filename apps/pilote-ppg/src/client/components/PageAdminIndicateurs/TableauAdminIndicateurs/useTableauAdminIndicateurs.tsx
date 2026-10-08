import {
  columnFilteringFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumericCaseSensitive,
  tableFeatures,
} from "@tanstack/react-table";
import {
  ChangeEvent,
  ChangeEventHandler,
  FormEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createDataTableHook } from "@/components/shared/DataTable/createDataTableHook";
import rechercheUnTexteContenuDansUnContenant from "@/client/utils/rechercheUnTexteContenuDansUnContenant";
import { api } from "@/server/framework/trpc/api";
import { filtresModifierIndicateursActifsStore } from "@/stores/useFiltresModifierIndicateursStore/useFiltresModifierIndicateursStore";
import { MetadataParametrageIndicateurInformationContrat } from "@/server/app/contrats/MetadataParametrageIndicateurContrat";
import { formaterDate, horodatage } from "@/client/utils/date/date";
import AlerteProps from "@/components/_commons/Alerte/Alerte.interface";
import { Chantier } from "@/shared/chantier/Chantier.interface";
import { CloseCircleIcon } from "@/components/_commons/Icones/CloseCircleIcon";
import { Icone } from "@/components/_commons/Icone";
import { SuccessIcon } from "@/components/_commons/Icones/SuccessIcon";

const featuresTableauAdminIndicateurs = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: { alphanumericCaseSensitive: sortFn_alphanumericCaseSensitive },
});

const adminIndicateurs = createDataTableHook(featuresTableauAdminIndicateurs);
const reactTableColonnesHelper =
  adminIndicateurs.createColumnHelper<MetadataParametrageIndicateurInformationContrat>();
const colonnes = reactTableColonnesHelper.columns([
  reactTableColonnesHelper.accessor("indicParentCh", {
    header: "Chantier associé",
    enableSorting: true,
    cell: (props) => props.getValue(),
  }),
  reactTableColonnesHelper.accessor("chantierNom", {
    header: "Nom du chantier",
    enableSorting: true,
    cell: (props) => props.getValue(),
  }),
  reactTableColonnesHelper.accessor("indicId", {
    header: "Identifiant indicateur",
    enableSorting: true,
    sortFn: "alphanumericCaseSensitive",
    cell: (props) => props.getValue(),
  }),
  reactTableColonnesHelper.accessor("indicNom", {
    header: "Nom de l'indicateur",
    enableSorting: true,
    sortFn: "auto",
    cell: (props) => props.getValue(),
  }),
  reactTableColonnesHelper.accessor(
    (row) =>
      `${formaterDate(row.dateDerniereModification, "DD/MM/YYYY")} par ${row.auteurDerniereModification}`,
    {
      id: "Dernière modification",
      header: "Dernière modification",
      enableSorting: true,
      cell: (props) => props.getValue(),
      sortFn: (a, b) => {
        const dateA = new Date(a.original.dateDerniereModification);
        const dateB = new Date(b.original.dateDerniereModification);

        if (dateA.getTime() > dateB.getTime()) {
          return 1;
        }

        if (dateA.getTime() < dateB.getTime()) {
          return -1;
        }

        return 0;
      },
    },
  ),
  reactTableColonnesHelper.accessor("indicHiddenPilote", {
    header: "Actif / Inactif",
    enableSorting: true,
    sortFn: "auto",
    cell: (props) => {
      return (
        <div className="flex justify-center">
          <span className="sr-only">
            {props.getValue() ? "Inactif" : "Actif"}
          </span>
          {props.getValue() ? (
            <Icone className="text-error" icone={CloseCircleIcon} />
          ) : (
            <Icone className="text-success" icone={SuccessIcon} />
          )}
        </div>
      );
    },
  }),
]);

export default function useTableauPageAdminIndicateurs() {
  const filtresActifs = filtresModifierIndicateursActifsStore();

  const [file, setFile] = useState<File | null>(null);
  const [alerte, setAlerte] = useState<AlerteProps | null>(null);

  const { data: metadataIndicateurs = [], isLoading: estEnChargement } =
    api.parametrageIndicateur.listerMetadataIndicateurFiltres.useQuery({
      filtres: filtresActifs,
    });

  const exporterLesIndicateurs = () => {
    let queryParam = `?estTerritorialise=${filtresActifs.estTerritorialise}&estBarometre=${filtresActifs.estBarometre}`;

    if (filtresActifs.chantiers.length > 0) {
      queryParam =
        queryParam +
        "&" +
        filtresActifs.chantiers
          .map((chantier) => `chantierIds=${chantier}`)
          .join("&");
    }

    if (filtresActifs.perimetresMinisteriels.length > 0) {
      queryParam =
        queryParam +
        "&" +
        filtresActifs.perimetresMinisteriels
          .map((perimetre) => `perimetreIds=${perimetre}`)
          .join("&");
    }

    const url = `/api/export/metadata-indicateurs${queryParam}`;
    const a = window.document.createElement("a");
    a.href = url;
    a.target = "_self";
    a.download = `metadata-indicateurs-${horodatage()}.csv`;
    document.body.append(a);
    a.click();
    a.remove();
  };

  const table = adminIndicateurs.useDataTable({
    data: metadataIndicateurs,
    columns: colonnes,
    rowHeader: "indicNom",
    getRowHref: (row) =>
      `/panel-administrateur/indicateurs/${row.original.indicId}`,
    globalFilterFn: (ligne, colonneId, texteRecherché) => {
      const valeurCellule = ligne.getValue<Chantier>(colonneId);
      return (
        valeurCellule !== null &&
        rechercheUnTexteContenuDansUnContenant(
          texteRecherché,
          valeurCellule.toString(),
        )
      );
    },
    urlState: {
      sorting: { default: [{ id: "Dernière modification", desc: true }] },
      pagination: { pageSize: 20 },
      globalFilter: true,
    },
  });

  const filtresPrécédents = useRef(filtresActifs);
  useEffect(() => {
    if (filtresPrécédents.current === filtresActifs) return;
    filtresPrécédents.current = filtresActifs;
    table.setPageIndex(0);
  }, [filtresActifs, table]);

  const changementDeLaRechercheCallback = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      table.setGlobalFilter(event.target.value),
    [table],
  );
  const valeurDeLaRecherche = table.store.state.globalFilter ?? "";

  const définirLeFichier: ChangeEventHandler<HTMLInputElement> = (event) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  type UploadFichierFormulaireElement = {
    "file-upload": HTMLInputElement;
  } & HTMLFormElement;

  const verifierLeFichier: FormEventHandler<
    UploadFichierFormulaireElement
  > = async (event) => {
    event.preventDefault();

    if (!file) {
      return;
    }

    event.currentTarget["file-upload"].value = "";

    const body = new FormData();

    body.append("file", file);

    const result = await fetch("/api/import/metadata-indicateurs", {
      method: "POST",
      body,
    });

    if (result.status === 200) {
      setAlerte({
        type: "succès",
        titre: "Import de masse réussie",
      });
    } else {
      const errorResponse = (await result.json()) as { message: string };
      setAlerte({
        type: "erreur",
        titre: "Une erreur est survenue",
        message: `Une erreur interne est survenu : ${errorResponse.message}`,
      });
    }
  };

  return {
    file,
    alerte,
    définirLeFichier,
    verifierLeFichier,
    table,
    estEnChargement,
    valeurDeLaRecherche,
    exporterLesIndicateurs,
    changementDeLaRechercheCallback,
  };
}
