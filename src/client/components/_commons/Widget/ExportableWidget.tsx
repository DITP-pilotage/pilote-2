import { ReactNode } from "react";
import { Icone } from "@/components/_commons/Icone";
import { Download1Icon } from "@/components/_commons/Icones/Download1Icon";
import { ClipboardIcon } from "@/components/_commons/Icones/ClipboardIcon";
import { ModeExportContext } from "./ModeExportContext";
import { useExportImage } from "./useExportImage";

export const ExportableWidget = ({
  nomFichier,
  children,
}: {
  nomFichier: string;
  children: ReactNode;
}) => {
  const { ref, modeExport, enregistrerCommeImage, copierDansLePressePapiers } =
    useExportImage(nomFichier);

  return (
    <div className="flex flex-col gap-2">
      <ModeExportContext.Provider value={modeExport}>
        <div ref={ref}>{children}</div>
      </ModeExportContext.Provider>

      <div className="flex items-center justify-end">
        <span className="text-primary text-sm">exporter :</span>
        <button
          onClick={enregistrerCommeImage}
          type="button"
          aria-label="Enregistrer comme image"
        >
          <Icone className="w-4 h-4" icone={Download1Icon} />
        </button>
        <button
          onClick={copierDansLePressePapiers}
          type="button"
          aria-label="Copier dans le presse-papiers"
        >
          <Icone className="w-4 h-4" icone={ClipboardIcon} />
        </button>
      </div>
    </div>
  );
};
