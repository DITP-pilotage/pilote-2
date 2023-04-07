import '@gouvfr/dsfr/dist/component/modal/modal.min.css';
import Alerte from '@/components/_commons/Alerte/Alerte';
import Titre from '@/components/_commons/Titre/Titre';
import PublicationStyled from './Publication.styled';
import usePublication from './usePublication';
import PublicationFormulaire from './PublicationFormulaire/PublicationFormulaire';
import PublicationProps from './Publication.interface';
import PublicationHistorique from './PublicationHistorique/PublicationHistorique';
import PublicationAffichage from './PublicationAffichage/PublicationAffichage';

export default function Publication({ type, publicationInitiale, entité, chantierId, maille, codeInsee }: PublicationProps) {
  const {
    publication,
    modeÉdition,
    alerte,
    afficherAlerteErreur,
    publicationCréée,
    activerLeModeÉdition,
    désactiverLeModeÉdition,
  } = usePublication(publicationInitiale);

  return (
    <PublicationStyled className='fr-px-1w fr-py-2w'>
      <Titre
        baliseHtml='h3'
        className="fr-h5 fr-mb-1w"
      >
        { modeÉdition ? `Modifier ${entité}` : type.libellé }
      </Titre>
      {
        !!alerte &&
        <div className='fr-mb-4w'>
          <Alerte
            message={alerte.message}
            type={alerte.type}
          />
        </div>
      }
      {
        modeÉdition ?
          <PublicationFormulaire
            annulationCallback={désactiverLeModeÉdition}
            contenuInitial={publication?.contenu}
            entité={entité}
            erreurCallback={afficherAlerteErreur}
            succèsCallback={publicationCréée}
            type={type.id}
          />
          :
          <>
            <PublicationAffichage publication={publication} />
            <div className='fr-grid-row fr-grid-row--right'>
              <div className='fr-col-12 actions fr-mt-1w'>
                {
                  !!publication && 
                    <PublicationHistorique
                      chantierId={chantierId}
                      codeInsee={codeInsee}
                      entité={entité}
                      maille={maille}
                      type={type.id}
                    />
                }
                <button
                  className='fr-btn fr-btn--secondary fr-ml-3w bouton-modifier'
                  onClick={activerLeModeÉdition}
                  type='button'
                >
                  <span
                    aria-hidden="true"
                    className="fr-icon-edit-line fr-mr-1w"
                  />
                  {}
                  Modifier
                </button>
              </div>
            </div>
          </>
      }
    </PublicationStyled>
  );
}

