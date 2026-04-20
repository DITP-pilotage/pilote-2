import { TuileWidget } from "@/components/_commons/Widget/TuileWidget/TuileWidget";
import { ColonneTauxAvancement } from "./ColonneTauxAvancement";
import { ColonneSituation } from "./ColonneSituation";

export const AvancementChantierWidget = () => {
  return (
    <TuileWidget>
      <ColonneTauxAvancement />
      <ColonneSituation />
    </TuileWidget>
  );
};
