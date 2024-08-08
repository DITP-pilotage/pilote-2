import { FunctionComponent } from 'react';
import BarreLatéraleProps from './BarreLatérale.interface';
import BarreLatéraleStyled from './BarreLatérale.styled';

const BarreLatérale: FunctionComponent<BarreLatéraleProps> = ({ estOuvert, setEstOuvert, children }) => {
  return (
    <BarreLatéraleStyled estOuvert={estOuvert}>
      <div className='barre-latérale'>
        <div className='fr-grid-row fr-grid-row--right'>
          <button
            aria-label='Fermer les filtres'
            className='bold fr-hidden-lg fr-text--sm fr-mb-0 fr-p-1w fr-col-4'
            onClick={() => setEstOuvert(false)}
            type='button'
          >
            Fermer &times;
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
