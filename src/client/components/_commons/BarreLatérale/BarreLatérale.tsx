import BarreLatéraleProps from './BarreLatérale.interface';
import BarreLatéraleStyled from './BarreLatérale.styled';

export default function BarreLatérale({ estOuvert, setEstOuvert, children }: BarreLatéraleProps) {
  return (
    <BarreLatéraleStyled estOuvert={estOuvert}>
      <div className='barre-latérale'>
        <div className="fr-grid-row fr-grid-row--right">
          <button
            aria-label="Fermer les filtres"
            className="bold fr-sr-only-xl fr-text--sm fr-mb-0 fr-p-1w fr-col-4"
            onClick={() => setEstOuvert(false)}
            type="button"
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
            className="arrière-plan"
            onClick={() => setEstOuvert(false)}
          />
          : null
      }
    </BarreLatéraleStyled>
  );
}
