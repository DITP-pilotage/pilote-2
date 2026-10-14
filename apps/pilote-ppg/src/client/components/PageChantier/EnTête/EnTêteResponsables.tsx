import { ComponentType, FunctionComponent } from "react";
import { Icone } from "@/components/_commons/Icone";

export const ResponsableChantierEnTete: FunctionComponent<{
  libellé: string;
  listeNomsResponsables: string[];
  icone: ComponentType<{ className: string; fill: string }>;
}> = ({ libellé, listeNomsResponsables, icone }) => {
  const nomResponsable = listeNomsResponsables.join(", ") || "Non renseigné";

  return (
    <div className="flex gap-2">
      <div>
        <Icone className="text-current" icone={icone} />
      </div>
      <div>
        <p className="text-xs print:text-base mb-0 font-bold">{libellé}</p>
        <p className="text-xs print:text-base mb-0">{nomResponsable}</p>
      </div>
    </div>
  );
};
