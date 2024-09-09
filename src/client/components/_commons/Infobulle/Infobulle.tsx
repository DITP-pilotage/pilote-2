import { FunctionComponent, ReactNode, useState } from 'react';
import InfobulleStyled from '@/components/_commons/Infobulle/Infobulle.styled';
import { estLargeurDÉcranActuelleMoinsLargeQue } from '@/stores/useLargeurDÉcranStore/useLargeurDÉcranStore';

interface InfobulleProps {
  idHtml: string;
  className?: string;
  children: ReactNode;
}

const Infobulle: FunctionComponent<InfobulleProps> = ({ idHtml, children, className }) => {
  const estVueMobile = estLargeurDÉcranActuelleMoinsLargeQue('sm');
  const [estVisible, setEstVisible] = useState(false);

  return (
    <InfobulleStyled
      className='infobulle relative'
      onBlur={() => setEstVisible(false)}
      onFocus={() => !estVueMobile && setEstVisible(true)}
      onMouseEnter={() => setEstVisible(true)}
      onMouseLeave={() => setEstVisible(false)}
      role='tooltip'
    >
      <button
        aria-describedby={idHtml}
        className={`fr-btn fr-btn--tertiary-no-outline fr-icon-information-fill infobulle-bouton${className ? ` ${className}` : ''}`}
        onClick={() => estVueMobile && setEstVisible(!estVisible)}
        onKeyDown={(keyEvent) => keyEvent.key === 'Escape' && setEstVisible(false)}
        type='button'
      />
      {
        estVisible ? (
          <div
            className='fr-p-1w fr-p-md-3v infobulle-texte'
            id={idHtml}
          >
            {children}
          </div>
        ) : null
      }
    </InfobulleStyled>
  );
};

export default Infobulle;
