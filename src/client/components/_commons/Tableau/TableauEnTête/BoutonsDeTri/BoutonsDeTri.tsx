import FlècheDeTri from '@/components/_commons/Tableau/TableauEnTête/FlècheDeTri/FlècheDeTri';
import BoutonsDeTriProps from '@/components/_commons/Tableau/TableauEnTête/BoutonsDeTri/BoutonsDeTri.interface';
import BoutonsDeTriStyled from '@/components/_commons/Tableau/TableauEnTête/BoutonsDeTri/BoutonsDeTri.styled';

export default function BoutonsDeTri({ directionDeTri, changementDirectionDeTriCallback }: BoutonsDeTriProps) {
  return (
    <BoutonsDeTriStyled>
      <button
        className={`${directionDeTri === 'asc' ? 'actif' : ''} flèche-de-tri fr-mr-1w`}
        onClick={() => directionDeTri === 'asc' ? changementDirectionDeTriCallback(false) : changementDirectionDeTriCallback('asc')}
        type='button'
      >
        <FlècheDeTri
          direction='asc'
          estActif={directionDeTri === 'asc'}
        />
      </button>
      <button
        className={`${directionDeTri === 'desc' ? 'actif' : ''} flèche-de-tri`}
        onClick={() => directionDeTri === 'desc' ? changementDirectionDeTriCallback(false) : changementDirectionDeTriCallback('desc')}
        type='button'
      >
        <FlècheDeTri
          direction='desc'
          estActif={directionDeTri === 'desc'}
        />
      </button>
    </BoutonsDeTriStyled>
  );
}
