import {
  FunctionComponent,
  useRef,
  useState,
  useId,
  PropsWithChildren,
} from "react";
import clsx from "clsx";
import SecureTooltip from "@/client/components/_commons/SecureTooltip/SecureTooltip";
import InfobulleStyled from "./Infobulle.styled";

type InfobulleProps = PropsWithChildren<{
  classNameBouton?: string;
  classNameInfoBulle?: string;
  styleIconInfoBulle?: "information" | "question" | "informationProposition";
}>;

const Infobulle: FunctionComponent<InfobulleProps> = ({
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
          `fr-btn fr-btn--tertiary-no-outline flex justify-center align-center`,
          {
            "ri-file-info-fill information-proposition-icone":
              styleIconInfoBulle === "informationProposition",
            "fr-icon-information-fill": styleIconInfoBulle === "information",
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
      />
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

export default Infobulle;
