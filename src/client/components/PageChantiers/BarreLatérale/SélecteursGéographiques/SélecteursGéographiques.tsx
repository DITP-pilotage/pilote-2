import SélecteursGéographiquesStyled from './SélecteursGéographiques.styled';
import SélecteursGéographiquesProps from './SélecteursGéographiques.interface';

export default function SélecteursGéographiques({ setNiveauDeMaille, niveauDeMaille }: SélecteursGéographiquesProps) {
  return (
    <SélecteursGéographiquesStyled>
      <div className='fr-p-3w'>
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
      </div>
    </SélecteursGéographiquesStyled>
  );
}
