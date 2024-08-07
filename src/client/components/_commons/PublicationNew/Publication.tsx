import Alerte from '@/components/_commons/Alerte/Alerte';
import Titre from '@/components/_commons/Titre/Titre';
import PublicationStyled from './Publication.styled';
import usePublication from './usePublication';
import PublicationFormulaire from './PublicationFormulaire/PublicationFormulaire';
import PublicationProps from './Publication.interface';
import PublicationHistorique from './PublicationHistorique/PublicationHistorique';
import PublicationAffichage from './PublicationAffichage/PublicationAffichage';

export default function Publication({
  caractéristiques,
  publicationInitiale,
  réformeId,
  maille,
  modeÉcriture,
  estInteractif,
  territoireCode,
}: PublicationProps) {
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
    <PublicationStyled className='fr-px-0 fr-px-md-1w fr-py-2w'>
      <Titre
        baliseHtml='h3'
        className='fr-h5 fr-mb-1w'
      >
        {modeÉdition ? `Modifier : ${caractéristiques.libelléType}` : caractéristiques.libelléType}
      </Titre>
      {
        !!alerte &&
        <div className='fr-mb-2w'>
          <Alerte
            titre={alerte.titre}
            type={alerte.type}
          />
        </div>
      }
      {
        modeÉdition && modeÉcriture ?
          <PublicationFormulaire
            annulationCallback={désactiverLeModeÉdition}
            caractéristiques={caractéristiques}
            contenuInitial={publication?.contenu}
            erreurCallback={afficherAlerteErreur}
            succèsCallback={publicationCréée}
            territoireCode={territoireCode}
          />
          :
          <>
            <PublicationAffichage publication={publication} />
            {
              estInteractif ? (

                <div className='fr-grid-row fr-grid-row--right'>
                  <div className='fr-col-12 actions fr-mt-1w'>
                    {
                      !!publication &&
                      <PublicationHistorique
                        entité={caractéristiques.entité}
                        maille={maille}
                        réformeId={réformeId}
                        type={caractéristiques.type}
                      />
                    }
                    {
                      modeÉcriture ? (
                        <button
                          className='fr-btn fr-btn--secondary fr-ml-3w bouton-modifier'
                          onClick={activerLeModeÉdition}
                          type='button'
                        >
                          <span
                            aria-hidden='true'
                            className='fr-icon-edit-line fr-mr-1w'
                          />
                          {}
                          Modifier
                        </button>
                      ) : null
                    }
                  </div>
                </div>
              ) : null
            }
          </>
      }
    </PublicationStyled>
  );
}
