import FlècheDeTri from '@/components/_commons/Tableau/EnTête/FlècheDeTri/FlècheDeTri';
import BoutonsDeTriProps from '@/components/_commons/Tableau/EnTête/BoutonsDeTri/BoutonsDeTri.interface';
import BoutonsDeTriStyled from '@/components/_commons/Tableau/EnTête/BoutonsDeTri/BoutonsDeTri.styled';

export default function BoutonsDeTri({ nomColonneÀTrier, directionDeTri, changementDirectionDeTriCallback }: BoutonsDeTriProps) {
  return (
    <BoutonsDeTriStyled>
      <button
        aria-label={`trier la colonne "${nomColonneÀTrier}" par ordre croissant`}
        className={`${directionDeTri === 'asc' ? 'actif' : ''} bouton-de-tri fr-mr-1v`}
        onClick={() => directionDeTri === 'asc' ? changementDirectionDeTriCallback(false) : changementDirectionDeTriCallback('asc')}
        title='Tri par ordre croissant'
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
        title='Tri par ordre décroissant'
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
