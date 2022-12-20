import { useId, useState } from 'react';
import Link from 'next/link';
import FilArianeProps from './FilAriane.interface';
import '@gouvfr/dsfr/dist/component/breadcrumb/breadcrumb.min.css';

export default function FilAriane({ chemin, libelléPageCourante }: FilArianeProps) {
  const [estOuvert, setEstOuvert] = useState(false);
  const id = useId();

  return (
    <nav
      aria-label="vous êtes ici :"
      className="fr-breadcrumb fr-mb-3w"
      role="navigation"
    >
      <button
        aria-controls={`breadcrumb-${id}`}
        aria-expanded="false"
        className="fr-breadcrumb__button"
        onClick={() => setEstOuvert(!estOuvert)}
        type='button'
      >
        Voir le fil d’Ariane
      </button>
      <div
        className={estOuvert ? 'fr-collapse--expanded' : 'fr-collapse'}
        id={`breadcrumb-${id}`}
      >
        <ol className="fr-breadcrumb__list">
          <li>
            <Link
              className="fr-breadcrumb__link"
              href="/"
            >
              Accueil
            </Link>
          </li>
          { chemin ? 
            chemin.map(page => (
              <li key={page.nom}>
                <Link
                  className="fr-breadcrumb__link"
                  href={page.lien}
                >
                  {page.nom}
                </Link>
              </li>
            ))
            : null }
          <li>
            <span
              aria-current="page"
              className="fr-breadcrumb__link"
            >
              {libelléPageCourante}
            </span>
          </li>
        </ol>
      </div>
    </nav>
  );
}
