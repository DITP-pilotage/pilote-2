import { FunctionComponent } from 'react';
import BarreLatéraleProps from './BarreLatérale.interface';
import BarreLatéraleStyled from './BarreLatérale.styled';

const BarreLatérale: FunctionComponent<BarreLatéraleProps> = ({ estOuvert, setEstOuvert, children }) => {
  return (
    <BarreLatéraleStyled estOuvert={estOuvert}>
      <div className='barre-latérale'>
        <div className='fr-grid-row fr-grid-row--right boutonFermer'>
          <button
            aria-label='Fermer les filtres'
            className='fr-btn--close fr-btn fr-hidden-lg fr-text--md fr-py-2w fr-px-2w fr-pr-md-0 fr-mr-1w fr-col-md-2 fr-text-title--blue-france'
            onClick={() => setEstOuvert(false)}
            type='button'
          >
            Fermer
          </button>
        </div>
        { children }
      </div>
      {
        estOuvert ?
          <div
            aria-hidden
            className='arrière-plan'
            onClick={() => setEstOuvert(false)}
          />
          : null
      }
    </BarreLatéraleStyled>
  );
};
export default BarreLatérale;
