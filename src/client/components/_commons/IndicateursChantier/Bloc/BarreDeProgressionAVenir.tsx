import clsx from "clsx";
import { BarreDeProgressionVariante } from "@/components/_commons/BarreDeProgression/BarreDeProgression";

export const BarreDeProgressionAVenir = ({
  variante,
}: {
  variante: BarreDeProgressionVariante;
}) => {
  console.log(variante);
  return (
    <div className="flex flex-col gap-1 text-current">
      <div className="font-bold">à venir</div>
      <div
        className={clsx("w-full h-3 rounded-full overflow-hidden", {
          "[background-image:repeating-linear-gradient(135deg,#1483ff_0_4px,#fff_4px_8px)]":
            variante === "bleu-dsfr-info",
          "[background-image:repeating-linear-gradient(135deg,#c3992a_0_4px,#fff_4px_8px)]":
            variante === "jaune-moutarde",
        })}
      />
    </div>
  );
};
