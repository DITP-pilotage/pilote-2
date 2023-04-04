import FlècheDeTri from '@/components/_commons/Tableau/TableauEnTête/FlècheDeTri/FlècheDeTri';
import BoutonsDeTriProps from '@/components/_commons/Tableau/TableauEnTête/BoutonsDeTri/BoutonsDeTri.interface';
import BoutonsDeTriStyled from '@/components/_commons/Tableau/TableauEnTête/BoutonsDeTri/BoutonsDeTri.styled';

export default function BoutonsDeTri({ tri, setTri }: BoutonsDeTriProps) {
  return (
    <BoutonsDeTriStyled>
      <button
        className={`${tri === 'asc' ? 'actif' : ''} flèche-de-tri fr-mr-1w`}
        onClick={() => tri === 'asc' ? setTri(false) : setTri('asc')}
        type='button'
      >
        <FlècheDeTri
          direction='asc'
          estActif={tri === 'asc'}
        />
      </button>
      <button
        className={`${tri === 'desc' ? 'actif' : ''} flèche-de-tri`}
        onClick={() => tri === 'desc' ? setTri(false) : setTri('desc')}
        type='button'
      >
        <FlècheDeTri
          direction='desc'
          estActif={tri === 'desc'}
        />
      </button>
    </BoutonsDeTriStyled>
  );
}
