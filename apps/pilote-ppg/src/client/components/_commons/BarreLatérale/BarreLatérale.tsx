import { FunctionComponent, ReactNode } from "react";
import { clsxm } from "@/utils/clsxm";
import { Button } from "@/components/shared/Button";
import { Icone } from "@/components/_commons/Icone";
import { CloseLineIcon } from "@/components/_commons/Icones/CloseLineIcon";

interface BarreLatéraleProps {
  estOuvert: boolean;
  setEstOuvert: (state: boolean) => void;
  collapsesWhenPageNarrow?: boolean;
  children?: ReactNode;
}

export const BarreLatérale: FunctionComponent<BarreLatéraleProps> = ({
  estOuvert,
  setEstOuvert,
  collapsesWhenPageNarrow = false,
  children,
}) => {
  return (
    <div
      className={clsxm(
        "min-[993px]:bg-white min-[993px]:border-r min-[993px]:border-dsfr-grey-925 print:border-0",
        collapsesWhenPageNarrow &&
          "group-data-narrow/page:border-0 group-data-narrow/page:bg-transparent",
      )}
    >
      <div
        className={clsxm(
          "barre-latérale sticky top-0 z-[2] w-80 max-h-screen pb-32 overflow-y-auto bg-white",
          "max-[992px]:fixed max-[992px]:top-0 max-[992px]:left-0 max-[992px]:z-[10000] max-[992px]:max-w-[90%] max-[992px]:h-dvh max-[992px]:max-h-none max-[992px]:transition-transform max-[992px]:duration-500",
          estOuvert
            ? "max-[992px]:translate-x-0"
            : "max-[992px]:-translate-x-[200rem]",
          collapsesWhenPageNarrow &&
            clsxm(
              "group-data-narrow/page:fixed group-data-narrow/page:top-0 group-data-narrow/page:left-0 group-data-narrow/page:z-[10000] group-data-narrow/page:h-[95%] group-data-narrow/page:transition-transform group-data-narrow/page:duration-500",
              estOuvert
                ? "group-data-narrow/page:translate-x-0"
                : "group-data-narrow/page:-translate-x-[200rem]",
            ),
        )}
      >
        <div className="flex justify-end bg-dsfr-alt-blue-france">
          <Button
            aria-label="Fermer les filtres"
            className={clsxm(
              "my-2 mr-2 min-[62em]:hidden",
              collapsesWhenPageNarrow && "group-data-narrow/page:inline-flex",
            )}
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
