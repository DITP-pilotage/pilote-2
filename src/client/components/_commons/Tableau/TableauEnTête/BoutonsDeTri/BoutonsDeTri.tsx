import FlècheDeTri from '@/components/_commons/Tableau/TableauEnTête/FlècheDeTri/FlècheDeTri';
import BoutonsDeTriProps from '@/components/_commons/Tableau/TableauEnTête/BoutonsDeTri/BoutonsDeTri.interface';

export default function BoutonsDeTri({ libellé, tri, setTri }: BoutonsDeTriProps) {

  return (
    <>
      <button
        aria-label={`trier la colonne ${libellé} par ordre croissant`}
        className={`${tri === 'asc' ? 'actif' : ''} flèche-de-tri fr-m-1w`}
        onClick={() => tri === 'asc' ? setTri(false) : setTri('asc')}
        type='button'
      >
        <FlècheDeTri
          direction='asc'
          estActif={tri === 'asc'}
        />
      </button>
      <button
        aria-label={`trier la colonne ${libellé} par ordre décroissant`}
        className={`${tri === 'desc' ? 'actif' : ''} flèche-de-tri`}
        onClick={() => tri === 'desc' ? setTri(false) : setTri('desc')}
        type='button'
      >
        <FlècheDeTri
          direction='desc'
          estActif={tri === 'desc'}
        />
      </button>
    </>
  );
}
