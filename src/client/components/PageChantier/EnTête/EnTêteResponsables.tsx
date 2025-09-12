import { ComponentType, FunctionComponent } from "react";
import { Icone } from "@/components/_commons/Icone";

export const ResponsableChantierEnTete: FunctionComponent<{
  libellé: string;
  listeNomsResponsables: string[];
  icone: ComponentType<{ className: string; fill: string }>;
}> = ({ libellé, listeNomsResponsables, icone }) => {
  const nomResponsable = listeNomsResponsables.join(", ") || "Non renseigné";

  return (
    <div className="flex my-1">
      <div className="mx-2">
        <Icone icone={icone} />
      </div>
      <div>
        <p className="!mb-0 fr-text--xs bold">{libellé}</p>
        <p className="!mb-0 fr-text--xs">{nomResponsable}</p>
      </div>
    </div>
  );
};
