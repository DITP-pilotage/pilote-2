import '@gouvfr/dsfr/dist/component/modal/modal.min.css';
import Titre from '@/components/_commons/Titre/Titre';
import ModaleProps from './Modale.interface';
import ModaleStyled from './Modale.styled';
import useModale from './useModale';

export default function Modale({ children, titre, sousTitre, idHtml, ouvertureCallback, fermetureCallback }: ModaleProps) {
  const { modaleRef } = useModale(ouvertureCallback, fermetureCallback);

  return (
    <ModaleStyled>
      <dialog
        className='fr-modal'
        id={idHtml}
        ref={modaleRef}
      >
        <div className='fr-container fr-container--fluid fr-container-md'>
          <div className='fr-modal__body fr-col-12 fr-col-md-10 fr-col-lg-9 fr-mx-auto modale-conteneur'>
            <div className='fr-modal__header fr-pb-0 fr-mr-2w fr-mr-md-0'>
              <button
                aria-controls={idHtml}
                className='fr-link--close fr-link bouton-fermer-modale'
                title='Fermer la fenêtre modale'
                type='button'
              >
                Fermer
              </button>
            </div>
            <div className='fr-mx-4w'>
              <Titre
                baliseHtml='h1'
                className='fr-modal__title fr-mb-1w'
              >
                {titre}
              </Titre>
              {
                !!sousTitre &&
                <p className='fr-text--lg bold'>
                  {sousTitre}
                </p>
              }
            </div>
            <div className='fr-modal__content fr-px-4w fr-mb-4w modale-contenu'>
              { children }
            </div>
          </div>
        </div>
      </dialog>
    </ModaleStyled>
  );
}
