import { FunctionComponent } from 'react';
import Link from 'next/link';

interface PageGestionContenu {
  nom: string
  lien: string
  accessible: boolean
}

export const MenuItemGestionContenu: FunctionComponent<{ urlActuelle: string }> = ({ urlActuelle }) => {
  const pagesGestionContenu: PageGestionContenu[] = [
    {
      nom: 'Message d\'information',
      lien: '/admin/message-information',
      accessible: true,
    }, {
      nom: 'Nouveautés',
      lien: '/admin/nouveautes',
      accessible: false,
    }, {
      nom: 'Textes des infobulles',
      lien: '/admin/infobulles',
      accessible: false,
    }, {
      nom: 'Chantiers',
      lien: '/admin/chantiers',
      accessible: false,
    }, {
      nom: 'Indicateurs des chantiers',
      lien: '/admin/indicateurs',
      accessible: true,
    }, {
      nom: 'Projets structurants',
      lien: '/admin/projets-structurants',
      accessible: false,
    }, {
      nom: 'Indicateurs des projets structurants',
      lien: '/admin/indicateurs-projets-structurants',
      accessible: false,
    },
  ];
  return (
    <li className='fr-nav__item'>
      <button
        aria-controls='menu-776'
        aria-current={pagesGestionContenu.map(page => page.nom).includes(urlActuelle)}
        aria-expanded='false'
        className='fr-nav__btn'
        type='button'
      >
        Gestion des contenus
      </button>
      <div
        className='fr-collapse fr-menu'
        id='menu-776'
      >
        <ul className='fr-menu__list'>
          {
            pagesGestionContenu.map(page => {
              return page.accessible ? (
                <li key={page.lien}>
                  <Link
                    aria-current={page.lien === urlActuelle ? 'true' : undefined}
                    className='fr-nav__link relative'
                    href={page.lien}
                    target='_self'
                  >
                    {page.nom}
                  </Link>
                </li>
              ) : null;
            })
          }
        </ul>
      </div>
    </li>
  );
};
