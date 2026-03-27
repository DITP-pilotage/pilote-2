import { FunctionComponent } from "react";
import { clsxm } from "@/utils/clsxm";
import { Etape } from "@/server/app/contrats/EtapeContrat";

export const DescriptionEtapes: FunctionComponent<{
  etapes: Etape[];
}> = ({ etapes }) => {
  return (
    <div>
      <ol className="flex">
        {etapes.map((etape, index) => {
          const isLast = index === etapes.length - 1;
          return (
            <li
              className={clsxm(
                "flex flex-1 flex-col text-center",
                "before:flex before:items-center before:justify-center before:w-10 before:h-10 before:mx-auto before:mb-4 before:text-2xl before:font-bold before:text-white before:content-[attr(data-step)] before:bg-primary before:rounded-full",
                !isLast &&
                  "after:relative after:top-5 after:left-[calc(50%+1.5rem)] after:-order-1 after:w-[calc(100%-3rem)] after:h-0 after:text-primary after:content-[''] after:border-4 after:border-dashed after:border-t-0",
              )}
              data-step={index + 1}
              key={index}
            >
              <p className="fr-text fr-text--lg fr-text--bold fr-mb-0 fr-px-2w">
                {etape.titre}
              </p>
              <p className="fr-text fr-px-2w">{etape.texte}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
