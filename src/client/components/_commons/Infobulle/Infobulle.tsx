import { ReactNode, FunctionComponent } from 'react';
import { Tooltip } from 'react-tooltip';
import { InfobulleStyled } from './Infobulle.styled';

interface InfobulleProps {
  idHtml: string;
  classNameBouton?: string;
  children: ReactNode;
  classNameInfoBulle?: string;
  positionStrategy?: 'fixed' | 'absolute'
}

const Infobulle: FunctionComponent<InfobulleProps> = ({ idHtml, children, classNameBouton, classNameInfoBulle, positionStrategy = 'absolute' }) => {
  return (
    <InfobulleStyled>
      <button
        aria-describedby={idHtml}
        className={`fr-btn fr-btn--tertiary-no-outline flex justify-center align-center fr-icon-information-fill${classNameBouton ? ` ${classNameBouton}` : ''}`}
        id={idHtml}
        type='button'
      />
      <Tooltip
        anchorSelect={`#${idHtml}`}
        border='1px solid var(--background-action-high-blue-france)'
        className={`tooltip-infobulle ${classNameInfoBulle ? ` ${classNameInfoBulle}` : ''}`}
        opacity={1}
        positionStrategy={positionStrategy}
      >
        {children}
      </Tooltip>  
    </InfobulleStyled> 
  );
};
export default Infobulle;
