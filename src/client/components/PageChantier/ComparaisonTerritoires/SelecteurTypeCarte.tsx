import { Select } from "@/components/shared/Select";
import { TypeCarte } from "./ComparaisonTerritoires.interface";

type SelecteurTypeCarteProps = {
  jalon: number;
  typeCarte: TypeCarte;
  onChange: (type: TypeCarte) => void;
};

const labels: Record<TypeCarte, (jalon: number) => string> = {
  ta: (jalon) => `Carte des taux d'avancement ${jalon}`,
  meteo: () => "Carte des niveaux de confiance",
  pva: () => "Carte des propositions des valeurs d'avancement",
};

export const SelecteurTypeCarte = ({
  jalon,
  typeCarte,
  onChange,
}: SelecteurTypeCarteProps) => {
  return (
    <Select.Root
      value={typeCarte}
      onValueChange={(value) => onChange(value as TypeCarte)}
    >
      <Select.Trigger className="w-full">
        <Select.Value>{labels[typeCarte](jalon)}</Select.Value>
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="ta">{labels.ta(jalon)}</Select.Item>
        <Select.Item value="meteo">{labels.meteo(jalon)}</Select.Item>
        <Select.Item value="pva">{labels.pva(jalon)}</Select.Item>
      </Select.Content>
    </Select.Root>
  );
};
