import FlècheDeTri from '@/components/_commons/Tableau/TableauEnTête/FlècheDeTri/FlècheDeTri';
import BoutonsDeTriProps from '@/components/_commons/Tableau/TableauEnTête/BoutonsDeTri/BoutonsDeTri.interface';
import BoutonsDeTriStyled from '@/components/_commons/Tableau/TableauEnTête/BoutonsDeTri/BoutonsDeTri.styled';

export default function BoutonsDeTri({ nomColonneÀTrier, directionDeTri, changementDirectionDeTriCallback }: BoutonsDeTriProps) {
  return (
    <BoutonsDeTriStyled>
      <button
        aria-label={`trier la colonne "${nomColonneÀTrier}" par ordre croissant`}
        className={`${directionDeTri === 'asc' ? 'actif' : ''} bouton-de-tri fr-mr-1w`}
        onClick={() => directionDeTri === 'asc' ? changementDirectionDeTriCallback(false) : changementDirectionDeTriCallback('asc')}
        type='button'
      >
        <FlècheDeTri
          direction='asc'
          estActif={directionDeTri === 'asc'}
        />
      </button>
      <button
        aria-label={`trier la colonne "${nomColonneÀTrier}" par ordre décroissant`}
        className={`${directionDeTri === 'desc' ? 'actif' : ''} bouton-de-tri`}
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
