import { FunctionComponent } from "react";
import { Icone } from "@/components/_commons/Icone";
import { CheckLineIcon } from "@/components/_commons/Icones/CheckLineIcon";

interface FiltresSélectionnésCatégorieProps {
  titre: string;
  filtres: string[];
  className?: string;
}

const FiltresSélectionnésCatégorie: FunctionComponent<
  FiltresSélectionnésCatégorieProps
> = ({ titre, filtres, className }) => {
  if (filtres.length === 0) {
    return (
      <h3
        className={`!text-base !mb-1 ${className ?? ""}`}
      >{`${titre} (Tous)`}</h3>
    );
  }

  return (
    <div className={className}>
      <h3 className="!text-base !mb-1">{`${titre} (${filtres.length})`}</h3>
      <ul className="!p-0 !m-0">
        {filtres.map((filtre) => (
          <li
            className="flex align-start !text-sm !text-dsfr-mention-grey !mb-1 list-none gap-2"
            key={filtre}
          >
            <div>
              <Icone className="text-dsfr-success-425" icone={CheckLineIcon} />
            </div>
            {filtre}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FiltresSélectionnésCatégorie;
