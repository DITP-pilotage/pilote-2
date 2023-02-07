import SélecteurDeNiveauDeMailleProps from './SélecteurDeNiveauDeMaille.interface';

export default function SélecteurDeNiveauDeMaille({ niveauDeMaille, setNiveauDeMaille }: SélecteurDeNiveauDeMailleProps) {
  return (
    <div className='maille fr-p-1v'>
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
    </div>
  );
}
