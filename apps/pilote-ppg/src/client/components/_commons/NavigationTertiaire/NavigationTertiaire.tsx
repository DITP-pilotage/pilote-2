import { Tabs } from "radix-ui";

type NavigationTertiaireItem = {
  value: string;
  label: string;
};

type NavigationTertiaireProps = {
  items: NavigationTertiaireItem[];
  value: string;
  onValueChange: (value: string) => void;
};

export const NavigationTertiaire = ({
  items,
  value,
  onValueChange,
}: NavigationTertiaireProps) => {
  return (
    <Tabs.Root onValueChange={onValueChange} value={value}>
      <Tabs.List className="flex gap-0 !border-b-1 !border-dsfr-mention-grey overflow-x-auto">
        {items.map((item) => (
          <Tabs.Trigger
            className="!px-6 !py-3 !text-sm !font-medium !transition-colors !border-b-2 data-[state=active]:!border-primary data-[state=active]:!text-primary !border-transparent !text-gray-700 hover:!text-gray-900 whitespace-nowrap flex-shrink-0"
            key={item.value}
            value={item.value}
          >
            {item.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
};
