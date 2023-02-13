import SélecteurDeMailleInterneProps from './InterrupteurMailleInterne.interface';
import InterrupteurMailleInterneStyled from './InterrupteurMailleInterne.styled';

export default function InterrupteurMailleInterne({ mailleInterne, setMailleInterne }: SélecteurDeMailleInterneProps) {
  return (
    <InterrupteurMailleInterneStyled className='fr-p-1v'>
      <button
        className={`${mailleInterne === 'départementale' && 'sélectionné fr-text--bold'}`}
        onClick={() => setMailleInterne('départementale')}
        type='button'
      >
        Départements
      </button>
      <button
        className={`${mailleInterne === 'régionale' && 'sélectionné fr-text--bold'}`}
        onClick={() => setMailleInterne('régionale')}
        type='button'
      >
        Régions
      </button>
    </InterrupteurMailleInterneStyled>
  );
}
