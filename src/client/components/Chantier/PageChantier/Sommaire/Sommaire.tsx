import SommaireProps from './Sommaire.interface';
import '@gouvfr/dsfr/dist/component/summary/summary.min.css';

export default function Sommaire({ éléments }: SommaireProps) {
  return (
    <nav
      aria-labelledby="fr-summary-title"
      className="fr-summary"
    >
      <p className="fr-summary__title" >
        Sommaire
      </p>
      <ol className="fr-summary__list">
        {éléments.map(élément => (
          <li key={élément.nom}>
            <a
              className="fr-summary__link"
              href={élément.ancre}
            >
              {élément.nom}
            </a>
            {
                élément.sousÉlément 
                  ? 
                    <ol className="fr-summary__list">
                      {élément.sousÉlément.map(sousÉlément => (
                        <li key={sousÉlément.nom}>
                          <a
                            className="fr-summary__link"
                            href={sousÉlément.ancre}
                          >
                            {sousÉlément.nom}
                          </a>
                        </li>
                      )) }
                    </ol>
                  : null
            }
          </li>
        ))}
      </ol>
    </nav>
  );
}
