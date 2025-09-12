import {
  FunctionComponent,
  PropsWithChildren,
  useId,
  useRef,
  useState,
} from "react";
import clsx from "clsx";
import SecureTooltip from "@/client/components/_commons/SecureTooltip/SecureTooltip";
import { InformationPleineIcon } from "@/components/_commons/Icones/InformationPleineIcon";
import { Icone } from "@/components/_commons/Icone";
import { IconeDocumentationIcon } from "@/components/_commons/Icones/IconeDocumentationIcon";
import InfobulleStyled from "./Infobulle.styled";

export const Infobulle: FunctionComponent<
  PropsWithChildren<{
    classNameBouton?: string;
    classNameInfoBulle?: string;
    styleIconInfoBulle?: "information" | "question" | "informationProposition";
  }>
> = ({
  children,
  classNameBouton,
  classNameInfoBulle,
  styleIconInfoBulle = "information",
}) => {
  const randomId = useId();

  const [isVisible, setIsVisible] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <InfobulleStyled>
      <button
        aria-describedby={randomId}
        className={clsx(
          `flex justify-center align-center`,
          {
            "fr-btn fr-btn--tertiary-no-outline":
              styleIconInfoBulle !== "information" &&
              styleIconInfoBulle !== "informationProposition",
            "fr-icon-question-fill": styleIconInfoBulle === "question",
          },
          classNameBouton,
        )}
        id={randomId}
        onBlur={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        onFocus={() => setIsVisible(true)}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        ref={buttonRef}
        type="button"
      >
        {styleIconInfoBulle === "information" ? (
          <Icone icone={InformationPleineIcon} />
        ) : null}
        {styleIconInfoBulle === "informationProposition" ? (
          <Icone
            className="!text-dsfr-moutarde-main-679"
            icone={IconeDocumentationIcon}
          />
        ) : null}
      </button>
      <SecureTooltip
        anchorEl={buttonRef.current}
        border="1px solid var(--background-action-high-blue-france)"
        classNameInfoBulle={classNameInfoBulle}
        isVisible={isVisible}
      >
        {children}
      </SecureTooltip>
    </InfobulleStyled>
  );
};
