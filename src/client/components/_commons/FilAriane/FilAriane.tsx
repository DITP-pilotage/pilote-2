import { useState } from 'react';
import Link from 'next/link';
import FilArianeProps from './FilAriane.interface';
import '@gouvfr/dsfr/dist/component/breadcrumb/breadcrumb.min.css';

export default function FilAriane({ chemin, pageCourante }: FilArianeProps) {
  const [estOuvert, setEstOuvert] = useState(false);

  return (
    <nav
      aria-label="vous êtes ici :"
      className="fr-breadcrumb fr-mb-3w"
      role="navigation"
    >
      <button
        aria-controls="breadcrumb-1"
        aria-expanded="false"
        className="fr-breadcrumb__button"
        onClick={() => setEstOuvert(!estOuvert)}
        type='button'
      >
        Voir le fil d’Ariane
      </button>
      <div
        className={estOuvert ? 'fr-collapse--expanded' : 'fr-collapse'}
        id="breadcrumb-1"
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
              {pageCourante}
            </span>
          </li>
        </ol>
      </div>
    </nav>
  );
}
