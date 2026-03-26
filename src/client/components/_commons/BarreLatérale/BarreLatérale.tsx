import { FunctionComponent, ReactNode } from "react";
import { clsxm } from "@/utils/clsxm";

interface BarreLatéraleProps {
  estOuvert: boolean;
  setEstOuvert: (state: boolean) => void;
  children?: ReactNode;
}

const BarreLatérale: FunctionComponent<BarreLatéraleProps> = ({
  estOuvert,
  setEstOuvert,
  children,
}) => {
  return (
    <div>
      <div
        className={clsxm(
          "barre-latérale sticky top-0 z-[2] w-80 h-screen pb-32 overflow-y-auto bg-white border-r border-dsfr-grey-925",
          "max-[992px]:fixed max-[992px]:top-0 max-[992px]:left-0 max-[992px]:z-[10000] max-[992px]:w-[90%] max-[992px]:h-[95%] max-[992px]:transition-transform max-[992px]:duration-500",
          estOuvert
            ? "max-[992px]:translate-x-0"
            : "max-[992px]:-translate-x-[200rem]",
        )}
      >
        <div className="fr-grid-row fr-grid-row--right bg-dsfr-alt-blue-france">
          <button
            aria-label="Fermer les filtres"
            className="fr-btn--close fr-btn fr-hidden-lg fr-text--md fr-py-2w fr-px-2w fr-pr-md-0 fr-mr-1w fr-col-md-2 fr-text-title--blue-france"
            onClick={() => setEstOuvert(false)}
            type="button"
          >
            Fermer
          </button>
        </div>
        {children}
      </div>
      {estOuvert ? (
        <div
          aria-hidden
          className="fixed top-0 left-0 z-[501] w-screen h-screen cursor-pointer bg-black/20"
          onClick={() => setEstOuvert(false)}
        />
      ) : null}
    </div>
  );
};
export default BarreLatérale;
