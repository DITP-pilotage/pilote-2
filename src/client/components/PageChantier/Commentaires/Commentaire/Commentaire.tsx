import '@gouvfr/dsfr/dist/component/modal/modal.min.css';
import Titre from '@/components/_commons/Titre/Titre';
import CommentaireProps from '@/components/PageChantier/Commentaires/Commentaire/Commentaire.interface';
import HistoriqueDUnCommentaire from '@/components/PageChantier/Commentaires/Commentaire/Historique/HistoriqueDUnCommentaire';
import Publication from '@/components/PageChantier/Publication/Publication';
import typesCommentaire from '@/client/constants/typesCommentaire';
import { LIMITE_CARACTÈRES_COMMENTAIRE } from '@/server/domain/commentaire/Commentaire.validator';
import FormulaireDePublication from '@/components/_commons/FormulaireDePublication/FormulaireDePublication';
import Alerte from '@/components/_commons/Alerte/Alerte';
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

  return (
    <CommentaireStyled>
      {
        alerte !== null &&
        <Alerte
          message={alerte.message}
          type={alerte.type}
        />
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
            contenuInitial={commentaireÉtat?.contenu}
            limiteDeCaractères={LIMITE_CARACTÈRES_COMMENTAIRE}
            àLAnnulation={() => setModeÉdition(false)}
            àLaPublication={(contenuÀCréer, csrf) => créerUnCommentaire(contenuÀCréer, csrf)}
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
                  className='fr-btn fr-btn--secondary fr-ml-3w bouton-modifier'
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
                className='fr-btn fr-btn--secondary bouton-modifier actions'
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

