import {
  parseAsBoolean,
  parseAsInteger,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { ExportDesDonnees } from "@/components/PageAccueil/PageChantiers/ExportDesDonnees/ExportDesDonnees";
import { Icone } from "@/components/_commons/Icone";
import { Download1Icon } from "@/components/_commons/Icones/Download1Icon";

export const BoutonExportDesDonnees = ({
  territoireCode,
}: {
  territoireCode: string;
}) => {
  const [optionsExport, setOptionsExport] = useQueryStates({
    etapeCourante: parseAsInteger.withDefault(1).withOptions({
      shallow: true,
    }),
    isModaleExportCsvOuverte: parseAsBoolean.withDefault(false).withOptions({
      shallow: true,
      clearOnDefault: true,
      history: "push",
    }),
    typeExport: parseAsStringLiteral(["chantiers", "indicateurs"])
      .withDefault("chantiers")
      .withOptions({
        shallow: true,
      }),
  });

  return (
    <ExportDesDonnees
      onOpenChange={(open) => {
        if (open) {
          setOptionsExport({
            isModaleExportCsvOuverte: true,
            etapeCourante: 1,
            typeExport: "chantiers",
          });
        } else {
          setOptionsExport(
            {
              etapeCourante: 1,
              typeExport: "chantiers",
            },
            { clearOnDefault: true, shallow: true },
          );
          setOptionsExport(
            {
              isModaleExportCsvOuverte: false,
            },
            { clearOnDefault: true, shallow: true },
          );
        }
      }}
      open={optionsExport.isModaleExportCsvOuverte}
      territoireCodeSelectionne={territoireCode}
    >
      <button
        className="flex gap-1 !p-0 pb-0.5 !text-sm !text-primary border-b border-blue-france"
        type="button"
      >
        <Icone className="w-4 h-4" icone={Download1Icon} />
        Exporter les données
      </button>
    </ExportDesDonnees>
  );
};
