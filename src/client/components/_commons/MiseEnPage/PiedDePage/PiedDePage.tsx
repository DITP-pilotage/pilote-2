import '@gouvfr/dsfr/dist/component/footer/footer.min.css';
import Link from 'next/link';
import { FunctionComponent } from 'react';
import api from '@/server/infrastructure/api/trpc/api';

const PiedDePage: FunctionComponent<{}> = () => {

  const { data: estBoutonDocsAPIAffiche } = api.gestionContenu.récupérerVariableContenu.useQuery({ nomVariableContenu: 'NEXT_PUBLIC_FF_DOCS_API' });

  return (
    <footer
      className='fr-footer'
      id='footer'
      role='contentinfo'
    >
      <div className='fr-container'>
        <div className='fr-footer__body'>
          <div className='fr-footer__brand fr-enlarge-link'>
            <Link
              href='/'
              title='Retour à l’accueil du site'
            >
              <p className='fr-logo'>
                Gouvernement
              </p>
            </Link>
          </div>
          <div className='fr-footer__content'>
            <p className='fr-footer__content-desc'>
              PILOTE est le dispositif de suivi des politiques prioritaires du gouvernement. Il permet d’évaluer les
              résultats des politiques publiques dans les territoires.
            </p>
          </div>
        </div>
        <div className='fr-footer__bottom'>
          <ul className='fr-footer__bottom-list'>
            <li
              className='fr-footer__bottom-item'
              title='Accessibilité : non conforme'
            >
              <span
                className='fr-footer__bottom-link'
              >
                Accessibilité : non conforme
              </span>
            </li>
            <li
              className='fr-footer__bottom-item'
              title='Mentions légales'
            >
              <Link
                className='fr-footer__bottom-link'
                href='/mentions-legales'
              >
                Mentions légales
              </Link>
            </li>
            <li
              className='fr-footer__bottom-item'
              title='Données personnelles et cookies'
            >
              <Link
                className='fr-footer__bottom-link'
                href='/donnees-personnelles-cookies'
              >
                Données personnelles et cookies
              </Link>
            </li>
            {
              estBoutonDocsAPIAffiche ? (
                <li
                  className='fr-footer__bottom-item'
                  title='Données personnelles et cookies'
                >

                  <Link
                    className='fr-footer__bottom-link'
                    href='/swagger'
                    prefetch={false}
                  >
                    Docs API
                  </Link>
                </li>
              ) : null
            }
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default PiedDePage;
