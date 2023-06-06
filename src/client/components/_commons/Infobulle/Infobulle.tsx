import InfobulleProps from '@/components/_commons/Infobulle/Infobulle.interface';
import InfobulleStyled from '@/components/_commons/Infobulle/Infobulle.styled';

export default function Infobulle({ children }: InfobulleProps) {
  return (
    <InfobulleStyled>
      <button
        className="fr-btn fr-btn--tertiary-no-outline fr-icon-information-fill bouton"
        type='button'
      >
        Hey!
      </button>
      <div className="fr-p-1w fr-p-md-3v infobulle-texte">
        {children}
      </div>
    </InfobulleStyled>
  );
}
