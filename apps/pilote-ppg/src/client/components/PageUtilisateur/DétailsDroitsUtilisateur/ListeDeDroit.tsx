import { useId } from "react";
import clsx from "clsx";
import { Icone } from "@/components/_commons/Icone";
import { CloseLineIcon } from "@/components/_commons/Icones/CloseLineIcon";
import { CheckLineIcon } from "@/components/_commons/Icones/CheckLineIcon";

export type ElementListeDroitType = {
  label: string;
  className?: string;
};

export const ListeDeDroit = ({
  label,
  listeElement,
}: {
  label: string;
  listeElement: ElementListeDroitType[];
}) => {
  const id = useId();

  if (listeElement.length === 0) {
    return (
      <div className="w-full shrink-0 md:w-1/2">
        <p className="text-base font-bold mb-1">{label}</p>
        <div className="flex mb-0">
          <div className="mr-2">
            <Icone className="text-dsfr-warning-425" icone={CloseLineIcon} />
          </div>
          <p className="text-sm print:text-base mb-0">Aucun droit</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full shrink-0 md:w-1/2">
      <p className="text-base font-bold mb-1">{label}</p>
      {listeElement.map((element, index) => (
        <div className="flex" key={`${id}-${element}-${index}`}>
          <div className="mr-2">
            <Icone className="text-dsfr-success-425" icone={CheckLineIcon} />
          </div>
          <p
            className={clsx("text-sm print:text-base mb-0", element.className)}
          >
            {element.label}
          </p>
        </div>
      ))}
    </div>
  );
};
