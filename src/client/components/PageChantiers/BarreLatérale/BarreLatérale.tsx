import FiltresGroupeDeCatégories from './FiltresGroupe/FiltresGroupe';
import FiltresMinistères from './FiltresMinistères/FiltresMinistères';
import BarreLatéraleProps from './BarreLatérale.interface';
import BarreLatéraleStyled from './BarreLatérale.styled';
import SélecteursGéographiques from './SélecteursGéographiques/SélecteursGéographiques';

const ministères = [
  {
    nom: 'Agriculture et Alimentation',
    périmètresMinistériels: [
      { id: 'PER-001', nom: 'Agriculture' },
      { id: 'PER-002', nom: 'Alimentation' },
    ],
  },
  {
    nom: 'Cohésion des territoires et relations avec les collectivités territoriales',
    périmètresMinistériels: [
      { id: 'PER-003', nom: 'Cohésion des territoires, ville' },
      { id: 'PER-004', nom: 'Aménagement du territoire' },
      { id: 'PER-005', nom: 'Logement' },
    ],
  },
];

export default function BarreLatérale({ estOuvert, setEstOuvert, périmètresMinistériels }: BarreLatéraleProps) {
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
        <FiltresGroupeDeCatégories libellé="Catégorie de filtres">
          <FiltresMinistères
            catégorieDeFiltre='périmètresMinistériels'
            libellé='Ministères'
            ministères={ministères}
          />
        </FiltresGroupeDeCatégories>
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
