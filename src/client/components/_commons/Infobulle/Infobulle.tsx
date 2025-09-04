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
  idHtml?: string;
  classNameBouton?: string;
  classNameInfoBulle?: string;
  styleIconInfoBulle?: "information" | "question" | "informationProposition";
}>;

const Infobulle: FunctionComponent<InfobulleProps> = ({
  idHtml,
  children,
  classNameBouton,
  classNameInfoBulle,
  styleIconInfoBulle = "information",
}) => {
  const randomId = useId();

  const [isVisible, setIsVisible] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const iconesMap = {
    informationProposition: "ri-file-info-fill information-proposition-icone",
    information: "fr-icon-information-fill",
    question: "fr-icon-question-fill",
  };

  return (
    <InfobulleStyled>
      <button
        aria-describedby={idHtml || randomId}
        className={clsx(
          `fr-btn fr-btn--tertiary-no-outline flex justify-center align-center`,
          iconesMap[styleIconInfoBulle],
          classNameBouton,
        )}
        id={idHtml || randomId}
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
