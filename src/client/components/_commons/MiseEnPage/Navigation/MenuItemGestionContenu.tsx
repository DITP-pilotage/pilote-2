import { FunctionComponent } from 'react';
import Link from 'next/link';

interface PageGestionContenu {
  nom: string
  lien: string
}

export const MenuItemGestionContenu: FunctionComponent<{ urlActuelle: string }> = ({ urlActuelle }) => {
  const pagesGestionContenu: PageGestionContenu[] = [
    {
      nom: 'Message d\'information',
      lien: '/admin/message-information',
    }, {
      nom: 'Nouveautés',
      lien: '/admin/nouveautes',
    }, {
      nom: 'Textes des infobulles',
      lien: '/admin/infobulles',
    }, {
      nom: 'Chantiers',
      lien: '/admin/chantiers',
    }, {
      nom: 'Indicateurs des chantiers',
      lien: '/admin/indicateurs',
    }, {
      nom: 'Projets structurants',
      lien: '/admin/projets-structurants',
    }, {
      nom: 'Indicateurs des projets structurants',
      lien: '/admin/indicateurs-projets-structurants',
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
              return (
                <li key={page.lien}>
                  <Link
                    aria-current={page.lien === urlActuelle ? 'true' : undefined}
                    className='fr-nav__link'
                    href={page.lien}
                    target='_self'
                  >
                    {page.nom}
                  </Link>
                </li>
              );
            })
          }
        </ul>
      </div>
    </li>
  );
};
