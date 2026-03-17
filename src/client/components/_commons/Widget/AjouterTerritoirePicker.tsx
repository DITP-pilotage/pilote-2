import { useMemo } from "react";
import { territoiresGroupesPourPicker } from "@/client/constants/territoires";
import { Picker } from "@/components/shared/Picker";
import { Select } from "@/components/shared/Select";

export const AjouterTerritoirePicker = ({
  territoiresSelectionnesCodes,
  onAjouterTerritoire,
  onAjouterTerritoires,
}: {
  territoiresSelectionnesCodes: string[];
  onAjouterTerritoire: (code: string) => void;
  onAjouterTerritoires: (codes: string[]) => void;
}) => {
  const groupedOptions = useMemo(() => {
    const selectedCodes = new Set(territoiresSelectionnesCodes);

    return territoiresGroupesPourPicker
      .map((group) => ({
        ...group,
        options: group.options.filter((opt) => !selectedCodes.has(opt.valeur)),
      }))
      .filter((group) => group.options.length > 0);
  }, [territoiresSelectionnesCodes]);

  if (groupedOptions.length === 0) {
    return null;
  }

  return (
    <Picker
      key={territoiresSelectionnesCodes.length}
      onValueChange={(valeur) => onAjouterTerritoire(valeur)}
      onValuesChange={onAjouterTerritoires}
      options={groupedOptions}
      trigger={
        <Select.LinkButtonTrigger className="mt-2">
          + ajouter un territoire
        </Select.LinkButtonTrigger>
      }
    />
  );
};
