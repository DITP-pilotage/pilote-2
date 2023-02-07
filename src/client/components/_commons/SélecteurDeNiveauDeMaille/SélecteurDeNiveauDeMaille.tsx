import SélecteurDeNiveauDeMailleProps from './SélecteurDeNiveauDeMaille.interface';
import SélecteurDeNiveauDeMailleStyled from './SélecteurDeNiveauDeMaille.styled';

export default function SélecteurDeNiveauDeMaille({ niveauDeMaille, setNiveauDeMaille }: SélecteurDeNiveauDeMailleProps) {
  return (
    <SélecteurDeNiveauDeMailleStyled className='fr-p-1v'>
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
    </SélecteurDeNiveauDeMailleStyled>
  );
}
