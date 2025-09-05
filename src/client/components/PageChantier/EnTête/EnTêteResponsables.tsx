import { FunctionComponent } from "react";
import clsx from "clsx";
import Icône from "@/components/_commons/Icône/Icône";
import EnteteResponsablesStyled from "./EnTêteResponsables.styled";

interface ResponsableEnTete {
  libellé?: string;
  listeNomsResponsables: string[];
  icone: string;
  iconeStyle?: "icone" | "span";
  size?: "sm" | "md";
  isUppercase?: boolean;
}

export const ResponsableChantierEnTete: FunctionComponent<
  ResponsableEnTete
> = ({
  libellé,
  listeNomsResponsables,
  icone,
  iconeStyle = "span",
  size = "md",
  isUppercase = false,
}) => {
  const nomResponsable = listeNomsResponsables.join(", ") || "Non renseigné";

  return (
    <EnteteResponsablesStyled className="flex">
      <div className="icone-entete fr-mb-1w fr-pr-1w">
        {iconeStyle === "icone" ? (
          <Icône className="icone-entete " id={icone} />
        ) : (
          <span
            className={`${icone} ${size === "sm" ? "fr-pl-1v fr-pr-1v " : ""}`}
          />
        )}
      </div>
      <div className="fr-pl-1v fr-mt-1v">
        <p className={clsx(`fr-mb-0`, { "fr-text--xs": size === "sm" })}>
          {libellé ? <strong>{libellé}</strong> : null}
        </p>
        <p
          className={clsx(`fr-mb-0`, {
            "fr-text--xs": size === "sm",
            uppercase: isUppercase,
          })}
        >
          {nomResponsable}
        </p>
      </div>
    </EnteteResponsablesStyled>
  );
};
