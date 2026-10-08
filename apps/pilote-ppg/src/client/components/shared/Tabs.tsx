import type { ReactNode } from "react";
import { Tabs as BaseTabs } from "radix-ui";

type TabItem = {
  value: string;
  label: string;
};

type TabsProps = {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  children?: ReactNode;
};

export const Tabs = ({ items, value, onValueChange, children }: TabsProps) => {
  return (
    <BaseTabs.Root onValueChange={onValueChange} value={value}>
      <BaseTabs.List className="flex gap-0 !border-b-1 !border-dsfr-mention-grey overflow-x-auto">
        {items.map((item) => (
          <BaseTabs.Trigger
            className="!px-6 !py-3 !text-sm !font-medium !transition-colors !border-b-2 data-[state=active]:!border-primary data-[state=active]:!text-primary !border-transparent !text-gray-700 hover:!text-gray-900 whitespace-nowrap flex-shrink-0"
            key={item.value}
            value={item.value}
          >
            {item.label}
          </BaseTabs.Trigger>
        ))}
      </BaseTabs.List>
      {children !== undefined && (
        <BaseTabs.Content value={value}>{children}</BaseTabs.Content>
      )}
    </BaseTabs.Root>
  );
};
