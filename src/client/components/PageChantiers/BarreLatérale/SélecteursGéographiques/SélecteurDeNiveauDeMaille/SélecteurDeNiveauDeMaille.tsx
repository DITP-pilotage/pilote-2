import { niveauDeMaille as niveauDeMailleStore, setNiveauDeMaille as setNiveauDeMailleStore } from '@/client/stores/useNiveauDeMailleStore/useNiveauDeMailleStore';

export default function SélecteurDeNiveauDeMaille() {
  const niveauDeMaille = niveauDeMailleStore();
  const setNiveauDeMaille = setNiveauDeMailleStore();

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
