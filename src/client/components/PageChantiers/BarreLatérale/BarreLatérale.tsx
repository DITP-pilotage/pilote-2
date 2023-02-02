import FiltresGroupeDeCatégoriesDeFiltres from './FiltresGroupe/FiltresGroupe';
import FiltresMinistères from './FiltresMinistères/FiltresMinistères';
import BarreLatéraleProps from './BarreLatérale.interface';
import BarreLatéraleStyled from './BarreLatérale.styled';
import SélecteursGéographiques from './SélecteursGéographiques/SélecteursGéographiques';

export default function BarreLatérale({ estOuvert, setEstOuvert, ministères }: BarreLatéraleProps) {
  return (
    <BarreLatéraleStyled estOuvert={estOuvert}>
      <div className='barre-latérale'>
        <div className="fr-grid-row fr-grid-row--middle">
          <SélecteursGéographiques />
          <p className="fr-h4 fr-mb-1w fr-px-3w fr-mt-2w fr-col-8">
            Filtres
          </p>
          <button
            aria-label="Fermer les filtres"
            className="bold fr-sr-only-xl fr-text--sm fr-mb-0 fr-p-1w fr-col-4"
            onClick={() => setEstOuvert(false)}
            type="button"
          >
            Fermer &times;
          </button>
        </div>
        <FiltresGroupeDeCatégoriesDeFiltres>
          <FiltresMinistères
            catégorieDeFiltre='périmètresMinistériels'
            libellé='Ministères'
            ministères={ministères}
          />
        </FiltresGroupeDeCatégoriesDeFiltres>
      </div>
      {
        estOuvert ?
          <div
            aria-hidden
            className="arrière-plan"
            onClick={() => setEstOuvert(false)}
          />
          : null
      }
    </BarreLatéraleStyled>
  );
}
