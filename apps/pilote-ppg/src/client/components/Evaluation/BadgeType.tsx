import { Icone } from "@/components/_commons/Icone";
import { GovernmentIcon } from "@/components/_commons/Icones/GovernmentIcon";
import { Dashboard31Icon } from "@/components/_commons/Icones/Dashboard31Icon";
import { clsxm } from "@/utils/clsxm";

export const BadgeType = ({ type }: { type: "critere" | "objectif" }) => {
  let label = type === "critere" ? "Manière de servir" : "Objectif individuel";
  let icon =
    type === "critere" ? (
      <Icone className="text-current w-3 h-3" icone={GovernmentIcon} />
    ) : (
      <Icone className="text-current w-3 h-3" icone={Dashboard31Icon} />
    );

  return (
    <span
      className={clsxm(
        "px-1.5 py-1 rounded uppercase text-xs font-bold items-center inline-flex gap-1",
        {
          "bg-dsfr-brown-cafe-creme-950 text-dsfr-brown-cafe-creme-sun-383":
            type === "critere",
          "bg-dsfr-pink-macaron-950 text-dsfr-pink-macaron-sun-406":
            type === "objectif",
        },
      )}
    >
      {icon}
      {label}
    </span>
  );
};
