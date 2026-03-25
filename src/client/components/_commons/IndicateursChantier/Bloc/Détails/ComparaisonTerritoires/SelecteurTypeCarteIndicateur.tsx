import { Select } from "@/components/shared/Select";
import { TypeCarteIndicateur } from "./ComparaisonTerritoires.interface";

type SelecteurTypeCarteIndicateurProps = {
  jalon: number;
  typeCarte: TypeCarteIndicateur;
  onChange: (type: TypeCarteIndicateur) => void;
};

const labels: Record<TypeCarteIndicateur, (jalon: number) => string> = {
  ta: (jalon) => `Carte des taux d'avancement ${jalon}`,
  valeurAvancement: () => "Carte des valeurs d'avancement",
};

export const SelecteurTypeCarteIndicateur = ({
  jalon,
  typeCarte,
  onChange,
}: SelecteurTypeCarteIndicateurProps) => {
  return (
    <Select.Root
      value={typeCarte}
      onValueChange={(value) => onChange(value as TypeCarteIndicateur)}
    >
      <Select.Trigger className="w-full">
        <Select.Value>{labels[typeCarte](jalon)}</Select.Value>
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="ta">{labels.ta(jalon)}</Select.Item>
        <Select.Item value="valeurAvancement">
          {labels.valeurAvancement(jalon)}
        </Select.Item>
      </Select.Content>
    </Select.Root>
  );
};
