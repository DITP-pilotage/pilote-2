import SélecteursGéographiquesStyled from './SélecteursGéographiques.styled';
import SélecteursGéographiquesProps from './SélecteursGéographiques.interface';

export default function SélecteursGéographiques({ setNiveauDeMaille }: SélecteursGéographiquesProps) {
  return (
    <SélecteursGéographiquesStyled>
      <div className='fr-p-3w'>
        <ul className='maille fr-btns-group fr-btns-group--inline'>
          <li>
            <button
              className='fr-btn fr-m-1v'
              onClick={() => setNiveauDeMaille('départementale')}
              type='button'
            >
              Départements
            </button>
          </li>
          <li>
            <button
              className='fr-btn fr-m-1v '
              onClick={() => setNiveauDeMaille('régionale')}
              type='button'
            >
              Régions
            </button>
          </li>
        </ul>
      </div>
    </SélecteursGéographiquesStyled>
  );
}
