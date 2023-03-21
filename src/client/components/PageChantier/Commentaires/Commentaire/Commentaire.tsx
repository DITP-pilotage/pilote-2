import '@gouvfr/dsfr/dist/component/modal/modal.min.css';
import Titre from '@/components/_commons/Titre/Titre';
import CommentaireProps from '@/components/PageChantier/Commentaires/Commentaire/Commentaire.interface';
import HistoriqueDUnCommentaire
  from '@/components/PageChantier/Commentaires/Commentaire/Historique/HistoriqueDUnCommentaire';
import Publication from '@/components/PageChantier/Publication/Publication';

export default function Commentaire({ titre, commentaire, type }: CommentaireProps) {
  return (
    <CommentaireStyled>
      <Titre
        baliseHtml='h3'
        className="fr-text--lead fr-mb-1w"
      >
        { modeÉdition ? 'Modifier le commentaire' : titre }
      </Titre>
      {
        commentaire ? (
          <>
            <Publication
              auteur={commentaire.auteur}
              contenu={commentaire.contenu}
              date={commentaire.date}
              messageSiAucunContenu="Le commentaire est vide."
            />
            <HistoriqueDUnCommentaire
              type={type}
            />
          </>
        ) : (
          <p className="fr-text--sm fr-mb-0">
            Aucun commentaire à afficher
          </p>
        )
        commentaire && contenu ?
          (modeÉdition ? (
            <div className='contenu'>
              <label
                className="fr-label fr-sr-only"
                htmlFor="saisie-contenu-commentaire"
              >
                Modification du commentaire
              </label>
              <textarea
                className="fr-input fr-mb-6w"
                id="saisie-contenu-commentaire"
                maxLength={500}
                name="saisie-contenu-commentaire"
                onChange={(e) => setContenu(e.target.value)}
                value={contenu}
              />
              <div className='boutons'>
                <button
                  className='fr-btn fr-mr-1w'
                  onClick={() => setModeÉdition(false)}
                  type='button'
                >
                  Publier
                </button>
                <button
                  className='fr-btn fr-btn--secondary'
                  onClick={() => setModeÉdition(false)}
                  type='button'
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="fr-text--xs texte-gris fr-mb-1w">
                {`Mis à jour le ${formaterDate(commentaire.date, 'jj/mm/aaaa')} | par ${commentaire.auteur}`}
              </p>
              <div className='contenu'>
                <p
                  className="fr-text--sm"
                // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{
                    __html: nettoyerUneChaîneDeCaractèresPourAffichageHTML(contenu),
                  }}
                />
                <button
                  className='fr-btn fr-btn--secondary boutons'
                  onClick={() => setModeÉdition(true)}
                  type='button'
                >
                  Modifier
                </button>
              </div>
            </>
          ))
          : (
            <p className="fr-text--sm fr-mb-0">
              Aucun commentaire à afficher
            </p>
          )
      }
    </CommentaireStyled>
  );
}
