import SélecteursGéographiquesStyled from './SélecteursGéographiques.styled';

export default function SélecteursGéographiques() {
  return (
    <SélecteursGéographiquesStyled>
      <div className='fr-p-3w'>
        <ul className='maille fr-btns-group fr-btns-group--inline'>
          <li>
            <button
              className='fr-btn fr-m-1v'
              type='button'
            >
              Départements
            </button>
          </li>
          <li>
            <button
              className='fr-btn fr-m-1v '
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
