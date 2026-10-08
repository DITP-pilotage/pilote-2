import { FunctionComponent, PropsWithChildren, useId, useState } from "react";
import { Popover } from "radix-ui";
import { InformationPleineIcon } from "@/components/_commons/Icones/InformationPleineIcon";
import { QuestionIcon } from "@/components/_commons/Icones/QuestionIcon";
import { Icone } from "@/components/_commons/Icone";
import { IconeDocumentationIcon } from "@/components/_commons/Icones/IconeDocumentationIcon";
import { clsxm } from "@/utils/clsxm";
import { WarningIcon } from "@/client/components/_commons/Icones/WarningIcon";

const ICONES = {
  information: InformationPleineIcon,
  documentation: IconeDocumentationIcon,
  question: QuestionIcon,
  warning: WarningIcon,
};

export const Infobulle: FunctionComponent<
  PropsWithChildren<{
    classNameBouton?: string;
    classNameInfoBulle?: string;
    classNameIcone?: string;
    styleIconInfoBulle?: keyof typeof ICONES;
  }>
> = ({
  children,
  classNameBouton,
  classNameInfoBulle,
  classNameIcone,
  styleIconInfoBulle = "information",
}) => {
  const idContenu = useId();
  const [estOuverte, setEstOuverte] = useState(false);

  const ouvrir = () => setEstOuverte(true);
  const fermer = () => setEstOuverte(false);

  return (
    <Popover.Root onOpenChange={setEstOuverte} open={estOuverte}>
      <Popover.Anchor className="relative ml-2 inline-flex items-center">
        <button
          aria-describedby={estOuverte ? idContenu : undefined}
          className={clsxm(
            "inline-flex items-center justify-center rounded-full p-0 text-primary transition-opacity hover:bg-transparent hover:opacity-75",
            classNameBouton,
          )}
          onBlur={fermer}
          onClick={ouvrir}
          onFocus={ouvrir}
          onMouseEnter={ouvrir}
          onMouseLeave={fermer}
          type="button"
        >
          <Icone
            className={clsxm(
              styleIconInfoBulle === "information"
                ? "text-current"
                : "text-current",
              classNameIcone,
            )}
            icone={ICONES[styleIconInfoBulle]}
          />
        </button>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          className={clsxm(
            "z-[10000] min-w-[400px] max-w-[500px] text-dsfr-grey-50 bg-dsfr-alt-blue-france rounded-lg border border-dsfr-blue-france-sun-113 shadow-[0_4px_2px_rgba(0,0,0,0.1)] p-3 pointer-events-none whitespace-normal break-words [&_.fr-text--sm]:m-0",
            classNameInfoBulle === "infobull--sm" && "min-w-[250px] p-0",
            classNameInfoBulle === "tooltip-accordeon" && "max-w-[50vw]",
            classNameInfoBulle,
          )}
          collisionPadding={10}
          id={idContenu}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onOpenAutoFocus={(event) => event.preventDefault()}
          role="tooltip"
          side="top"
          sideOffset={5}
        >
          {children}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
