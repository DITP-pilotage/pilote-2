import '@gouvfr/dsfr/dist/component/search/search.min.css';
import '@gouvfr/dsfr/dist/component/input/input.min.css';
import { ChangeEventHandler, FunctionComponent } from 'react';
import BarreDeRechercheStyled from './BarreDeRecherche.styled';

const BarreDeRecherche : FunctionComponent<{
  changementDeLaRechercheCallback: ChangeEventHandler<HTMLInputElement>,
  valeur?: string
}> = ({ changementDeLaRechercheCallback, valeur = '' }) => {
  return (
    <BarreDeRechercheStyled
      className='fr-search-bar'
      role='search'
    >
      <input
        className='fr-input'
        onChange={changementDeLaRechercheCallback}
        placeholder='Rechercher'
        type='search'
        value={valeur}
      />
      <div
        aria-hidden
        className='fr-btn'
        title='Rechercher'
      >
        Rechercher
      </div>
    </BarreDeRechercheStyled>
  );
};

export default BarreDeRecherche;
