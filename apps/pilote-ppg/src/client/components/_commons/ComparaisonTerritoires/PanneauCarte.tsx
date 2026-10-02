import { ReactNode } from "react";
import { Button } from "@/components/shared/Button";
import { Icone } from "@/components/_commons/Icone";
import { DeleteIcon } from "@/components/_commons/Icones/DeleteIcon";
import { ExportableWidget } from "@/components/_commons/Widget/ExportableWidget";
import { SelecteurTypeCarte } from "./SelecteurTypeCarte";

type PanneauCarteProps<T extends string> = {
  typeCarte: T;
  options: { value: T; label: string }[];
  estEnComparaison: boolean;
  onChangerType: (type: T) => void;
  onComparer: () => void;
  onSupprimer: () => void;
  renderCarte: (typeCarte: T) => ReactNode;
  renderBoutonExportCsv: (typeCarte: T) => ReactNode;
  nomFichier: string;
};

export const PanneauCarte = <T extends string>({
  typeCarte,
  options,
  estEnComparaison,
  onChangerType,
  onComparer,
  onSupprimer,
  renderCarte,
  renderBoutonExportCsv,
  nomFichier,
}: PanneauCarteProps<T>) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-2">
        <SelecteurTypeCarte
          typeCarte={typeCarte}
          options={options}
          onChange={onChangerType}
        />
        {estEnComparaison ? (
          <Button
            variant="tertiary-no-outline"
            size="sm"
            onClick={onSupprimer}
            type="button"
          >
            <Icone className="w-4 h-4 mr-1" icone={DeleteIcon} />
            supprimer la carte
          </Button>
        ) : (
          <Button
            variant="tertiary-no-outline"
            size="sm"
            onClick={onComparer}
            type="button"
          >
            + comparer avec une autre carte
          </Button>
        )}
      </div>

      <ExportableWidget
        boutonExportCsv={renderBoutonExportCsv(typeCarte)}
        nomFichier={nomFichier}
      >
        {renderCarte(typeCarte)}
      </ExportableWidget>
    </div>
  );
};
