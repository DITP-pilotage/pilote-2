import '@gouvfr/dsfr/dist/component/modal/modal.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-design/icons-design.min.css';
import { useState } from 'react';
import router from 'next/router';
import Titre from '@/components/_commons/Titre/Titre';
import CommentaireProps from '@/components/PageChantier/Commentaires/Commentaire/Commentaire.interface';
import HistoriqueDUnCommentaire from '@/components/PageChantier/Commentaires/Commentaire/Historique/HistoriqueDUnCommentaire';
import Publication from '@/components/PageChantier/Publication/Publication';
import typesCommentaire from '@/client/constants/typesCommentaire';
import ChampsDeSaisie from '@/client/components/PageChantier/Publication/ChampsDeSaisie/ChampsDeSaisie';
import { limiteCaractèresCommentaire } from '@/server/domain/commentaire/Commentaire.validator';
import CommentaireStyled from './Commentaire.styled';
import useCommentaire from './useCommentaire';


export default function Commentaire({ type, commentaire }: CommentaireProps) {
  const titre = typesCommentaire[type];
  const chantierId = router.query.id as string; 
  const { 
    auClicPublierCommentaire, 
    modeÉdition, 
    setModeÉdition, 
    commentaireÉtat,
    afficherAlerte,
    setAfficherAlerte,
  } = useCommentaire(commentaire);
  const [contenu, setContenu] = useState(commentaireÉtat?.contenu);
  
  return (
    <CommentaireStyled>
      {
        afficherAlerte === true &&
          <div className="fr-alert fr-alert--success fr-mb-2w">
            <p className="fr-alert__title">
              Commentaire modifié
            </p>
          </div>
        }
      <Titre
        baliseHtml='h3'
        className="fr-text--lead fr-mb-1w"
      >
        { modeÉdition ? 'Modifier le commentaire' : titre }
      </Titre>
      {
        modeÉdition ? (
          <>
            <ChampsDeSaisie
              contenu={contenu}
              libellé='Modification du commentaire'
              limiteDeCaractères={limiteCaractèresCommentaire}
              setContenu={setContenu}
            />
            <div className='actions'>
              <button
                className='fr-btn fr-mr-3w border-radius-4px'
                onClick={() => contenu && auClicPublierCommentaire(contenu, type, chantierId)}
                type='button'
              >
                Publier
              </button>
              <button
                className='fr-btn fr-btn--secondary border-radius-4px'
                onClick={() => {
                  setContenu(commentaireÉtat?.contenu);
                  setModeÉdition(false);
                }}
                type='button'
              >
                Annuler
              </button>
            </div>
          </>
        ) : (
          commentaireÉtat ? (
            <>
              <Publication
                auteur={commentaireÉtat.auteur}
                contenu={commentaireÉtat.contenu}
                date={commentaireÉtat.date}
                messageSiAucunContenu="Le commentaire est vide."
              />
              <div className='actions'>
                <HistoriqueDUnCommentaire
                  type={type}
                />
                <button
                  className='fr-btn fr-btn--secondary fr-ml-3w border-radius-4px'
                  onClick={() => {
                    setModeÉdition(true);
                    setAfficherAlerte(false);
                  }}
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
            </>
          ) : (
            <>
              <p className="fr-text--sm fr-mb-0">
                Aucun commentaire à afficher
              </p>
              <button
                className='fr-btn fr-btn--secondary border-radius-4px actions'
                onClick={() => setModeÉdition(true)}
                type='button'
              >
                Ajouter
              </button>
            </>
          )
        )
      }
    </CommentaireStyled>
  );
}

