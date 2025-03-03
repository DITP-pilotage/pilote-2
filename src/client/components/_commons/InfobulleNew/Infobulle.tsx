import { ReactNode, FunctionComponent } from 'react';
import { Tooltip } from 'react-tooltip';
import { InfobulleStyled } from './Infobulle.styled';

interface InfobulleProps {
  idHtml: string;
  className?: string;
  children: ReactNode;
}

const Infobulle: FunctionComponent<InfobulleProps> = ({ idHtml, children, className }) => {
  return (
    <InfobulleStyled>
      <button
        aria-describedby={idHtml}
        className={`fr-btn fr-btn--tertiary-no-outline flex justify-center align-center fr-icon-information-fill${className ? ` ${className}` : ''}`}
        id={idHtml}
        type='button'
      />
      <Tooltip
        anchorSelect={`#${idHtml}`}
        border='1px solid var(--background-action-high-blue-france)'
        className='tooltip-infobulle'
        opacity={1}
      >
        {children}
      </Tooltip>  
    </InfobulleStyled> 
  );
};
export default Infobulle;
