import { useState } from 'react';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import Titre from '@/components/_commons/Titre/Titre';
import '@gouvfr/dsfr/dist/component/sidemenu/sidemenu.min.css';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface BarreLateraleElement {
  libelle: string
  lien: string
}

function BarreLateraleElements({ elements }: { elements: BarreLateraleElement[] }) {
  const router = useRouter();
  const urlActuelle = router.pathname;

  return (
    <ul className='fr-sidemenu__list'>
      {
        elements.map((element) => {
          return (
            <li
              className='fr-sidemenu__item fr-sidemenu__item--active'
              key={`barre-laterale-item-${element.lien}`}
            >
              <Link
                aria-current={element.lien === urlActuelle ? 'true' : undefined}
                className='fr-sidemenu__link'
                href={element.lien}
                target='_self'
              >
                {element.libelle}
              </Link
            >
            </li>
          );
        })
      }
    </ul>
  );
}

const gestionContenusMenuElements: BarreLateraleElement[] = [
  {
    libelle: 'Message d\'information',
    lien: '/admin/gestion-contenus',
  }, {
    libelle: 'Nouveautés',
    lien: '#',
  }, {
    libelle: 'Textes des infobulles',
    lien: '#',
  }, {
    libelle: 'Chantiers',
    lien: '#',
  }, {
    libelle: 'Indicateurs des chantiers',
    lien: '#',
  }, {
    libelle: 'Projets structurants',
    lien: '#',
  }, {
    libelle: 'Indicateurs des projets structurants',
    lien: '#',
  },
];

function PageGestionContenus() {
  const [estOuvert, setEstOuvert] = useState<boolean>(false);

  return (
    <div className='flex'>
      <BarreLatérale
        estOuvert={estOuvert}
        setEstOuvert={setEstOuvert}
      >
        <div className='fr-px-3w fr-py-2w fr-sidemenu'>
          <Titre
            baliseHtml='h2'
            className='fr-h4 fr-py-1w'
          >
            Rubriques modifiables
          </Titre>
          <BarreLateraleElements elements={gestionContenusMenuElements} />
        </div>
      </BarreLatérale>
      <main />
    </div>
  );
}

export default function NextAdminGestionContenus() {
  return (
    <PageGestionContenus />
  );
}

