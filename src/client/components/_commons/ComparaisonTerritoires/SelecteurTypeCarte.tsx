import { Select } from "@/components/shared/Select";

type SelecteurTypeCarteProps<T extends string> = {
  typeCarte: T;
  options: { value: T; label: string }[];
  onChange: (type: T) => void;
};

export const SelecteurTypeCarte = <T extends string>({
  typeCarte,
  options,
  onChange,
}: SelecteurTypeCarteProps<T>) => {
  const labelSelectionne = options.find((o) => o.value === typeCarte)?.label;

  return (
    <Select.Root
      value={typeCarte}
      onValueChange={(value) => onChange(value as T)}
    >
      <Select.Trigger className="w-full">
        <Select.Value>{labelSelectionne}</Select.Value>
      </Select.Trigger>
      <Select.Content>
        {options.map((option) => (
          <Select.Item key={option.value} value={option.value}>
            {option.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
};
