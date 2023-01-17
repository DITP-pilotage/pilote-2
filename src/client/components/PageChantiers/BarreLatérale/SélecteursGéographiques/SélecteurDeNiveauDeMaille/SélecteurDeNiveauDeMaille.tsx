import SélecteurDeNiveauDeMailleProps from './SélecteurDeNiveauDeMaille.interface';

export default function SélecteurDeNiveauDeMaille({ setNiveauDeMaille, niveauDeMaille }: SélecteurDeNiveauDeMailleProps) {
  return (
    <div className='maille fr-mx-n1w'>
      <button
        className={`${niveauDeMaille === 'départementale' && 'séléctionné fr-text--bold'} fr-m-1v`}
        onClick={() => setNiveauDeMaille('départementale')}
        type='button'
      >
        Départements
      </button>
      <button
        className={`${niveauDeMaille === 'régionale' && 'séléctionné fr-text--bold'} fr-m-1v`}
        onClick={() => setNiveauDeMaille('régionale')}
        type='button'
      >
        Régions
      </button>
    </div>
  );
}
