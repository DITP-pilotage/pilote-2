import { ReactNode } from "react";
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
          <button
            className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm"
            onClick={onSupprimer}
            type="button"
          >
            <Icone className="w-4 h-4 mr-1" icone={DeleteIcon} />
            supprimer la carte
          </button>
        ) : (
          <button
            className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm"
            onClick={onComparer}
            type="button"
          >
            + comparer avec une autre carte
          </button>
        )}
      </div>

      <ExportableWidget nomFichier={nomFichier}>
        {renderCarte(typeCarte)}
      </ExportableWidget>
    </div>
  );
};
