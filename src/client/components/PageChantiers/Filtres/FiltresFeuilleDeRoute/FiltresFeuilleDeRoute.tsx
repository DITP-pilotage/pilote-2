import FiltreFeuilleDeRoute from './FiltreFeuilleDeRoute/FiltreFeuilleDeRoute';
import FiltresFeuilleDeRouteProps from './FiltresFeuilleDeRoute.interface';

export default function FiltresFeuilleDeRoute({ filtres }: FiltresFeuilleDeRouteProps) {
  return ( 
    <>
      <button
        aria-controls="filtres-feuille-de-route"
        aria-expanded="true"
        className="fr-sidemenu__btn fr-m-0"
        type='button'
      >
        Chantiers inscrits dans les feuilles de route
      </button>
      <div
        className="fr-collapse"
        id="filtres-feuille-de-route"
      >
        {
          filtres.map(filtre => (
            <FiltreFeuilleDeRoute
              filtre={filtre}
              key={filtre.id}
            />
          ))
        }
      </div>
    </>
  );
}
