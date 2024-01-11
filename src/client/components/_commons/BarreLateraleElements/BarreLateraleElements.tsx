import { useRouter } from 'next/router';
import Link from 'next/link';

export interface BarreLateraleElement {
  libelle: string
  lien: string
}

export function BarreLateraleElements({ elements }: { elements: BarreLateraleElement[] }) {
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
              </Link>
            </li>
          );
        })
      }
    </ul>
  );
}
