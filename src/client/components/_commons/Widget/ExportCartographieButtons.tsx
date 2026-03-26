import { RefObject, useCallback } from "react";
import { Icone } from "@/components/_commons/Icone";
import { Download1Icon } from "@/components/_commons/Icones/Download1Icon";
import { ClipboardIcon } from "@/components/_commons/Icones/ClipboardIcon";
import { Table2Icon } from "@/components/_commons/Icones/Table2Icon";
import { useExportCartographie } from "./useExportCartographie";

export const ExportCartographieButtons = ({
  widgetRef,
  nomFichier,
  genererCSV,
}: {
  widgetRef: RefObject<HTMLElement | null>;
  nomFichier: string;
  genererCSV: () => string;
}) => {
  const {
    enregistrerCommeImage,
    copierImageDansLePressePapiers,
    copierCSVDansLePressePapiers,
  } = useExportCartographie({ widgetRef, nomFichier });

  const handleExporterCSV = useCallback(() => {
    const csv = genererCSV();
    void copierCSVDansLePressePapiers(csv);
  }, [genererCSV, copierCSVDansLePressePapiers]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-grey-625">exporter :</span>
      <button
        className="p-1 rounded hover:bg-grey-975 !text-dsfr-blue-france-sun-113"
        onClick={enregistrerCommeImage}
        title="Télécharger l'image"
        type="button"
      >
        <Icone className="w-4 h-4" icone={Download1Icon} />
      </button>
      <button
        className="p-1 rounded hover:bg-grey-975 !text-dsfr-blue-france-sun-113"
        onClick={copierImageDansLePressePapiers}
        title="Copier l'image"
        type="button"
      >
        <Icone className="w-4 h-4" icone={ClipboardIcon} />
      </button>
      <button
        className="p-1 rounded hover:bg-grey-975 !text-dsfr-blue-france-sun-113"
        onClick={handleExporterCSV}
        title="Copier les données CSV"
        type="button"
      >
        <Icone className="w-4 h-4" icone={Table2Icon} />
      </button>
    </div>
  );
};
