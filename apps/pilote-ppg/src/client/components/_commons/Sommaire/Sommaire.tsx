import { FunctionComponent } from "react";
import { Rubrique } from "@/client/utils/rubriques";

interface SommaireProps {
  rubriques: Rubrique[];
  auClic?: () => void;
}

const Sommaire: FunctionComponent<SommaireProps> = ({ rubriques, auClic }) => {
  return (
    <div className="sticky top-0 max-w-80">
      <nav className="pt-6 pl-7 pr-8">
        <p className="text-lg font-bold mb-2">Sommaire</p>
        <ul className="m-[var(--text-spacing)] text-sm print:text-base pl-6 [&_a:not(:hover,:active)]:[--underline-idle-width:0]">
          {rubriques.map((rubrique) => (
            <li
              className="pb-0 leading-8 text-primary list-none"
              key={rubrique.ancre}
            >
              <a href={`#${rubrique.ancre}`} onClick={auClic}>
                {rubrique.nom}
              </a>
              {!!rubrique.sousRubriques &&
                rubrique.sousRubriques.length > 0 && (
                  <ul className="pl-6 my-0">
                    {rubrique.sousRubriques.map((sousRubrique) => (
                      <li
                        className="pb-3 leading-5 text-primary list-none"
                        key={sousRubrique.nom}
                      >
                        <a href={`#${sousRubrique.ancre}`} onClick={auClic}>
                          {sousRubrique.nom}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sommaire;
