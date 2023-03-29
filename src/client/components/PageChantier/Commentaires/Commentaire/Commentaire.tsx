import '@gouvfr/dsfr/dist/component/modal/modal.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-design/icons-design.min.css';
import { useEffect, useState } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import CommentaireProps from '@/components/PageChantier/Commentaires/Commentaire/Commentaire.interface';
import HistoriqueDUnCommentaire from '@/components/PageChantier/Commentaires/Commentaire/Historique/HistoriqueDUnCommentaire';
import Publication from '@/components/PageChantier/Publication/Publication';
import typesCommentaire from '@/client/constants/typesCommentaire';
import { limiteCaractèresCommentaire } from '@/server/domain/commentaire/Commentaire.validator';
import { récupérerUnCookie } from '@/client/utils/cookies';
import FormulaireDePublication from '@/client/components/PageChantier/Publication/FormulaireDePublication/FormulaireDePublication';
import CommentaireStyled from './Commentaire.styled';
import useCommentaire from './useCommentaire';


export default function Commentaire({ type, commentaire }: CommentaireProps) {
  const titre = typesCommentaire[type];
  const { 
    créerUnCommentaire, 
    modeÉdition, 
    setModeÉdition, 
    commentaireÉtat,
    alerte,
    setAlerte,
  } = useCommentaire(commentaire, type);
  const [contenu, setContenu] = useState(commentaireÉtat?.contenu);
  const [csrf, setCsrf] = useState<string>();
  
  useEffect(() => {
    if (modeÉdition) {
      setCsrf(récupérerUnCookie('csrf'));
    }
  }, [modeÉdition]);

  return (
    <CommentaireStyled>
      {
        alerte !== null &&
          <div className="fr-alert fr-alert--success fr-mb-2w">
            <p className="fr-alert__title">
              {alerte.message}
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
          <FormulaireDePublication
            contenu={contenu}
            csrf={csrf}
            libellé='Modification du commentaire'
            limiteDeCaractères={limiteCaractèresCommentaire}
            onSubmit={() => créerUnCommentaire(contenu, csrf)}
            setContenu={setContenu}
            àLAnnulation={() => {
              setContenu(commentaireÉtat?.contenu);
              setModeÉdition(false);
            }}
          />
           
        ) : (
          commentaireÉtat ? (
            <>
              <Publication
                auteur={commentaireÉtat.auteur}
                contenu={commentaireÉtat.contenu}
                date={commentaireÉtat.date}
                messageSiAucunContenu="Le commentaire est vide."
              />
              <div className='actions fr-mt-4w'>
                <HistoriqueDUnCommentaire
                  type={type}
                />
                <button
                  className='fr-btn fr-btn--secondary fr-ml-3w border-radius-4px'
                  onClick={() => {
                    setModeÉdition(true);
                    setAlerte(null);
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

