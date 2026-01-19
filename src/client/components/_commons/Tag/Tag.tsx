import "@gouvfr/dsfr/dist/component/tag/tag.min.css";
import { FunctionComponent, ComponentType } from "react";
import { clsxm } from "@/utils/clsxm";
import { Icone } from "@/components/_commons/Icone";

interface TagProps {
  libelle: string;
  onClick?: () => void;
  color?: "blue-france" | "warning" | "yellow-moutarde" | "blue-info-main";
  size?: "sm" | "md";
  doitAvoirUneTailleFixe?: boolean;
  iconLeft?: ComponentType<{ className: string; fill: string }>;
  iconRight?: ComponentType<{ className: string; fill: string }>;
  isActive?: boolean;
}

export const Tag: FunctionComponent<TagProps> = ({
  libelle,
  onClick,
  color = "blue-france",
  size = "md",
  iconLeft,
  iconRight,
  doitAvoirUneTailleFixe = false,
  isActive = false,
}) => {
  return (
    <button
      className={clsxm(`fr-tag flex gap-1 mr-2 !text-primary over`, {
        "fr-tag--sm": size === "sm",
        "!bg-primary !text-white": isActive,
        "!bg-[#0078f3] !text-white": color === "blue-info-main",
        "!bg-dsfr-warning-425 !text-white": color === "warning",
        "!bg-dsfr-moutarde-main-850 !text-black": color === "yellow-moutarde",
      })}
      onClick={onClick}
      type="button"
    >
      {iconLeft ? (
        <Icone className="w-4 h-4 !text-current" icone={iconLeft} />
      ) : null}
      <span
        className={clsxm({
          "!max-w-[30ch] truncate": doitAvoirUneTailleFixe,
        })}
      >
        {libelle}
      </span>
      {iconRight ? (
        <Icone className="w-4 h-4 !text-current" icone={iconRight} />
      ) : null}
    </button>
  );
};

export default Tag;
