import { FunctionComponent, ReactNode } from "react";
import { clsxm } from "@/utils/clsxm";
import { Button } from "@/components/shared/Button";
import { Icone } from "@/components/_commons/Icone";
import { CloseLineIcon } from "@/components/_commons/Icones/CloseLineIcon";

interface BarreLatéraleProps {
  estOuvert: boolean;
  setEstOuvert: (state: boolean) => void;
  children?: ReactNode;
}

export const BarreLatérale: FunctionComponent<BarreLatéraleProps> = ({
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
        <div className="flex justify-end bg-dsfr-alt-blue-france">
          <Button
            aria-label="Fermer les filtres"
            className="my-2 mr-2 min-[62em]:hidden"
            iconRight={
              <Icone className="w-4 h-4 text-current" icone={CloseLineIcon} />
            }
            onClick={() => setEstOuvert(false)}
            size="sm"
            variant="tertiary-no-outline"
          >
            Fermer
          </Button>
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
