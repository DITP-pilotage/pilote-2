import { ReactNode } from "react";
import { Icone } from "@/components/_commons/Icone";
import { Download1Icon } from "@/components/_commons/Icones/Download1Icon";
import { BoutonCopier } from "@/components/_commons/BoutonCopier/BoutonCopier";
import { useEnv } from "@/client/hooks/useEnv";
import { ModeExportContext } from "./ModeExportContext";
import { useExportImage } from "./useExportImage";

export const ExportableWidget = ({
  nomFichier,
  boutonExportCsv,
  children,
}: {
  nomFichier: string;
  boutonExportCsv?: ReactNode;
  children: ReactNode;
}) => {
  const ffExportWidgets = useEnv("NEXT_PUBLIC_FF_EXPORT_CSV_WIDGETS");
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
        <BoutonCopier
          libelle="Copier dans le presse-papiers"
          onClick={copierDansLePressePapiers}
        />
        {ffExportWidgets && boutonExportCsv}
      </div>
    </div>
  );
};
