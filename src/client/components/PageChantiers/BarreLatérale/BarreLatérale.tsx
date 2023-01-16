import FiltreGroupe from './FiltresGroupe/FiltresGroupe';
import SélecteurMultiple from './SélecteurMultiple/SélecteurMultiple';
import BarreLatéraleProps from './BarreLatérale.interface';
import BarreLatéraleStyled from './BarreLatérale.styled';
import SélecteursGéographiques from './SélecteursGéographiques/SélecteursGéographiques';

export default function BarreLatérale({ estOuvert, setEstOuvert, périmètresMinistériels }: BarreLatéraleProps) {
  return (
    <BarreLatéraleStyled estOuvert={estOuvert}>
      <div className='barre-latérale'>
        <div className="fr-grid-row fr-grid-row--middle">
          <SélecteursGéographiques />
          <p className="fr-h4 fr-mb-0 fr-px-3w fr-mt-2w fr-col-8">
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
        <FiltreGroupe titre="Périmètres thématiques">
          <SélecteurMultiple
            catégorieDeFiltre='périmètresMinistériels'
            filtres={périmètresMinistériels}
            libellé='Périmètres ministériels'
          />
        </FiltreGroupe>
      </div>
      {
        estOuvert ? (
          <div
            aria-hidden
            className="arrière-plan"
            onClick={() => setEstOuvert(false)}
          />)
          : null
      }
    </BarreLatéraleStyled>
  );
}
