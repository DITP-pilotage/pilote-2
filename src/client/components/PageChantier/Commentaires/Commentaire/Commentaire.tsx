import '@gouvfr/dsfr/dist/component/modal/modal.min.css';
import CommentaireProps from '@/components/PageChantier/Commentaires/Commentaire/Commentaire.interface';
import HistoriqueDUnCommentaire from '@/components/PageChantier/Commentaires/Commentaire/Historique/HistoriqueDUnCommentaire';
import Publication from '@/components/PageChantier/Publication/Publication';
import typesCommentaire from '@/client/constants/typesCommentaire';
import Alerte from '@/components/_commons/Alerte/Alerte';
import Titre from '@/components/_commons/Titre/Titre';
import CommentaireStyled from './Commentaire.styled';
import useCommentaire from './useCommentaire';
import CommentaireFormulaire from './CommentaireFormulaire/CommentaireFormulaire';

export default function Commentaire({ type, commentaireInitial }: CommentaireProps) {
  const {
    commentaire,
    modeÉdition,
    alerte,
    commentaireCréé,
    activerLeModeÉdition,
    désactiverLeModeÉdition,
  } = useCommentaire(commentaireInitial);

  return (
    <CommentaireStyled>
      <div className='fr-px-1w fr-py-2w'>

        { !modeÉdition &&
          <Titre
            baliseHtml='h3'
            className="fr-h5 fr-mb-1w"
          >
            { typesCommentaire[type] }
          </Titre>}
        {
            modeÉdition ?
              <CommentaireFormulaire
                annulationCallback={désactiverLeModeÉdition}
                commentaireCrééCallback={commentaireCréé}
                contenuInitial={commentaire?.contenu}
                type={type}
              />
              :
              <>
                {
                  !!alerte &&
                  <div className='fr-mb-4w'>
                    <Alerte
                      message={alerte.message}
                      type={alerte.type}
                    />
                  </div>
                }
                <div className="conteneur">
                  {
                    commentaire
                      ?
                        <Publication
                          auteur={commentaire.auteur}
                          contenu={commentaire.contenu}
                          date={commentaire.date}
                          messageSiAucunContenu="Aucun commentaire."
                        />
                      :
                        <p className='fr-text--sm texte-gris fr-mb-0'>
                          Aucun commentaire.
                        </p>
                  }
                </div>
                <div className='fr-grid-row fr-grid-row--right'>
                  <div className='fr-col-12 actions fr-mt-1w'>
                    {
                        !!commentaire && <HistoriqueDUnCommentaire type={type} />
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
      </div>
    </CommentaireStyled>
  );
}

