import { ReactNode, FunctionComponent, useRef, useState } from "react";
import SecureTooltip from "@/client/components/_commons/SecureTooltip/SecureTooltip";
import InfobulleStyled from "./Infobulle.styled";

interface InfobulleProps {
  idHtml: string;
  classNameBouton?: string;
  children: ReactNode;
  classNameInfoBulle?: string;
  styleIconInfoBulle?: "information" | "question" | "informationProposition";
}

/**
 * Infobulle sécurisée compatible avec CSP qui utilise Emotion pour les styles
 * Elle assure que les styles sont générés avec le nonce approprié
 */
const Infobulle: FunctionComponent<InfobulleProps> = ({
  idHtml,
  children,
  classNameBouton,
  classNameInfoBulle,
  styleIconInfoBulle = "information",
}) => {
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
        aria-describedby={idHtml}
        className={`fr-btn fr-btn--tertiary-no-outline flex justify-center align-center ${iconesMap[styleIconInfoBulle]}${classNameBouton ? ` ${classNameBouton}` : ""}`}
        id={idHtml}
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
