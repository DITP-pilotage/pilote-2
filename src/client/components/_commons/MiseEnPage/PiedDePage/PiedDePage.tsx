import '@gouvfr/dsfr/dist/component/footer/footer.min.css';
import Link from 'next/link';

export default function PiedDePage() {
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
            <li className='fr-footer__bottom-item'>
              <span
                className='fr-footer__bottom-link'
              >
                Accessibilité : non conforme
              </span>
            </li>
            <li className='fr-footer__bottom-item'>
              <Link
                className='fr-footer__bottom-link'
                href='/mentions-legales'
              >
                Mentions légales
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
