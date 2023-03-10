import '@gouvfr/dsfr/dist/component/badge/badge.min.css';
import ovoidBackground from '@gouvfr/dsfr/dist/artwork/background/ovoid.svg';
import technicalError from '@gouvfr/dsfr/dist/artwork/pictograms/system/technical-error.svg';
import PageErreurStyled from './PageErreurStyled';
import PageErreurProps from './PageErreur.interface';
import Titre from '../Titre/Titre';
import Bloc from '../Bloc/Bloc';

export default function PageErreur({ titre, sousTitre, message }: PageErreurProps) {
  return (
    <PageErreurStyled>
      <main>
        <div className="fr-px-15w fr-pb-12w fr-container--fluid">
          <div className='fr-grid-row fr-py-4w'>
            <Titre
              baliseHtml="h1"
              className='fr-my-auto'
            >
              {titre}
            </Titre>
          </div>
          <Bloc>
            <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle fr-grid-row--center">
              <div className="fr-p-0 fr-pr-4w fr-col-12 fr-col-md-6">
                <Titre
                  baliseHtml='h2'
                  className='fr-h4'
                >
                  {sousTitre}
                </Titre>
                <p>
                  {message}
                </p>
              </div>
              <div className="fr-col-12 fr-col-md-3 fr-col-offset-md-1 fr-p-0">
                <svg
                  aria-hidden="true"
                  className="fr-responsive-img fr-artwork"
                  height="150" 
                  viewBox="0 0 160 200"
                  width="160"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <use
                    className="fr-artwork-motif"
                    href={`${ovoidBackground.src}#artwork-motif`}
                  />
                  <use
                    className="fr-artwork-background"
                    href={`${ovoidBackground.src}#artwork-background`}
                  />
                  <g transform="translate(40, 60)">
                    <use
                      className="fr-artwork-decorative"
                      href={`${technicalError.src}#artwork-decorative`}
                    />
                    <use
                      className="fr-artwork-minor"
                      href={`${technicalError.src}#artwork-minor`}
                    />
                    <use
                      className="fr-artwork-major"
                      href={`${technicalError.src}#artwork-major`}
                    />
                  </g>
                </svg>
              </div>
            </div>
          </Bloc>
        </div>
      </main>
    </PageErreurStyled>
  );
}
