import { ReactNode, startTransition, useState } from "react";
import { PillToggleGroup } from "@/components/shared/PillToggleGroup";
import { EqualizerIcon } from "@/components/_commons/Icones/EqualizerIcon";
import { GridIcon } from "@/components/_commons/Icones/GridIcon";
import { LineChartIcon } from "@/components/_commons/Icones/LineChartIcon";
import { TitreWidget } from "@/components/_commons/Widget/BaseCartographieWidgetLayout";

export type VueWidget = "situation" | "tableau" | "courbes";

type SelecteurVueWidgetProps = {
  titre: string;
  jalon: number;
  renderVue: (vue: VueWidget) => ReactNode;
};

export const SelecteurVueWidget = ({
  titre,
  jalon,
  renderVue,
}: SelecteurVueWidgetProps) => {
  const [vueActive, setVueActive] = useState<VueWidget>("situation");

  return (
    <>
      <TitreWidget>{titre}</TitreWidget>
      <PillToggleGroup.Root
        type="single"
        value={vueActive}
        onValueChange={(value) => {
          if (value) {
            startTransition(() => {
              setVueActive(value as VueWidget);
            });
          }
        }}
      >
        <PillToggleGroup.Item value="situation">
          <EqualizerIcon className="w-3 h-3" />
          situation en {jalon}
        </PillToggleGroup.Item>
        <PillToggleGroup.Item value="tableau">
          <GridIcon className="w-3 h-3" />
          évolution temporelle - tableau
        </PillToggleGroup.Item>
        <PillToggleGroup.Item value="courbes">
          <LineChartIcon className="w-3 h-3" />
          évolution temporelle - courbes
        </PillToggleGroup.Item>
      </PillToggleGroup.Root>
      {renderVue(vueActive)}
    </>
  );
};
