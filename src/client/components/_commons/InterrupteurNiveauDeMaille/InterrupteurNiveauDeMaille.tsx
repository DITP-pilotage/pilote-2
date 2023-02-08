import SélecteurDeNiveauDeMailleProps from './InterrupteurNiveauDeMaille.interface';
import InterrupteurNiveauDeMailleStyled from './InterrupteurNiveauDeMaille.styled';

export default function InterrupteurNiveauDeMaille({ niveauDeMaille, setNiveauDeMaille }: SélecteurDeNiveauDeMailleProps) {
  return (
    <InterrupteurNiveauDeMailleStyled className='fr-p-1v'>
      <button
        className={`${niveauDeMaille === 'départementale' && 'séléctionné fr-text--bold'}`}
        onClick={() => setNiveauDeMaille('départementale')}
        type='button'
      >
        Départements
      </button>
      <button
        className={`${niveauDeMaille === 'régionale' && 'séléctionné fr-text--bold'}`}
        onClick={() => setNiveauDeMaille('régionale')}
        type='button'
      >
        Régions
      </button>
    </InterrupteurNiveauDeMailleStyled>
  );
}
