import "@gouvfr/dsfr/dist/component/tag/tag.min.css";
import { FunctionComponent } from "react";
import { clsxm } from "@/utils/clsxm";
import { Icone } from "@/components/_commons/Icone";
import { CloseLineIcon } from "@/components/_commons/Icones/CloseLineIcon";
import TagStyled from "./Tag.styled";

interface TagProps {
  libelle: string;
  suppressionCallback: () => void;
  color?: "blue-france" | "warning" | "yellow-moutarde" | "blue-info-main";
  size?: "sm" | "md";
  doitAvoirUneTailleFixe?: boolean;
}

export const Tag: FunctionComponent<TagProps> = ({
  libelle,
  suppressionCallback,
  color = "blue-france",
  size = "md",
  doitAvoirUneTailleFixe = false,
}) => {
  return (
    <TagStyled
      className={clsxm(`fr-tag flex gap-1 mr-2`, color, {
        "fr-tag--sm": size === "sm",
        "fr-tag--fixed-width": doitAvoirUneTailleFixe,
      })}
    >
      <span>{libelle}</span>
      <button
        aria-label={`Retirer le tag ${libelle}`}
        className="ml-1"
        onClick={suppressionCallback}
        title="Supprimer filtre"
        type="button"
      >
        <Icone className="w-4 h-4 !text-current" icone={CloseLineIcon} />
      </button>
    </TagStyled>
  );
};

export default Tag;
