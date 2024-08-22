import FlècheDeTri from '@/components/_commons/Tableau/EnTête/FlècheDeTri/FlècheDeTri';
import BoutonsDeTriStyled from '@/components/_commons/Tableau/EnTête/BoutonsDeTri/BoutonsDeTri.styled';

type DirectionDeTri = 'asc' | 'desc' | false;

interface BoutonsDeTriProps {
  nomColonneÀTrier: string;
  directionDeTri: DirectionDeTri;
  changementDirectionDeTriCallback: (tri: DirectionDeTri) => void;
}


export default function BoutonsDeTri({
  nomColonneÀTrier,
  directionDeTri,
  changementDirectionDeTriCallback,
}: BoutonsDeTriProps) {
  return (
    <BoutonsDeTriStyled>
      <button
        aria-label={`trier la colonne "${nomColonneÀTrier}" par ordre croissant`}
        className={`${directionDeTri === 'asc' ? 'actif' : ''} bouton-de-tri fr-mr-1v`}
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
